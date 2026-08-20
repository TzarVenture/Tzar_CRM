"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Settings,
  Key,
  Shield,
  Sliders,
  MessageSquare,
  Mail,
  History,
  CheckCircle2,
  Lock,
  Copy,
  Check,
} from "lucide-react";

export default function SettingsCenter() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoading(true);
        const res = await axios.get("/api/v1/settings");
        setSettings(res.data.settings);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs font-semibold text-slate-500">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Security Banner */}
      <div
        className="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white font-bold"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Super Admin System Control Center
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Manage platform API keys, webhook verify tokens, and RBAC security matrix
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          SUPER ADMIN LEVEL
        </span>
      </div>

      {/* Grid: 6 Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Lead Ingestion Gateway API Key */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-(--color-brand-green)" />
              <h3 className="text-sm font-bold text-slate-900">
                Lead Ingest Gateway API Key
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              ACTIVE
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600">
            Pass this header key in website contact forms: <code className="text-slate-900 font-mono">x-tzar-api-key</code>
          </p>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900">
            <span className="flex-1 truncate">{settings?.tzarIngestKey}</span>
            <button
              onClick={() => handleCopy(settings?.tzarIngestKey, "ingest")}
              className="p-1.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {copiedKey === "ingest" ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Meta WhatsApp Webhook Verify Token */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                WhatsApp Webhook Verify Token
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              VERIFIED
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600">
            Endpoint URL: <code className="text-slate-900 font-mono">/api/v1/webhooks/whatsapp</code>
          </p>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900">
            <span className="flex-1 truncate">{settings?.whatsappVerifyToken}</span>
            <button
              onClick={() => handleCopy(settings?.whatsappVerifyToken, "wa")}
              className="p-1.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {copiedKey === "wa" ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Card 3: Meta Lead Ads Webhook Verify Token */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Meta Lead Ads Webhook Token
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              CONFIGURED
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600">
            Endpoint URL: <code className="text-slate-900 font-mono">/api/v1/webhooks/meta</code>
          </p>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900">
            <span className="flex-1 truncate">{settings?.metaVerifyToken}</span>
            <button
              onClick={() => handleCopy(settings?.metaVerifyToken, "meta")}
              className="p-1.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {copiedKey === "meta" ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Card 4: AWS S3 Storage Bucket */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                AWS S3 Storage Configuration
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
              AWS MUMBAI
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600">
            Bucket: <code className="text-slate-900 font-mono">{settings?.s3BucketName}</code> ({settings?.awsRegion})
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 space-y-1">
            <p>• Presigned Upload Expiration: 15 minutes</p>
            <p>• Access Control: Internal Staff vs Client Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
