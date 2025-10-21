import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "29",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 1,000 contacts",
      "2 AI chatbots",
      "Basic analytics",
      "Email support",
      "5 campaigns per month",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "99",
    description: "For growing businesses that need more",
    features: [
      "Up to 10,000 contacts",
      "Unlimited AI chatbots",
      "Advanced analytics",
      "Priority support",
      "Unlimited campaigns",
      "Custom integrations",
      "A/B testing",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with specific needs",
    features: [
      "Unlimited contacts",
      "Unlimited AI chatbots",
      "Custom analytics",
      "24/7 dedicated support",
      "Unlimited campaigns",
      "Custom integrations",
      "White-label solution",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative p-8 space-y-8 transition-all duration-500 animate-fade-in-up ${
                plan.popular
                  ? "border-2 border-primary shadow-2xl scale-105 bg-card"
                  : "border-2 hover:border-primary/30 hover:shadow-xl bg-card/80 backdrop-blur-sm"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  {plan.price === "Custom" ? (
                    <span className="text-4xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
              </div>

              <Button
                className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-105"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {plan.cta}
              </Button>

              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <p className="text-muted-foreground">
            All plans include our 30-day money-back guarantee.{" "}
            <a href="#" className="text-primary font-medium hover:underline">
              Compare plans in detail →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
