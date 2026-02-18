import { ArrowRight, Play } from "lucide-react";
// import heroImage from "@/assets/hero-dashboard.png";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-6 hero-section">
      <div className="container mx-auto text-center max-w-4xl">
        <span className="inline-flex items-center justify-center mb-6 text-primary border border-primary/30 bg-primary/5 px-3 py-1 rounded-full text-sm font-medium">
          🚀 Now with AI-powered sprint planning
        </span>

        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
          Streamline Your{" "}
          <span className="text-primary">Agile Workflow</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          The all-in-one project management platform built for modern engineering teams. 
          Plan sprints, track progress, and ship faster — together.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            Get started free <ArrowRight className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-base px-8 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <Play className="w-4 h-4" /> Watch demo
          </button>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
            <img
              src={heroImage}
              alt="AgileFlow dashboard screenshot"
              className="w-full"
            />
          </div> */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-border/50 pointer-events-none" />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          {[
            { label: "Teams using AgileFlow", value: "12,000+" },
            { label: "Tasks completed", value: "4.2M" },
            { label: "Uptime", value: "99.9%" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
