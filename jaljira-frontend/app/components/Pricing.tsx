"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

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
    cta: "Get started free",
    popular: false,
    variant: "outline" as const,
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
    cta: "Start free trial",
    popular: true,
    variant: "default" as const,
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
    cta: "Contact sales",
    popular: false,
    variant: "outline" as const,
  },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Scalable plans for every team
          </h2>
          <p className="text-muted-foreground mb-8">
            Start free. Upgrade as you grow. No hidden fees.
          </p>

          <div className="inline-flex items-center gap-1 bg-secondary rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !annual ? "bg-card shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                annual ? "bg-card shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Annual <span className="text-primary ml-1">–20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => {
            const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular
                    ? "border-primary shadow-xl shadow-primary/10 bg-card"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground mb-1.5">/mo</span>
                    )}
                  </div>
                  {annual && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">billed annually</p>
                  )}
                </div>

                <Link href="/auth" className="w-full block mb-6">
                  <button
                    className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
                        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>

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

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
