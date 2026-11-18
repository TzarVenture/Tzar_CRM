"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ShieldCheck, Building, UploadSimple as Upload, CheckCircle as CheckCircle2, Lock, ArrowRight, Sparkle as Sparkles, FileText, Globe, Tag } from "@phosphor-icons/react";

interface ClientOnboardingPortalProps {
  clientId: string;
}

export default function ClientOnboardingPortal({
  clientId,
}: ClientOnboardingPortalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [client, setClient] = useState<any>(null);
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Onboarding Form Steps
  const [currentStep, setCurrentStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("Website Redesign & Conversion Optimization");
  const [brandNotes, setBrandNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const fetchClientPortalData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/v1/portal/${clientId}`);
      setClient(res.data.client);
      if (res.data.client?.onboardingCompleted) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("Failed to fetch portal data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientPortalData();
  }, [fetchClientPortalData]);

  const handlePasscodeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await axios.post(`/api/v1/portal/${clientId}`, { passcode });
      setIsAuthenticated(true);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      setAuthError(
        status === 429
          ? "Too many attempts. Please try again in 15 minutes."
          : "Invalid portal passcode. Please check your invitation email."
      );
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await axios.post(`/api/v1/portal/${clientId}/complete`, {
        websiteUrl,
        targetAudience,
        primaryGoal,
        brandNotes,
        passcode,
      });
      setIsCompleted(true);
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero [background-image:var(--hero-gradient)] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-success border-t-transparent rounded-full animate-spin" />
          Loading Client Onboarding Portal...
        </div>
      </div>
    );
  }

  // Passcode Auth Screen
  if (!isAuthenticated && !isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-hero [background-image:var(--hero-gradient)] font-sans">
        <div className="w-full max-w-md bg-card rounded-3xl p-8 border border-input shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-(--color-brand-green) flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Tzar Agency Client Portal
              </h1>
              <p className="text-sm font-semibold text-muted-foreground">
                {client?.companyName || "Client Onboarding"}
              </p>
            </div>
          </div>

          <form onSubmit={handlePasscodeAuth} className="space-y-4">
            {authError && (
              <div className="p-3.5 rounded-xl text-sm font-semibold bg-destructive-soft text-destructive border border-border">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Enter 6-Digit Portal Passcode
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 text-center text-lg font-mono font-semibold rounded-xl border border-input bg-muted focus:bg-card focus:border-(--color-brand-green) outline-none"
              />
              <p className="text-xs font-semibold text-muted-foreground mt-2 text-center">
                Enter the 6-digit code from your invitation.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
              style={{ backgroundColor: "var(--color-brand-green)" }}
            >
              Access Onboarding Wizard <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Onboarding Completed View
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-hero [background-image:var(--hero-gradient)] font-sans">
        <div className="w-full max-w-xl bg-card rounded-3xl p-10 border border-input shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-success-soft border border-border text-success flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Onboarding Complete!
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1 max-w-md mx-auto">
              Thank you, {client?.companyName}! Your onboarding questionnaire and brand assets have been received. Your dedicated Account Manager is reviewing the scope.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-muted border border-border text-sm font-semibold text-foreground space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account ID:</span>
              <span className="font-mono text-foreground font-semibold">{client?.clientCustomId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Contact:</span>
              <span className="text-foreground font-semibold">{client?.primaryContact?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Scope:</span>
              <span className="text-(--color-brand-green) font-semibold">{primaryGoal}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wizard Steps Container
  return (
    <div className="min-h-screen bg-hero [background-image:var(--hero-gradient)] py-10 px-4 font-sans flex items-center justify-center">
      <div className="w-full max-w-3xl bg-card rounded-3xl border border-input shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-8 border-b border-border bg-muted flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-sm font-mono font-semibold px-2.5 py-0.5 rounded bg-success-soft text-success border border-border">
              {client?.clientCustomId}
            </span>
            <h1 className="text-xl font-semibold text-foreground mt-1">
              {client?.companyName} — Client Onboarding
            </h1>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  currentStep >= step
                    ? "bg-(--color-brand-green) text-white"
                    : "bg-border text-muted-foreground"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleCompleteOnboarding} className="p-8 space-y-6">
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-(--color-brand-green)" /> Step 1: Digital Presence & Brand Info
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Current Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-input outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Target Audience / Ideal Customer Profile
                  </label>
                  <textarea
                    rows={3}
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Describe your primary audience, target demographics, and key geographic markets..."
                    className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-input outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-xs cursor-pointer"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-(--color-brand-green)" /> Step 2: Primary Project Deliverables
              </h2>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Select Primary Agency Objective
                </label>
                <div className="space-y-2">
                  {[
                    "Website Redesign & Conversion Optimization",
                    "Monthly SEO Retainer & Keyword Ranking",
                    "Meta & Google Ads Campaign Scaling",
                    "Brand Identity & Creative System",
                  ].map((goal) => (
                    <div
                      key={goal}
                      onClick={() => setPrimaryGoal(goal)}
                      className={`p-4 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                        primaryGoal === goal
                          ? "border-(--color-brand-green) bg-(--color-brand-green-light) text-(--color-brand-green)"
                          : "border-input bg-muted text-foreground"
                      }`}
                    >
                      {goal}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-xs cursor-pointer"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-(--color-brand-green)" /> Step 3: Brand Assets & Final Notes
              </h2>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Brand Guidelines & Design Notes
                </label>
                <textarea
                  rows={4}
                  value={brandNotes}
                  onChange={(e) => setBrandNotes(e.target.value)}
                  placeholder="Share links to brand assets, Google Drive folders, or specific design preferences..."
                  className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-input outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-status-success)" }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit Onboarding
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
