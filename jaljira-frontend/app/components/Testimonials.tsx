const testimonials = [
  {
    name: "Sarah Chen",
    role: "Engineering Manager, Stripe",
    avatar: "SC",
    quote:
      "JalJira cut our sprint planning time in half. The GitHub integration is seamless — our engineers actually enjoy updating tickets now.",
  },
  {
    name: "Marcus Rivera",
    role: "CTO, Loom",
    avatar: "MR",
    quote:
      "We evaluated 6 different tools. JalJira was the only one that didn't require us to change how we work. It just fit.",
  },
  {
    name: "Priya Patel",
    role: "Product Lead, Linear",
    avatar: "PP",
    quote:
      "The reporting features alone are worth it. I can finally show stakeholders exactly where we are without spending hours on slides.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 px-6 bg-secondary/40">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Loved by engineering teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, avatar, quote }) => (
            <div key={name} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {avatar}
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">{name}</div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
