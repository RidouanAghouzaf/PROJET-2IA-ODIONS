import { Zap, MessageCircle, BarChart3, Package } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Smart Campaigns",
    description: "Manage and automate audience engagement with intelligent campaign tools. Create, schedule, and optimize your marketing efforts effortlessly.",
    gradient: "from-primary to-primary/80",
  },
  {
    icon: MessageCircle,
    title: "AI Chatbots",
    description: "Boost interaction with intelligent bots that understand context and provide personalized responses. Available 24/7 for your customers.",
    gradient: "from-accent to-accent/80",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Visualize performance in real-time with comprehensive dashboards. Track metrics that matter and make data-driven decisions.",
    gradient: "from-primary to-accent",
  },
  {
    icon: Package,
    title: "Delivery Management",
    description: "Track orders and manage delivery partners seamlessly. Get real-time updates and maintain complete visibility of your logistics.",
    gradient: "from-accent to-primary",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 sm:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Powerful Features for
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Modern Businesses
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to streamline operations, engage customers, and grow your business in one intelligent platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group p-8 hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/50 bg-card/50 backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="space-y-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4">
                  <a
                    href="#"
                    className="inline-flex items-center text-primary font-medium hover:gap-2 transition-all duration-300"
                  >
                    Learn more
                    <span className="ml-1 group-hover:ml-2 transition-all duration-300">→</span>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
