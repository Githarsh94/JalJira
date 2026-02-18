import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-3xl text-center">
        <div className="bg-primary rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to accelerate your delivery?
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join 12,000+ teams shipping faster with AgileFlow. Start for free — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-background text-foreground hover:bg-background/90 text-base px-8 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-md text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 focus:ring-offset-2">
              Talk to sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;