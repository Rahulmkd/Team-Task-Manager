import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Zap, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      setServerError("");
      await login(data);
      navigate("/dashboard");
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/90 to-violet-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-white blur-2xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              TaskFlow
            </span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Manage projects
            <br />
            <span className="text-white/70">with your team.</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Organize tasks, track progress, and collaborate seamlessly with
            role-based access control.
          </p>

          <div className="flex gap-6">
            {[
              { num: "10x", label: "Faster delivery" },
              { num: "99%", label: "Team visibility" },
              { num: "∞", label: "Projects" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-bold text-white">
                  {stat.num}
                </div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-white/40 text-sm">
          © 2026 TaskFlow. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl">TaskFlow</span>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-card text-foreground text-sm",
                  "placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                  "transition-all duration-150",
                  errors.email ? "border-destructive focus:ring-destructive/30" : "border-input"
                )}
              />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "w-full px-4 py-2.5 pr-11 rounded-lg border bg-card text-foreground text-sm",
                    "placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                    "transition-all duration-150",
                    errors.password ? "border-destructive focus:ring-destructive/30" : "border-input"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                "bg-primary text-primary-foreground font-medium text-sm",
                "hover:opacity-90 active:scale-[0.98]",
                "transition-all duration-150",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </div>

          {/* Test credentials */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border text-xs space-y-1.5">
            <p className="font-semibold text-foreground mb-2">🧪 Test Accounts</p>
            {[
              ["alice@example.com", "Admin — Website Redesign"],
              ["bob@example.com", "Admin — Mobile App v2"],
              ["carol@example.com", "Member"],
            ].map(([email, role]) => (
              <div key={email} className="flex gap-2 text-muted-foreground">
                <span className="font-mono text-foreground">{email}</span>
                <span>·</span>
                <span>{role}</span>
              </div>
            ))}
            <p className="text-muted-foreground mt-1">Password: <span className="font-mono text-foreground">password123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
