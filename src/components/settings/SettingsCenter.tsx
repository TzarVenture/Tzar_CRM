"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Copy, Check, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import RoleAccessCard from "./RoleAccessCard";

interface Settings {
  tzarIngestKey?: string;
  whatsappVerifyToken?: string;
  metaVerifyToken?: string;
  metaAppSecretConfigured: boolean;
  appUrl: string;
}

/** A secret shown masked, with show/hide and copy. */
function SecretField({ label, value }: { label: string; value?: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="flex items-center gap-2 text-sm text-warning">
          <WarningCircle size={18} /> Not set. Add it to the server settings.
        </p>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by the browser; the value is still visible on screen
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-lg border border-input bg-muted px-3 py-2.5 text-sm text-foreground">
          {shown ? value : "•".repeat(Math.min(value.length, 28))}
        </code>
        <Button type="button" variant="outline" size="icon" onClick={() => setShown((s) => !s)} aria-label={shown ? `Hide ${label}` : `Show ${label}`}>
          {shown ? <EyeSlash size={18} /> : <Eye size={18} />}
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
        </Button>
      </div>
    </div>
  );
}

function Endpoint({ label, path, base }: { label: string; path: string; base: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <code className="block truncate rounded-lg border border-input bg-muted px-3 py-2.5 text-sm text-foreground">
        {base}
        {path}
      </code>
    </div>
  );
}

export default function SettingsCenter() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/v1/settings")
      .then((res) => setSettings(res.data.settings))
      .catch(() => setError("Could not load settings."))
      .finally(() => setIsLoading(false));
  }, []);

  const base = settings?.appUrl || (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Keys and web addresses for connecting your website forms, Meta and WhatsApp." />

      {error && (
        <div role="alert" className="rounded-lg border border-border bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        settings && (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Website lead form</CardTitle>
                  <CardDescription>Send enquiries from your websites into the pipeline.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Endpoint label="Endpoint (POST)" path="/api/v1/ingest/lead" base={base} />
                  <SecretField label="API key (send as the x-tzar-api-key header)" value={settings.tzarIngestKey} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>Meta lead ads</CardTitle>
                      <CardDescription>Webhook that receives new Facebook and Instagram leads.</CardDescription>
                    </div>
                    <Badge variant={settings.metaAppSecretConfigured ? "success" : "warning"}>
                      {settings.metaAppSecretConfigured ? "Signature check on" : "App secret missing"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Endpoint label="Callback URL" path="/api/v1/webhooks/meta" base={base} />
                  <SecretField label="Verify token" value={settings.metaVerifyToken} />
                  {!settings.metaAppSecretConfigured && (
                    <p className="text-sm text-warning">
                      Without META_APP_SECRET on the server, every Meta delivery is rejected. Add it in the Vercel project settings.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>WhatsApp Business</CardTitle>
                  <CardDescription>Webhook for incoming WhatsApp messages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Endpoint label="Callback URL" path="/api/v1/webhooks/whatsapp" base={base} />
                  <SecretField label="Verify token" value={settings.whatsappVerifyToken} />
                </CardContent>
              </Card>
            </div>

            <RoleAccessCard />
          </>
        )
      )}
    </div>
  );
}
