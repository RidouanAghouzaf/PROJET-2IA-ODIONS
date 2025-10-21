// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Eye, EyeOff, Mail, Lock, User, Building } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/hooks/use-toast";

// export default function Register() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     companyName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     agreeTerms: false
//   });
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (formData.password !== formData.confirmPassword) {
//       toast({
//         title: "Error",
//         description: "Passwords do not match",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.agreeTerms) {
//       toast({
//         title: "Error",
//         description: "Please agree to the terms and conditions",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsLoading(true);

//     // Simulate API call
//     setTimeout(() => {
//       setIsLoading(false);
//       toast({
//         title: "Registration successful",
//         description: "Welcome to ODIONS! Please check your email to verify your account.",
//       });
//       navigate("/login");
//     }, 2000);
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value
//     }));
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
//       <div className="w-full max-w-md animate-fade-in">
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float">
//             <span className="text-white font-bold text-2xl">O</span>
//           </div>
//           <h1 className="text-3xl font-bold text-foreground">Join ODIONS</h1>
//           <p className="text-muted-foreground">Create your e-commerce management account</p>
//         </div>

//         {/* Register Card */}
//         <Card className="glass border-card-border/50">
//           <CardHeader className="text-center">
//             <CardTitle className="text-2xl">Create account</CardTitle>
//             <CardDescription>
//               Set up your ODIONS account to start managing your e-commerce business
//             </CardDescription>
//           </CardHeader>
          
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Name Fields */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="firstName">First name</Label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       id="firstName"
//                       name="firstName"
//                       type="text"
//                       placeholder="John"
//                       value={formData.firstName}
//                       onChange={handleInputChange}
//                       className="pl-10"
//                       required
//                     />
//                   </div>
//                 </div>
                
//                 <div className="space-y-2">
//                   <Label htmlFor="lastName">Last name</Label>
//                   <Input
//                     id="lastName"
//                     name="lastName"
//                     type="text"
//                     placeholder="Doe"
//                     value={formData.lastName}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Company Name */}
//               <div className="space-y-2">
//                 <Label htmlFor="companyName">Company name</Label>
//                 <div className="relative">
//                   <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="companyName"
//                     name="companyName"
//                     type="text"
//                     placeholder="Acme Store"
//                     value={formData.companyName}
//                     onChange={handleInputChange}
//                     className="pl-10"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Email Field */}
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email address</Label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="email"
//                     name="email"
//                     type="email"
//                     placeholder="john@acmestore.com"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     className="pl-10"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Password Fields */}
//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="password"
//                     name="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Create a strong password"
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

//               <div className="space-y-2">
//                 <Label htmlFor="confirmPassword">Confirm password</Label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="confirmPassword"
//                     name="confirmPassword"
//                     type={showConfirmPassword ? "text" : "password"}
//                     placeholder="Confirm your password"
//                     value={formData.confirmPassword}
//                     onChange={handleInputChange}
//                     className="pl-10 pr-10"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                   >
//                     {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                   </button>
//                 </div>
//               </div>

//               {/* Terms Agreement */}
//               <div className="flex items-start space-x-2">
//                 <Checkbox
//                   id="agreeTerms"
//                   name="agreeTerms"
//                   checked={formData.agreeTerms}
//                   onCheckedChange={(checked) => 
//                     setFormData(prev => ({ ...prev, agreeTerms: checked as boolean }))
//                   }
//                   className="mt-1"
//                 />
//                 <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
//                   I agree to the{" "}
//                   <button type="button" className="text-primary hover:underline">
//                     Terms of Service
//                   </button>{" "}
//                   and{" "}
//                   <button type="button" className="text-primary hover:underline">
//                     Privacy Policy
//                   </button>
//                 </Label>
//               </div>

//               {/* Submit Button */}
//               <Button
//                 type="submit"
//                 className="w-full bg-gradient-primary hover:opacity-90 h-11"
//                 disabled={isLoading}
//               >
//                 {isLoading ? "Creating account..." : "Create account"}
//               </Button>
//             </form>

//             {/* Login Link */}
//             <div className="text-center mt-6 pt-6 border-t border-border">
//               <p className="text-sm text-muted-foreground">
//                 Already have an account?{" "}
//                 <button
//                   onClick={() => navigate("/login")}
//                   className="text-primary hover:underline font-medium"
//                 >
//                   Sign in here
//                 </button>
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName);
      toast.success('Account created successfully! Please verify your email before logging in.');
      navigate('/login'); // Redirect to login instead of dashboard
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create account';

      if (errorMessage.includes('For security purposes')) {
        toast.info('Your account is already created. Please check your email and verify your account before logging in.');
      } else {
        toast.error(errorMessage);
      }
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

        {/* Signup Card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
          <div className="mb-6">
            <h2 className="text-white text-2xl font-semibold mb-2">Create an account</h2>
            <p className="text-gray-400 text-sm">Get started with ODIONS today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Full Name
              </label>
              <input
                {...register('fullName')}
                type="text"
                placeholder="Enter your full name"
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors"
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>

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
                  placeholder="Create a password"
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

            {/* Confirm Password Field */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  {...register('agreedToTerms')}
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 bg-black border border-zinc-700 rounded accent-blue-600"
                  disabled={isLoading}
                />
                <span className="text-gray-400 text-sm">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-500 hover:text-blue-400">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-500 hover:text-blue-400">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="text-red-500 text-xs mt-1">{errors.agreedToTerms.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-500 hover:text-blue-400 transition-colors font-medium"
              >
                Sign in
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
