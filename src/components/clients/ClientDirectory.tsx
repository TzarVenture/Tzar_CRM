"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Building2,
  DollarSign,
  Users,
  Search,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Tag,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { CreateClientModal } from "./CreateClientModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [primaryName, setPrimaryName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [monthlyRetainerBudget, setMonthlyRetainerBudget] = useState(5000);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openEditModal = (client: ClientItem) => {
    setEditingClient(client);
    setCompanyName(client.companyName);
    setPrimaryName(client.primaryContact.name);
    setPrimaryEmail(client.primaryContact.email);
    setPrimaryPhone(client.primaryContact.phone);
    setIndustry(client.industry || "");
    setMonthlyRetainerBudget(client.monthlyRetainerBudget || 5000);
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      setIsSubmitting(true);
      await axios.patch(`/api/v1/clients/${editingClient._id}`, {
        companyName,
        primaryContactName: primaryName,
        primaryContactEmail: primaryEmail,
        primaryContactPhone: primaryPhone,
        industry,
        monthlyRetainerBudget: Number(monthlyRetainerBudget),
      });

      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error("Failed to edit client:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string, company: string) => {
    if (!confirm(`Are you sure you want to delete client account "${company}"?`)) return;

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
      {/* Overview Cards (BagUI Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Active Client Accounts
            </span>
            <div className="p-2 rounded-xl bg-blue-50">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {clients.length}
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Converted agency clients</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Monthly Recurring Retainer (MRR)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
            ₹{totalMonthlyRetainer.toLocaleString("en-IN")} <span className="text-xs font-semibold text-slate-400">/ mo</span>
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Active client contracts</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Lifetime Revenue
            </span>
            <div className="p-2 rounded-xl bg-purple-50">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
            ₹{totalLifetimeRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Total collected to date</p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Accounts Directory
            </h3>
            <p className="text-xs text-slate-500 font-medium">Manage client retainers, portals, and onboarding</p>
          </div>

          <div className="flex items-center gap-2.5 flex-1 justify-end">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients, company, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-slate-900 outline-none transition-all"
              />
            </div>

            <button
              onClick={() => setIsCreateClientModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Client
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Client Company</th>
                <th className="py-3.5 px-4">Primary Contact</th>
                <th className="py-3.5 px-4">Monthly Retainer</th>
                <th className="py-3.5 px-4">Onboarding Status</th>
                <th className="py-3.5 px-4">Account Manager</th>
                <th className="py-3.5 px-4 text-right">Actions & Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Loading client directory...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No converted client accounts yet.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                          style={{ backgroundColor: "var(--color-brand-green)" }}
                        >
                          {client.companyName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {client.companyName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            {client.clientCustomId || "TZ-CL-2000"} · {client.industry || "Agency Client"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-900 font-bold">{client.primaryContact.name}</p>
                      <p className="text-[11px] text-slate-500">{client.primaryContact.email}</p>
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-700">
                      ${(client.monthlyRetainerBudget || 0).toLocaleString()} / mo
                    </td>
                    <td className="py-4 px-4">
                      {client.onboardingCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Pending Form
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      {client.accountManagerId?.name || "Assignee"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/portal/${client._id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-bold text-(--color-brand-green) hover:underline mr-2"
                        >
                          Portal <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1 rounded text-slate-600 hover:bg-slate-100"
                          title="Edit Client"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteClient(client._id, client.companyName)}
                            className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
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

      {/* Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden"
            style={{ boxShadow: "var(--shadow-modal)" }}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: "var(--color-brand-green)" }}
            />

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-(--color-brand-green)" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Client Account
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Monthly Retainer ($)
                </label>
                <input
                  type="number"
                  value={monthlyRetainerBudget}
                  onChange={(e) => setMonthlyRetainerBudget(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
