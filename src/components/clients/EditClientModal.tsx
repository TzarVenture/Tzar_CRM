"use client";

import React, { useState } from "react";
import axios from "axios";
import { FloppyDisk, SpinnerGap } from "@phosphor-icons/react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/form-field";

export interface EditableClient {
  _id: string;
  companyName: string;
  primaryContact: { name: string; email: string; phone: string };
  industry?: string;
  monthlyRetainerBudget: number;
}

interface EditClientModalProps {
  client: EditableClient | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Mount with a client to edit it; the form starts from that client's current details. */
export function EditClientModal({ client, onClose, onSaved }: EditClientModalProps) {
  return (
    <Dialog open={!!client} onOpenChange={(open) => !open && onClose()}>
      {client && <EditForm key={client._id} client={client} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function EditForm({ client, onClose, onSaved }: { client: EditableClient; onClose: () => void; onSaved: () => void }) {
  const [companyName, setCompanyName] = useState(client.companyName);
  const [contactName, setContactName] = useState(client.primaryContact.name);
  const [email, setEmail] = useState(client.primaryContact.email);
  const [phone, setPhone] = useState(client.primaryContact.phone);
  const [industry, setIndustry] = useState(client.industry || "");
  const [retainer, setRetainer] = useState(client.monthlyRetainerBudget || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`/api/v1/clients/${client._id}`, {
        companyName,
        primaryContactName: contactName,
        primaryContactEmail: email,
        primaryContactPhone: phone,
        industry,
        monthlyRetainerBudget: Number(retainer),
      });
      onSaved();
      onClose();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || "Could not save the changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent scrollable={false}>
      <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>{client.companyName}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg border border-destructive bg-destructive-soft px-3.5 py-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <Field label="Company" htmlFor="edit-company" required>
            <Input id="edit-company" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact name" htmlFor="edit-contact" required>
              <Input id="edit-contact" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </Field>
            <Field label="Industry" htmlFor="edit-industry">
              <Input id="edit-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="edit-email" required>
              <Input id="edit-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="edit-phone" required>
              <Input id="edit-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Monthly retainer (₹)" htmlFor="edit-retainer">
              <Input id="edit-retainer" type="number" min={0} value={retainer} onChange={(e) => setRetainer(Number(e.target.value))} />
            </Field>
          </div>
        </DialogBody>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <SpinnerGap size={18} className="animate-spin" /> : <FloppyDisk size={18} />}
            {saving ? "Saving" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
