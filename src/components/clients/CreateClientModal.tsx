"use client";

import React, { useState } from "react";
import axios from "axios";
import { Plus, SpinnerGap } from "@phosphor-icons/react";
import { BusinessSlug } from "@/models/Lead";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/form-field";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClientCreated: (newClient?: any) => void;
}

export function CreateClientModal({ isOpen, onClose, onClientCreated }: CreateClientModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [business, setBusiness] = useState<BusinessSlug>("tzar");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contractValue, setContractValue] = useState<number>(120000);
  const [healthScore, setHealthScore] = useState<"HEALTHY" | "AT_RISK" | "CRITICAL">("HEALTHY");
  const [activeServices, setActiveServices] = useState("Full-Funnel Digital Marketing");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await axios.post("/api/v1/clients", {
        companyName,
        business,
        primaryContact: { name: contactName, email, phone },
        monthlyRetainer: Number(contractValue) || 0,
        healthScore,
        activeServices: [activeServices],
      });

      onClientCreated(res.data?.client);
      onClose();
    } catch (err) {
      console.error("Failed to create client account:", err);
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || "Could not create the client. Check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent scrollable={false}>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>Add a client</DialogTitle>
            <DialogDescription>Create a client account directly, without converting a lead.</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {error && (
              <p role="alert" className="rounded-lg border border-destructive bg-destructive-soft px-3.5 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Field label="Company" htmlFor="client-company" required>
              <Input id="client-company" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="off" />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Brand" htmlFor="client-brand">
                <Select id="client-brand" value={business} onChange={(e) => setBusiness(e.target.value as BusinessSlug)}>
                  <option value="tzar">Tzar Digital Agency</option>
                  <option value="adshalaa">Adshalaa</option>
                  <option value="crownleaf">Crownleaf</option>
                  <option value="titepo">Titepo</option>
                </Select>
              </Field>
              <Field label="Contact name" htmlFor="client-contact" required>
                <Input id="client-contact" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </Field>
              <Field label="Email" htmlFor="client-email" required>
                <Input id="client-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Phone" htmlFor="client-phone" required>
                <Input id="client-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Monthly retainer (₹)" htmlFor="client-retainer">
                <Input id="client-retainer" type="number" min={0} value={contractValue} onChange={(e) => setContractValue(Number(e.target.value))} />
              </Field>
              <Field label="Account health" htmlFor="client-health">
                <Select id="client-health" value={healthScore} onChange={(e) => setHealthScore(e.target.value as typeof healthScore)}>
                  <option value="HEALTHY">Healthy</option>
                  <option value="AT_RISK">At risk</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
              </Field>
            </div>

            <Field label="Services" htmlFor="client-services" hint="What you deliver for this client, for example SEO, Meta ads or a site redesign.">
              <Input id="client-services" value={activeServices} onChange={(e) => setActiveServices(e.target.value)} />
            </Field>
          </DialogBody>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={18} className="animate-spin" /> : <Plus size={18} />}
              {isSubmitting ? "Saving" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
