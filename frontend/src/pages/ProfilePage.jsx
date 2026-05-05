import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Mail, Lock, CheckCircle2, Loader2,
  Shield, Eye, EyeOff, Calendar, LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { cn, getInitials, getAvatarColor } from "../lib/utils";
import api from "../lib/api";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  /* ── Profile form ── */
  const {
    register: rProfile,
    handleSubmit: hsProfile,
    formState: { errors: eProfile, isSubmitting: profileLoading },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  const onProfileSubmit = async (data) => {
    try {
      const res = await api.put("/auth/profile", data);
      const updated = res.data.data.user;
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      toast({ title: "Profile updated successfully", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update profile", variant: "destructive" });
    }
  };

  /* ── Password form ── */
  const {
    register: rPassword,
    handleSubmit: hsPassword,
    reset: resetPassword,
    formState: { errors: ePassword, isSubmitting: passwordLoading },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onPasswordSubmit = async (data) => {
    try {
      await api.put("/auth/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPassword();
      toast({ title: "Password updated successfully", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update password", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  const inputClass = (hasError) =>
    cn(
      "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm",
      "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
      hasError ? "border-destructive focus:ring-destructive/30" : "border-input"
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Profile hero card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-md",
              getAvatarColor(user?.name)
            )}
          >
            {getInitials(user?.name)}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="font-display text-2xl font-bold text-foreground truncate">{user?.name}</h2>
            <p className="text-muted-foreground text-sm mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Member since {memberSince}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "security", label: "Security", icon: Shield },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Account Information</h3>
            <p className="text-muted-foreground text-sm mt-1">Update your name and email address</p>
          </div>

          <form onSubmit={hsProfile(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  {...rProfile("name")}
                  type="text"
                  className={cn(inputClass(!!eProfile.name), "pl-10")}
                />
              </div>
              {eProfile.name && <p className="text-destructive text-xs">{eProfile.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  {...rProfile("email")}
                  type="email"
                  className={cn(inputClass(!!eProfile.email), "pl-10")}
                />
              </div>
              {eProfile.email && <p className="text-destructive text-xs">{eProfile.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
            >
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === "security" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Change Password</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Keep your account secure with a strong, unique password
            </p>
          </div>

          <form onSubmit={hsPassword(onPasswordSubmit)} className="space-y-4">
            {/* Current password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  {...rPassword("currentPassword")}
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  className={cn(inputClass(!!ePassword.currentPassword), "pl-10 pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {ePassword.currentPassword && (
                <p className="text-destructive text-xs">{ePassword.currentPassword.message}</p>
              )}
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  {...rPassword("newPassword")}
                  type={showNew ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className={cn(inputClass(!!ePassword.newPassword), "pl-10 pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {ePassword.newPassword && (
                <p className="text-destructive text-xs">{ePassword.newPassword.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  {...rPassword("confirmPassword")}
                  type={showNew ? "text" : "password"}
                  placeholder="Repeat new password"
                  className={cn(inputClass(!!ePassword.confirmPassword), "pl-10")}
                />
              </div>
              {ePassword.confirmPassword && (
                <p className="text-destructive text-xs">{ePassword.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
