"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeSlash, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("The email or password is incorrect.");
        setIsLoading(false);
        return;
      }

      // Full reload so the new session is picked up; the home page sends each person to their first page
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive-soft px-3.5 py-3 text-sm font-medium text-destructive">
          <WarningCircle size={20} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@tzar.co"
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-12 text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Forgot your password? Ask the Super Admin to reset it.</p>
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full font-semibold" disabled={isLoading || !email || !password}>
        {isLoading && <SpinnerGap size={20} className="animate-spin" />}
        {isLoading ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
