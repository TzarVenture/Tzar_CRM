"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Buildings as Building2, CurrencyDollar as DollarSign, Users, MagnifyingGlass as Search, CheckCircle as CheckCircle2, Lock, ArrowSquareOut as ExternalLink, ShieldCheck, Tag, Envelope as Mail, Phone, Pencil, Trash as Trash2, Plus, X, SpinnerGap as Loader2 } from "@phosphor-icons/react";
import { CreateClientModal } from "./CreateClientModal";
import { EditClientModal } from "./EditClientModal";
import { ConfirmDialog } from "@/components/invoices/ConfirmDialog";

interface ClientItem {
  _id: string;
  clientCustomId: string;
  companyName: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    designation?: string;
  };
  industry?: string;
  status: string;
  monthlyRetainerBudget: number;
  totalRevenueToDate: number;
  onboardingCompleted?: boolean;
  portalAccessActive?: boolean;
  portalPasscode?: string;
  accountManagerId?: { name: string; email: string };
  activeServices?: string[];
  createdAt: string;
}

export default function ClientDirectory() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit & Create Modal State
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; company: string } | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/v1/clients");
      setClients(res.data.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openEditModal = (client: ClientItem) => setEditingClient(client);

  const handleDeleteClient = async (id: string) => {
    try {
      await axios.delete(`/api/v1/clients/${id}`);
      fetchClients();
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  const totalMonthlyRetainer = clients.reduce(
    (sum, c) => sum + (c.monthlyRetainerBudget || 0),
    0
  );
  const totalLifetimeRevenue = clients.reduce(
    (sum, c) => sum + (c.totalRevenueToDate || 0),
    0
  );

  const filteredClients = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.primaryContact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.clientCustomId &&
        c.clientCustomId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Active Client Accounts
            </span>
            <div className="p-2 rounded-xl bg-info-soft">
              <Building2 className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {clients.length}
          </p>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">Converted agency clients</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Monthly Recurring Retainer (MRR)
            </span>
            <div className="p-2 rounded-xl bg-success-soft">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-success tracking-tight">
            ₹{totalMonthlyRetainer.toLocaleString("en-IN")} <span className="text-sm font-semibold text-muted-foreground">/ mo</span>
          </p>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">Active client contracts</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Lifetime Revenue
            </span>
            <div className="p-2 rounded-xl bg-muted">
              <ShieldCheck className="w-4 h-4 text-foreground" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            ₹{totalLifetimeRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">Total collected to date</p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-card rounded-2xl border border-border shadow-2xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Accounts Directory
            </h3>
            <p className="text-sm text-muted-foreground font-medium">Manage client retainers, portals, and onboarding</p>
          </div>

          <div className="flex items-center gap-2.5 flex-1 justify-end">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients, company, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm font-semibold rounded-xl border border-border bg-muted hover:border-input focus:bg-card focus:border-ring outline-none transition-all"
              />
            </div>

            <button
              onClick={() => setIsCreateClientModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Client
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted border-b border-border text-foreground font-semibold ">
              <tr>
                <th className="py-3.5 px-5">Client Company</th>
                <th className="py-3.5 px-4">Primary Contact</th>
                <th className="py-3.5 px-4">Monthly Retainer</th>
                <th className="py-3.5 px-4">Onboarding Status</th>
                <th className="py-3.5 px-4">Account Manager</th>
                <th className="py-3.5 px-4 text-right">Actions & Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-semibold text-foreground">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Loading client directory...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No converted client accounts yet.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-muted transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-2xs"
                          style={{ backgroundColor: "var(--color-brand-green)" }}
                        >
                          {client.companyName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {client.companyName}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {client.clientCustomId || "TZ-CL-2000"} · {client.industry || "Agency Client"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-foreground font-semibold">{client.primaryContact.name}</p>
                      <p className="text-xs text-muted-foreground">{client.primaryContact.email}</p>
                    </td>
                    <td className="py-4 px-4 font-semibold text-success">
                      ${(client.monthlyRetainerBudget || 0).toLocaleString()} / mo
                    </td>
                    <td className="py-4 px-4">
                      {client.onboardingCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-success-soft text-success border border-border">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-warning-soft text-warning border border-border">
                          Pending Form
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {client.accountManagerId?.name || "Assignee"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/portal/${client._id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-brand-green) hover:underline mr-2"
                        >
                          Portal <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1 rounded text-muted-foreground hover:bg-muted"
                          title="Edit Client"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => setClientToDelete({ id: client._id, company: client.companyName })}
                            className="p-1 rounded text-destructive hover:bg-destructive-soft cursor-pointer"
                            title="Delete Client Account (Super Admin Privilege)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditClientModal client={editingClient} onClose={() => setEditingClient(null)} onSaved={fetchClients} />

      {/* Add New Client Modal */}
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
        onClientCreated={(newClient) => {
          if (newClient) {
            setClients((prev) => [newClient, ...prev.filter((c) => c._id !== newClient._id)]);
          }
          fetchClients();
        }}
      />

      {clientToDelete && (
        <ConfirmDialog
          title={`Delete ${clientToDelete.company}?`}
          message="The client account is removed for good. This cannot be undone."
          confirmLabel="Delete client"
          cancelLabel="Keep client"
          onConfirm={() => {
            const id = clientToDelete.id;
            setClientToDelete(null);
            handleDeleteClient(id);
          }}
          onClose={() => setClientToDelete(null)}
        />
      )}
    </div>
  );
}
