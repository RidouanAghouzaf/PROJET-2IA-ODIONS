// src/pages/NotAuthorized.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotAuthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Not authorized</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate(-1)}>Go back</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
        </div>
      </div>
    </div>
  );
}
