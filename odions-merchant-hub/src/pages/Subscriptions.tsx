"use client";

import { useEffect, useState } from "react";
import { Check, Crown, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:3000/api/subscriptions";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["1 audience", "Basic analytics"],
  },
  {
    id: "basic",
    name: "Basic",
    price: 199,
    popular: true,
    features: ["Unlimited audiences", "WhatsApp campaigns", "Chatbots"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 399,
    features: ["AI segmentation", "Advanced analytics", "Priority support"],
  },
];

export default function Subscriptions() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };

  useEffect(() => {
    fetch(API_URL, { headers })
      .then(res => res.json())
      .then(data => setSubscription(data.subscription))
      .finally(() => setLoading(false));
  }, []);

  const upgrade = async (planId: string) => {
    try {
      await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify({ plan_id: planId }),
      });

      toast({ title: "Subscription updated" });
      window.location.reload();
    } catch {
      toast({ title: "Upgrade failed", variant: "destructive" });
    }
  };

  const currentPlan = subscription?.subscription_plans?.name || "Free";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">
          Choose the plan that fits your business growth
        </p>
      </div>

      {/* CURRENT PLAN */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-1/3" />
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{currentPlan}</span>
              <Badge>{currentPlan}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const active = plan.name === currentPlan;

          return (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute top-4 right-4">
                  <Crown className="h-3 w-3 mr-1" /> Most Popular
                </Badge>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-3xl font-bold">
                  {plan.price === 0 ? "Free" : `${plan.price} DH`}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-2 text-sm">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {active ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => upgrade(plan.id)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
