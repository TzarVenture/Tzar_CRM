"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
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
        setError("Invalid email or password. Please try again.");
        return;
      }

      // Redirect based on role — we'll do a full reload so session is fresh
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@tzar.agency"
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none transition-all duration-150"
          style={{
            backgroundColor: "var(--color-bg-subtle)",
            borderColor: "var(--color-border-light)",
            color: "var(--color-text-primary)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-brand-green)";
            e.target.style.backgroundColor = "var(--color-bg-surface)";
            e.target.style.boxShadow = "0 0 0 3px rgba(13,71,51,0.08)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--color-border-light)";
            e.target.style.backgroundColor = "var(--color-bg-subtle)";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Password
          </label>
          <a
            href="/forgot-password"
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--color-brand-green)" }}
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-lg border outline-none transition-all duration-150"
            style={{
              backgroundColor: "var(--color-bg-subtle)",
              borderColor: "var(--color-border-light)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-brand-green)";
              e.target.style.backgroundColor = "var(--color-bg-surface)";
              e.target.style.boxShadow = "0 0 0 3px rgba(13,71,51,0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border-light)";
              e.target.style.backgroundColor = "var(--color-bg-subtle)";
              e.target.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !email || !password}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-all duration-150 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          backgroundColor: "var(--color-brand-green)",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = "var(--color-brand-green-hover)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = "var(--color-brand-green)";
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
