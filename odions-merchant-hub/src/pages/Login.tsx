// // src/pages/Login.tsx
// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Eye, EyeOff, Mail, Lock } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/auth/AuthProvider";

// export default function Login() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     rememberMe: false,
//   });
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { toast } = useToast();
//   const { login, user, isAuthenticated } = useAuth();

//   // If user is already logged in, redirect them to their dashboard
//   useEffect(() => {
//     if (isAuthenticated && user) {
//       if (user.role === "admin") navigate("/users", { replace: true });
//       else navigate("/orders", { replace: true });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isAuthenticated]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       const loggedUser = await login(formData.email, formData.password); // uses AuthProvider.login
//       setIsLoading(false);

//       toast({
//         title: "Login successful",
//         description: `Welcome back, ${loggedUser.role}!`,
//       });

//       // redirect to where the user initially wanted to go, if any
//       const state = (location.state as any) || {};
//       const from = state.from?.pathname;

//       if (from) {
//         navigate(from);
//         return;
//       }

//       // otherwise go by role
//       if (loggedUser.role === "admin") navigate("/users");
//       else navigate("/orders");
//     } catch (err: any) {
//       setIsLoading(false);
//       toast({
//         title: "Login failed",
//         description: err?.message || "Please check your credentials",
//       });
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
//       <div className="w-full max-w-md animate-fade-in">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float">
//             <span className="text-white font-bold text-2xl">O</span>
//           </div>
//           <h1 className="text-3xl font-bold text-foreground">ODIONS</h1>
//           <p className="text-muted-foreground">E-commerce Management Platform</p>
//         </div>

//         <Card className="glass border-card-border/50">
//           <CardHeader className="text-center">
//             <CardTitle className="text-2xl">Welcome back</CardTitle>
//             <CardDescription>Sign in to your account to access your dashboard</CardDescription>
//           </CardHeader>

//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email address</Label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="email"
//                     name="email"
//                     type="email"
//                     placeholder="Enter your email"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     className="pl-10"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="password"
//                     name="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={formData.password}
//                     onChange={handleInputChange}
//                     className="pl-10 pr-10"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                   >
//                     {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                   </button>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="rememberMe"
//                     name="rememberMe"
//                     checked={formData.rememberMe}
//                     onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
//                   />
//                   <Label htmlFor="rememberMe" className="text-sm">
//                     Remember me
//                   </Label>
//                 </div>
//                 <button type="button" className="text-sm text-primary hover:underline" onClick={() => toast({ title: "Password reset link sent to your email" })}>
//                   Forgot password?
//                 </button>
//               </div>

//               <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 h-11" disabled={isLoading}>
//                 {isLoading ? "Signing in..." : "Sign in"}
//               </Button>
//             </form>

//             <div className="text-center mt-6 pt-6 border-t border-border">
//               <p className="text-sm text-muted-foreground">
//                 Don't have an account?{" "}
//                 <button onClick={() => navigate("/register")} className="text-primary hover:underline font-medium">
//                   Sign up here
//                 </button>
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="mt-4 bg-muted/50 border-dashed">
//           <CardContent className="pt-4">
//             <p className="text-xs text-muted-foreground text-center">
//               <strong>Demo:</strong> admin@demo.com • password123
//             </p>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
// src/pages/Login.tsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Eye, EyeOff, Mail, Lock } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/hooks/use-toast";
// // import { useAuth } from "@/context/AuthProvider";
// import { useAuth } from "@/auth/AuthProvider";


// export default function Login() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     rememberMe: false,
//   });

//   const { toast } = useToast();
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     const success = await login(formData.email, formData.password);

//     setIsLoading(false);

//     if (!success) {
//       toast({
//         title: "Login failed",
//         description: "Invalid credentials or server error",
//         variant: "destructive",
//       });
//     } else {
//       toast({
//         title: "Login successful",
//         description: `Welcome back!`,
//       });
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
//       <div className="w-full max-w-md animate-fade-in">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float">
//             <span className="text-white font-bold text-2xl">O</span>
//           </div>
//           <h1 className="text-3xl font-bold text-foreground">ODIONS</h1>
//           <p className="text-muted-foreground">E-commerce Management Platform</p>
//         </div>

//         <Card className="glass border-card-border/50">
//           <CardHeader className="text-center">
//             <CardTitle className="text-2xl">Welcome back</CardTitle>
//             <CardDescription>Sign in to your account to access your dashboard</CardDescription>
//           </CardHeader>

//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email address</Label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="email"
//                     name="email"
//                     type="email"
//                     placeholder="Enter your email"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     className="pl-10"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="password"
//                     name="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={formData.password}
//                     onChange={handleInputChange}
//                     className="pl-10 pr-10"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                   >
//                     {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                   </button>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="rememberMe"
//                     name="rememberMe"
//                     checked={formData.rememberMe}
//                     onCheckedChange={(checked) =>
//                       setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))
//                     }
//                   />
//                   <Label htmlFor="rememberMe" className="text-sm">
//                     Remember me
//                   </Label>
//                 </div>
//                 <button
//                   type="button"
//                   className="text-sm text-primary hover:underline"
//                   onClick={() =>
//                     toast({ title: "Password reset", description: "Feature not implemented yet." })
//                   }
//                 >
//                   Forgot password?
//                 </button>
//               </div>

//               <Button type="submit" className="w-full bg-gradient-primary h-11" disabled={isLoading}>
//                 {isLoading ? "Signing in..." : "Sign in"}
//               </Button>
//             </form>

//             <div className="text-center mt-6 pt-6 border-t border-border">
//               <p className="text-sm text-muted-foreground">
//                 Don't have an account?{" "}
//                 <button
//                   onClick={() => navigate("/register")}
//                   className="text-primary hover:underline font-medium"
//                 >
//                   Sign up here
//                 </button>
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// src/pages/Login.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">ODIONS</h1>
              <p className="text-gray-400 text-sm">E-commerce Platform</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
          <div className="mb-6">
            <h2 className="text-white text-2xl font-semibold mb-2">Welcome back</h2>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="Enter your email"
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-black border border-zinc-700 rounded accent-blue-600"
                />
                <span className="text-gray-400 text-sm">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-blue-500 text-sm hover:text-blue-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © 2025 ODIONS. All rights reserved.
        </p>
      </div>
    </div>
  );
}