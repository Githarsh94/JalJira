"use client";

import { Check, Droplet, Building2, CreditCard, Eye } from "lucide-react";
import { useState } from "react";
import { DialCodeCombobox } from "../components/DialCodeCombobox";

// ─── Data ─────────────────────────────────────────────────────────────────────

const plans = [
    {
        name: "Starter",
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: "For individuals and small teams getting started.",
        features: [
            "Up to 5 users",
            "3 active projects",
            "Basic kanban boards",
            "5GB storage",
            "Community support",
        ],
        popular: false,
    },
    {
        name: "Pro",
        monthlyPrice: 29,
        yearlyPrice: 23,
        description: "For growing teams that need more power and flexibility.",
        features: [
            "Up to 25 users",
            "Unlimited projects",
            "Advanced reporting",
            "GitHub & Slack integration",
            "50GB storage",
            "Priority support",
        ],
        popular: true,
    },
    {
        name: "Enterprise",
        monthlyPrice: 99,
        yearlyPrice: 79,
        description: "For large teams with advanced security and admin needs.",
        features: [
            "Unlimited users",
            "Unlimited projects",
            "SSO & SAML",
            "Audit logs",
            "Unlimited storage",
            "Dedicated support",
            "Custom SLA",
        ],
        popular: false,
    },
];

const timelineSteps = [
    { label: "Authentication", icon: Check },
    { label: "Choose Plan", icon: CreditCard },
    { label: "Additional Info", icon: Building2 },
    { label: "Preview", icon: Eye },
];

// ─── Timeline ─────────────────────────────────────────────────────────────────

function StepTimeline({ currentStep }: { currentStep: number }) {
    return (
        <div className="w-full flex items-center justify-center mb-12">
            {timelineSteps.map((step, index) => {
                // node 0 (auth) is always done; nodes 1..currentStep are done
                const isDone = index <= currentStep;
                const isActive = index === currentStep + 1;
                const Icon = step.icon;

                return (
                    <div key={step.label} className="flex items-center">
                        {/* Node */}
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : isActive
                                        ? "border-primary text-primary bg-background"
                                        : "border-muted-foreground/30 text-muted-foreground/40 bg-background"
                                    }`}
                            >
                                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span
                                className={`text-xs font-medium whitespace-nowrap ${isDone
                                    ? "text-primary"
                                    : isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground/50"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector */}
                        {index < timelineSteps.length - 1 && (
                            <div
                                className={`h-0.5 w-16 sm:w-24 md:w-32 mx-2 mt-[-18px] transition-all ${index < currentStep + 1 ? "bg-primary" : "bg-muted-foreground/20"
                                    }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Step 1: Choose Plan ──────────────────────────────────────────────────────

function StepPlans({
    selectedPlan,
    setSelectedPlan,
    annual,
    setAnnual,
    onNext,
}: {
    selectedPlan: string;
    setSelectedPlan: (p: string) => void;
    annual: boolean;
    setAnnual: (a: boolean) => void;
    onNext: () => void;
}) {
    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-2">Choose your plan</h2>
                <p className="text-muted-foreground">Pick the plan that fits your team. You can always upgrade later.</p>

                <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1 mt-6">
                    <button
                        onClick={() => setAnnual(false)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!annual ? "bg-card shadow text-foreground" : "text-muted-foreground"
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setAnnual(true)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${annual ? "bg-card shadow text-foreground" : "text-muted-foreground"
                            }`}
                    >
                        Annual <span className="text-primary ml-1">–20%</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {plans.map((plan) => {
                    const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
                    const isSelected = selectedPlan === plan.name;
                    return (
                        <div
                            key={plan.name}
                            onClick={() => setSelectedPlan(plan.name)}
                            className={`relative rounded-2xl border-2 p-8 cursor-pointer transition-all ${isSelected
                                ? "border-primary shadow-xl shadow-primary/10 bg-card"
                                : plan.popular
                                    ? "border-primary/40 shadow-lg bg-card"
                                    : "border-border bg-card hover:border-muted-foreground/40"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                                        Most popular
                                    </span>
                                </div>
                            )}

                            {isSelected && (
                                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-bold text-foreground">
                                        {price === 0 ? "Free" : `$${price}`}
                                    </span>
                                    {price > 0 && <span className="text-muted-foreground mb-1.5">/mo</span>}
                                </div>
                                {annual && price > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">billed annually</p>
                                )}
                            </div>

                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
                                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end mt-10">
                <button
                    onClick={onNext}
                    disabled={!selectedPlan}
                    className="px-8 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Continue →
                </button>
            </div>
        </div>
    );
}

// ─── Step 2: Additional Info ──────────────────────────────────────────────────

type AdditionalInfo = {
    orgName: string;
    address: string;
    country: string;
    phoneCode: string;
    phone: string;
};

function StepAdditionalInfo({
    info,
    setInfo,
    onNext,
    onBack,
}: {
    info: AdditionalInfo;
    setInfo: (i: AdditionalInfo) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const update = (field: keyof AdditionalInfo, value: string) =>
        setInfo({ ...info, [field]: value });

    const isValid = info.orgName.trim() && info.address.trim() && info.country.trim() && info.phone.trim();

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-2">Tell us about your team</h2>
                <p className="text-muted-foreground">Help us personalise your experience.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
                {/* Organisation name */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Organisation / Workspace name <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Acme Corp"
                            value={info.orgName}
                            onChange={(e) => update("orgName", e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Address <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="123 Main St, City, Country"
                        value={info.address}
                        onChange={(e) => update("address", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                {/* Country */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Country <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="United States"
                        value={info.country}
                        onChange={(e) => update("country", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Phone number <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2">
                        <DialCodeCombobox
                            value={info.phoneCode}
                            onChange={(v) => update("phoneCode", v)}
                        />
                        <input
                            type="tel"
                            placeholder="(555) 000-0000"
                            value={info.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                {/* Role — fixed as Admin */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                    <div className="w-full px-4 py-2.5 rounded-md border border-input bg-muted text-sm text-muted-foreground select-none">
                        Admin
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">The first user of a workspace is always an Admin.</p>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!isValid}
                    className="px-8 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Continue →
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Preview ──────────────────────────────────────────────────────────

function StepPreview({
    selectedPlan,
    annual,
    info,
    onBack,
}: {
    selectedPlan: string;
    annual: boolean;
    info: AdditionalInfo;
    onBack: () => void;
}) {
    const plan = plans.find((p) => p.name === selectedPlan);
    const price = plan ? (annual ? plan.yearlyPrice : plan.monthlyPrice) : 0;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-2">Review your setup</h2>
                <p className="text-muted-foreground">Everything look good? Let&#39;s get you started.</p>
            </div>

            <div className="space-y-4">
                {/* Plan summary */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Plan</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-bold text-foreground">{plan?.name}</p>
                            <p className="text-sm text-muted-foreground">{plan?.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">
                                {price === 0 ? "Free" : `$${price}/mo`}
                            </p>
                            {annual && price > 0 && (
                                <p className="text-xs text-muted-foreground">billed annually</p>
                            )}
                        </div>
                    </div>
                    <ul className="mt-4 grid grid-cols-2 gap-y-2">
                        {plan?.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Team summary */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Team Info</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-0.5">Organisation</p>
                            <p className="font-medium text-foreground">{info.orgName}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-0.5">Role</p>
                            <p className="font-medium text-foreground">Admin</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-muted-foreground mb-0.5">Address</p>
                            <p className="font-medium text-foreground">{info.address}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-0.5">Country</p>
                            <p className="font-medium text-foreground">{info.country}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-0.5">Phone</p>
                            <p className="font-medium text-foreground">{info.phoneCode} {info.phone}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
                >
                    ← Back
                </button>
                <button
                    className="px-8 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    onClick={() => alert("Checkout coming soon!")}
                >
                    {price === 0 ? "Create workspace →" : "Proceed to checkout →"}
                </button>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    // step: 0 = Choose Plan, 1 = Additional Info, 2 = Preview
    // Timeline node 0 (Authentication) is always shown as completed.
    const [step, setStep] = useState(0);

    const [selectedPlan, setSelectedPlan] = useState("Pro");
    const [annual, setAnnual] = useState(true);
    const [info, setInfo] = useState<AdditionalInfo>({
        orgName: "",
        address: "",
        country: "",
        phoneCode: "+1",
        phone: "",
    });

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            {/* Header */}
            <header className="bg-background border-b border-border">
                <div className="container mx-auto px-6 py-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                        <Droplet className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-foreground text-lg">Jaljira</span>
                </div>
            </header>

            <main className="flex-1 container mx-auto max-w-5xl px-6 py-12">
                {/* Timeline — always rendered, step state drives it */}
                <StepTimeline currentStep={step} />

                {/* Step components toggled via CSS — page URL never changes */}
                <div className={step === 0 ? "block" : "hidden"}>
                    <StepPlans
                        selectedPlan={selectedPlan}
                        setSelectedPlan={setSelectedPlan}
                        annual={annual}
                        setAnnual={setAnnual}
                        onNext={() => setStep(1)}
                    />
                </div>

                <div className={step === 1 ? "block" : "hidden"}>
                    <StepAdditionalInfo
                        info={info}
                        setInfo={setInfo}
                        onNext={() => setStep(2)}
                        onBack={() => setStep(0)}
                    />
                </div>

                <div className={step === 2 ? "block" : "hidden"}>
                    <StepPreview
                        selectedPlan={selectedPlan}
                        annual={annual}
                        info={info}
                        onBack={() => setStep(1)}
                    />
                </div>
            </main>
        </div>
    );
}
