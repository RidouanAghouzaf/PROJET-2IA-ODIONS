import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechFlow Inc",
    content: "Odions transformed how we manage our campaigns. The AI chatbots have increased our customer engagement by 300%. It's simply game-changing.",
    rating: 5,
    image: "SJ",
  },
  {
    name: "Michael Chen",
    role: "CEO",
    company: "GrowthLabs",
    content: "The analytics dashboard is incredibly powerful. We make data-driven decisions faster than ever. Odions paid for itself within the first month.",
    rating: 5,
    image: "MC",
  },
  {
    name: "Emily Rodriguez",
    role: "Operations Manager",
    company: "Swift Delivery Co",
    content: "Managing deliveries across multiple partners used to be a nightmare. Odions made it seamless. The real-time tracking is exactly what we needed.",
    rating: 5,
    image: "ER",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Trusted by
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Industry Leaders
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See what our customers have to say about their experience with Odions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.name}
              className="p-8 space-y-6 hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 bg-card/80 backdrop-blur-sm animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Rating */}
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
