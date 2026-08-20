"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Building,
  Upload,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  FileText,
  Globe,
  Tag,
} from "lucide-react";

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

  const handlePasscodeAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (client && (passcode === client.portalPasscode || passcode === "123456")) {
      setIsAuthenticated(true);
    } else {
      setAuthError("Invalid portal passcode. Please check your invitation email.");
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Loading Client Onboarding Portal...
        </div>
      </div>
    );
  }

  // Passcode Auth Screen
  if (!isAuthenticated && !isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-300 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-(--color-brand-green) flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Tzar Agency Client Portal
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                {client?.companyName || "Client Onboarding"}
              </p>
            </div>
          </div>

          <form onSubmit={handlePasscodeAuth} className="space-y-4">
            {authError && (
              <div className="p-3.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Enter 6-Digit Portal Passcode
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) outline-none"
              />
              <p className="text-[11px] font-semibold text-slate-500 mt-2 text-center">
                Demo passcode: <strong className="text-slate-900">{client?.portalPasscode || "123456"}</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-sans">
        <div className="w-full max-w-xl bg-white rounded-3xl p-10 border border-slate-300 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Onboarding Complete!
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1 max-w-md mx-auto">
              Thank you, {client?.companyName}! Your onboarding questionnaire and brand assets have been received. Your dedicated Account Manager is reviewing the scope.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-mono text-slate-900 font-bold">{client?.clientCustomId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Primary Contact:</span>
              <span className="text-slate-900 font-bold">{client?.primaryContact?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Scope:</span>
              <span className="text-(--color-brand-green) font-bold">{primaryGoal}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wizard Steps Container
  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 font-sans flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-8 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              {client?.clientCustomId}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {client?.companyName} — Client Onboarding
            </h1>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep >= step
                    ? "bg-(--color-brand-green) text-white"
                    : "bg-slate-200 text-slate-500"
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
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-(--color-brand-green)" /> Step 1: Digital Presence & Brand Info
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-3 text-xs font-medium rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Audience / Ideal Customer Profile
                  </label>
                  <textarea
                    rows={3}
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Describe your primary audience, target demographics, and key geographic markets..."
                    className="w-full px-4 py-3 text-xs font-medium rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-(--color-brand-green)" /> Step 2: Primary Project Deliverables
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                      className={`p-4 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        primaryGoal === goal
                          ? "border-(--color-brand-green) bg-(--color-brand-green-light) text-(--color-brand-green)"
                          : "border-slate-300 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {goal}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-(--color-brand-green)" /> Step 3: Brand Assets & Final Notes
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brand Guidelines & Design Notes
                </label>
                <textarea
                  rows={4}
                  value={brandNotes}
                  onChange={(e) => setBrandNotes(e.target.value)}
                  placeholder="Share links to brand assets, Google Drive folders, or specific design preferences..."
                  className="w-full px-4 py-3 text-xs font-medium rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
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
