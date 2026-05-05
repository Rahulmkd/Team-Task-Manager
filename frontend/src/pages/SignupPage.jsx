import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const FEATURES = [
  "Create and manage projects",
  "Assign tasks to team members",
  "Track progress with real-time dashboards",
  "Role-based access control (Admin/Member)",
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data) => {
    try {
      setServerError("");
      await signup({ name: data.name, email: data.email, password: data.password });
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-violet-600 to-primary/90 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-20 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-32 left-20 w-48 h-48 rounded-full bg-white blur-2xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white">TaskFlow</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="font-display text-4xl font-bold text-white leading-tight">
              Ship faster,
              <br />
              <span className="text-white/70">together.</span>
            </h2>
            <p className="text-white/70 text-lg mt-4 max-w-sm leading-relaxed">
              Join thousands of teams who trust TaskFlow to deliver projects on time.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/80 shrink-0" />
                <span className="text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-white/40 text-sm">
          © 2025 TaskFlow. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl">TaskFlow</span>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-2">Get started for free, no credit card required</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <input
                {...register("name")}
                type="text"
                placeholder="Jane Doe"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-card text-foreground text-sm",
                  "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150",
                  errors.name ? "border-destructive" : "border-input"
                )}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email address</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-card text-foreground text-sm",
                  "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150",
                  errors.email ? "border-destructive" : "border-input"
                )}
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className={cn(
                    "w-full px-4 py-2.5 pr-11 rounded-lg border bg-card text-foreground text-sm",
                    "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150",
                    errors.password ? "border-destructive" : "border-input"
                  )}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Confirm password</label>
              <input
                {...register("confirmPassword")}
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-card text-foreground text-sm",
                  "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150",
                  errors.confirmPassword ? "border-destructive" : "border-input"
                )}
              />
              {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Create account <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
