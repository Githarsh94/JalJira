"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans, submitOnboarding, Plan, getSprintTemplates, SprintTemplate, createSprint } from "../../lib/api";
import { Loader2, AlertCircle, Check } from "lucide-react";

const USER_DATA_KEY = "jaljira_user";

interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export default function OnboardingPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [sprintTemplates, setSprintTemplates] = useState<SprintTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [annual, setAnnual] = useState(true);
    const [organizationId, setOrganizationId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        organization_name: "",
        plan_id: "",
        sprint_template_id: "",
        start_date: "",
    });

    useEffect(() => {
        const userData = localStorage.getItem(USER_DATA_KEY);
        if (!userData) {
            router.push("/auth");
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
        } catch (e) {
            router.push("/auth");
            return;
        }

        Promise.all([getPlans(), getSprintTemplates()])
            .then(([fetchedPlans, fetchedTemplates]) => {
                setPlans(fetchedPlans);
                setSprintTemplates(fetchedTemplates);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || "Failed to load data");
                setLoading(false);
            });
    }, [router]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        
        // Validate date range if it's the start_date field
        if (name === "start_date" && value) {
            if (!isDateInRange(value)) {
                setError(`Invalid selection. The sprint start date must be within ${getFormattedRange()}`);
                return;
            }
            setError(null);
        }
        
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePlanSelect = (planId: string) => {
        setFormData((prev) => ({
            ...prev,
            plan_id: planId,
        }));
    };

    const handleSprintTemplateSelect = (templateId: string) => {
        setFormData((prev) => ({
            ...prev,
            sprint_template_id: templateId,
        }));
    };

    const getPlanMetadata = (plan: Plan) => {
        if (plan.criteria && typeof plan.criteria === "object") {
            return plan.criteria as any;
        }
        return null;
    };

    /**
     * Get date range for sprint start date (current date ±7 days)
     */
    const getDateRange = () => {
        const today = new Date();
        const minDate = new Date(today);
        minDate.setDate(today.getDate() - 7);
        
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 7);
        
        return { minDate, maxDate, today };
    };

    /**
     * Format date for datetime-local input (YYYY-MM-DDTHH:mm)
     */
    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    /**
     * Validate if selected date is within allowed range
     */
    const isDateInRange = (dateStr: string): boolean => {
        if (!dateStr) return true;
        
        const { minDate, maxDate } = getDateRange();
        const selectedDate = new Date(dateStr);
        
        return selectedDate >= minDate && selectedDate <= maxDate;
    };

    /**
     * Get formatted range display string
     */
    const getFormattedRange = (): string => {
        const { minDate, maxDate } = getDateRange();
        const options: Intl.DateTimeFormatOptions = { 
            month: "short", 
            day: "numeric", 
            year: "numeric" 
        };
        
        return `${minDate.toLocaleDateString("en-US", options)} to ${maxDate.toLocaleDateString("en-US", options)}`;
    };

    const validateForm = (): boolean => {
        if (!formData.organization_name.trim()) {
            setError("Organization name is required");
            return false;
        }
        if (!formData.plan_id) {
            setError("Please select a plan");
            return false;
        }
        if (!formData.sprint_template_id) {
            setError("Please select a sprint template");
            return false;
        }
        if (!formData.start_date) {
            setError("Please select a start date");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm() || !user) {
            return;
        }

        setSubmitting(true);

        try {
            // First, submit onboarding to get organization created
            const onboardingResult = await submitOnboarding(
                user.id,
                formData.organization_name,
                formData.plan_id
            );

            if (!onboardingResult.success) {
                setError(onboardingResult.message || "Onboarding failed");
                setSubmitting(false);
                return;
            }

            // Now create the sprint for the organization
            const sprintResult = await createSprint(
                onboardingResult.organization_id,
                formData.sprint_template_id,
                formData.start_date
            );

            if (sprintResult.success) {
                // Store organization ID for later use
                localStorage.setItem("org_id", onboardingResult.organization_id);
                localStorage.removeItem(USER_DATA_KEY);
                router.push("/dashboard");
            } else {
                setError(sprintResult.error || "Failed to create sprint");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading plans...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">JalJira</h2>
                            <p className="text-sm text-gray-600">Agile Project Management</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                            Step 2 of 2: Configuration
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        {/* Header */}
                        <div className="mb-12">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Welcome, {user.firstName || user.email}!
                            </h1>
                            <p className="text-gray-600">
                                Let's set up your organization to get started.
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Organization Name */}
                        <div>
                            <label
                                htmlFor="organization_name"
                                className="block text-sm font-medium text-gray-900 mb-2"
                            >
                                Organization Name *
                            </label>
                            <input
                                type="text"
                                id="organization_name"
                                name="organization_name"
                                value={formData.organization_name}
                                onChange={handleInputChange}
                                placeholder="Enter your organization name"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                disabled={submitting}
                            />
                        </div>

                        {/* Plan Selection Section */}
                        <div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-900 mb-4">
                                    Select a Plan *
                                </label>

                                {/* Billing Toggle */}
                                <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setAnnual(false)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                            !annual
                                                ? "bg-white shadow text-gray-900"
                                                : "text-gray-600"
                                        }`}
                                        disabled={submitting}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAnnual(true)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                            annual
                                                ? "bg-white shadow text-gray-900"
                                                : "text-gray-600"
                                        }`}
                                        disabled={submitting}
                                    >
                                        Annual <span className="text-blue-600 ml-1">–20%</span>
                                    </button>
                                </div>
                            </div>

                            {plans.length === 0 ? (
                                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                                    No plans available
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {plans.map((plan) => {
                                        const metadata = getPlanMetadata(plan);
                                        const price = annual
                                            ? metadata?.yearlyPrice
                                            : metadata?.monthlyPrice;
                                        const isPopular = metadata?.popular || false;
                                        const isSelected = formData.plan_id === plan.id;

                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => handlePlanSelect(plan.id)}
                                                disabled={submitting}
                                                className={`relative rounded-2xl border p-8 text-left transition-all ${
                                                    isSelected
                                                        ? isPopular
                                                            ? "border-blue-500 shadow-xl shadow-blue-500/10 bg-white ring-2 ring-blue-500"
                                                            : "border-blue-500 shadow-md bg-gray-50 ring-2 ring-blue-500"
                                                        : isPopular
                                                            ? "border-blue-300 shadow-lg shadow-blue-500/10 bg-white"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                } ${
                                                    submitting
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : "cursor-pointer"
                                                }`}
                                            >
                                                {isPopular && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                                            Most popular
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Plan Header */}
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {metadata?.name || "Plan"}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-4">
                                                        {metadata?.description ||
                                                            "Plan description"}
                                                    </p>

                                                    {/* Price */}
                                                    <div className="flex items-end gap-1 mb-2">
                                                        <span className="text-4xl font-bold text-gray-900">
                                                            {price === 0
                                                                ? "Free"
                                                                : `$${price}`}
                                                        </span>
                                                        {price > 0 && (
                                                            <span className="text-gray-600 mb-1.5">
                                                                /mo
                                                            </span>
                                                        )}
                                                    </div>
                                                    {annual && price > 0 && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            billed annually
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Features */}
                                                <ul className="space-y-3 mb-6">
                                                    {metadata?.features &&
                                                    Array.isArray(
                                                        metadata.features
                                                    ) ? (
                                                        metadata.features.map(
                                                            (feature: string) => (
                                                                <li
                                                                    key={
                                                                        feature
                                                                    }
                                                                    className="flex items-center gap-2.5 text-sm text-gray-700"
                                                                >
                                                                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                    {feature}
                                                                </li>
                                                            )
                                                        )
                                                    ) : (
                                                        <li className="text-sm text-gray-600">
                                                            No features listed
                                                        </li>
                                                    )}
                                                </ul>

                                                {/* Selection Indicator */}
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                            isSelected
                                                                ? "border-blue-600 bg-blue-600"
                                                                : "border-gray-300 bg-white"
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <Check className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {isSelected
                                                            ? "Selected"
                                                            : "Select plan"}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sprint Template Selection Section */}
                        {formData.plan_id && (
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-4">
                                    Select Sprint Configuration *
                                </label>

                                {sprintTemplates.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                                        No sprint templates available
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sprintTemplates.map((template) => {
                                            const isSelected = formData.sprint_template_id === template.id;

                                            return (
                                                <button
                                                    key={template.id}
                                                    type="button"
                                                    onClick={() => handleSprintTemplateSelect(template.id)}
                                                    disabled={submitting}
                                                    className={`rounded-lg border p-6 text-left transition-all ${
                                                        isSelected
                                                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    } ${
                                                        submitting
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : "cursor-pointer"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 mb-1">
                                                                {template.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                {template.description}
                                                            </p>
                                                            <p className="text-xs text-blue-600 font-medium">
                                                                {template.durationDays} day sprint cycle
                                                            </p>
                                                        </div>
                                                        <div
                                                            className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                                                isSelected
                                                                    ? "border-blue-600 bg-blue-600"
                                                                    : "border-gray-300 bg-white"
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sprint Start Date Section */}
                        {formData.sprint_template_id && (
                            <div>
                                <label
                                    htmlFor="start_date"
                                    className="block text-sm font-medium text-gray-900 mb-2"
                                >
                                    Sprint Start Date *
                                </label>
                                <input
                                    type="datetime-local"
                                    id="start_date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    min={formatDateForInput(getDateRange().minDate)}
                                    max={formatDateForInput(getDateRange().maxDate)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    disabled={submitting}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    The sprint end date will be calculated automatically. Allowed date range: <span className="font-semibold text-gray-700">{getFormattedRange()}</span>
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Completing Setup...
                                    </>
                                ) : (
                                    "Complete Onboarding"
                                )}
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 mt-auto">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            © 2026 JalJira. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
                                Privacy
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
                                Terms
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition">
                                Support
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
