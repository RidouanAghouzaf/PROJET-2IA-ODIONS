import { Rocket, Settings, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Rocket,
    title: "Create",
    description: "Set up your campaigns, audiences, and chatbots in minutes with our intuitive interface.",
    step: "01",
  },
  {
    icon: Settings,
    title: "Automate",
    description: "Let AI handle the heavy lifting. Smart automation works around the clock for you.",
    step: "02",
  },
  {
    icon: TrendingUp,
    title: "Analyze",
    description: "Track performance with real-time analytics and optimize for maximum impact.",
    step: "03",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-4 mb-20 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Simple Process,
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Powerful Results
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started in three easy steps and transform your business operations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative animate-fade-in-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-24 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-accent/50" />
              )}

              <div className="relative text-center space-y-6 p-8">
                {/* Step number */}
                <div className="absolute -top-4 -right-4 text-8xl font-bold text-primary/10">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-3xl blur-xl opacity-50 animate-glow-pulse" />
                  <div className="relative w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <p className="text-lg text-muted-foreground mb-6">
            Ready to streamline your business?
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
            Start Your Free Trial
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
