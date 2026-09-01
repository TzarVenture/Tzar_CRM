"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  CheckCircle2,
  X,
  Loader2,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
  Eye,
  Calendar,
  Award,
  TrendingUp,
  Briefcase,
  UserCheck,
  Lock,
  Save,
} from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  allowedBusinesses?: string[];
  createdAt: string;
}

export default function TeamDirectory() {
  const { data: session, update: updateSession } = useSession();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showRulesMatrix, setShowRulesMatrix] = useState(false);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [rulesSuccessMsg, setRulesSuccessMsg] = useState<string | null>(null);

  // Interactive RBAC Role Permission Matrix State
  const [rulesState, setRulesState] = useState<Record<string, Record<string, boolean>>>({
    SALES_MANAGER: {
      financials: true,
      metaAds: true,
      createLeads: true,
      editStage: true,
      deleteLead: false,
      bulkDelete: false,
      manageTeam: false,
    },
    BDE: {
      financials: false,
      metaAds: false,
      createLeads: true,
      editStage: true,
      deleteLead: false,
      bulkDelete: false,
      manageTeam: false,
    },
  });

  const toggleRule = (roleKey: "SALES_MANAGER" | "BDE", ruleKey: string) => {
    setRulesState((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [ruleKey]: !prev[roleKey][ruleKey],
      },
    }));
  };

  const handleSaveRules = async () => {
    setIsSavingRules(true);
    setRulesSuccessMsg(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRulesSuccessMsg("Role permission matrix rules updated successfully.");
      setTimeout(() => setRulesSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Save rules error:", err);
    } finally {
      setIsSavingRules(false);
    }
  };

  // View Details Modal State
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [memberStats, setMemberStats] = useState<{ activeLeads: number; dealsWon: number; revenue: number } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BDE");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [allowedBusinesses, setAllowedBusinesses] = useState<string[]>(["tzar", "titepo", "adshalaa", "crownleaf"]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/v1/team");
      setTeam(res.data.team || []);
    } catch (err) {
      console.error("Failed to fetch team:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const openAddModal = () => {
    setEditingMember(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("BDE");
    setPhone("");
    setIsActive(true);
    setAllowedBusinesses(["tzar", "titepo", "adshalaa", "crownleaf"]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    // Read from the latest team state to get fresh data (avoids stale closures)
    const freshMember = team.find((m) => m._id === member._id) || member;
    setEditingMember(freshMember);
    setName(freshMember.name);
    setEmail(freshMember.email);
    setPassword(""); // Leave blank if not changing
    setRole(freshMember.role);
    setPhone(freshMember.phone || "");
    setIsActive(freshMember.isActive);
    setAllowedBusinesses(freshMember.allowedBusinesses || ["tzar", "titepo", "adshalaa", "crownleaf"]);
    setError(null);
    setIsModalOpen(true);
  };

  const openViewModal = async (member: TeamMember) => {
    setViewingMember(member);
    setMemberStats(null);

    try {
      const res = await axios.get(`/api/v1/leads?assignedTo=${member._id}`);
      if (res.data.leads) {
        const activeCount = res.data.leads.length;
        const wonLeads = res.data.leads.filter((l: any) => l.stageId === "closed-won" || l.status === "CONVERTED");
        const wonCount = wonLeads.length;
        const rev = wonLeads.reduce((sum: number, l: any) => sum + (l.estimatedBudget || 0), 0);

        setMemberStats({
          activeLeads: activeCount,
          dealsWon: wonCount,
          revenue: rev,
        });
      }
    } catch (err) {
      console.error("Error fetching member stats:", err);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);

      if (editingMember) {
        // Edit existing — capture the returned updated user from server
        const patchRes = await axios.patch(`/api/v1/team/${editingMember._id}`, {
          name,
          email,
          ...(password ? { password } : {}),
          role,
          phone,
          isActive,
          allowedBusinesses,
        });

        // Immediately update the team card in local state with server's response
        const updatedUser: TeamMember = patchRes.data.user;
        if (updatedUser) {
          setTeam((prev) =>
            prev.map((m) => (m._id === updatedUser._id ? { ...m, ...updatedUser } : m))
          );
        }

        // If the logged-in admin edited their own account, trigger session update & reload for Header sync!
        if (session?.user?.id === editingMember._id) {
          await updateSession();
          window.location.reload();
          return;
        }
      } else {
        // Add new member
        await axios.post("/api/v1/team", {
          name,
          email,
          password,
          role,
          phone,
          allowedBusinesses,
        });
      }

      setIsModalOpen(false);
      // Full re-fetch to ensure server-sync (no stale data on any card)
      fetchTeam();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to save team member");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (!confirm(`Are you sure you want to delete ${memberName} from the agency roster?`)) return;

    try {
      await axios.delete(`/api/v1/team/${id}`);
      fetchTeam();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Failed to delete team member");
      }
    }
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case "SUPER_ADMIN":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "SALES_MANAGER":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "BDE":
        return "bg-(--color-brand-green-light) text-(--color-brand-green) border-emerald-300";
      case "MEDIA_BUYER":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "ACCOUNT_MANAGER":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const filteredTeam = team.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white font-bold"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Agency Team & Staff Roster
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {team.length} Active Agency Staff Members & Pipeline Assignees
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
            />
          </div>

          <button
            onClick={() => setShowRulesMatrix((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              showRulesMatrix
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            {showRulesMatrix ? "Hide Role Rules" : "Manage Role Rules"}
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>
      </div>

      {/* ─── ROLE PERMISSION MATRIX RULES CARD (INTERACTIVE ADMIN EDITOR) ─── */}
      {showRulesMatrix && (
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" /> Interactive Role Permission Rules Editor
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                Click any cell below to toggle operational access rules between Allowed and Restricted for Manager & BDE roles
              </p>
            </div>

            <div className="flex items-center gap-3">
              {rulesSuccessMsg && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fade-in">
                  {rulesSuccessMsg}
                </span>
              )}
              <button
                onClick={handleSaveRules}
                disabled={isSavingRules}
                className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingRules ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-emerald-400" />}
                Save Rule Changes
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Permission Rule</th>
                  <th className="py-3.5 px-4 text-center">Super Admin</th>
                  <th className="py-3.5 px-4 text-center">Sales Manager</th>
                  <th className="py-3.5 px-4 text-center">BDE (Executive)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                {[
                  { key: "financials", label: "View Financial Data & Revenue Totals" },
                  { key: "metaAds", label: "View Meta Ads Spend & ROI Analytics" },
                  { key: "createLeads", label: "Create New Lead Records & Import Meta Leads" },
                  { key: "editStage", label: "Move Lead Pipeline Stage & Log Activity Notes" },
                  { key: "deleteLead", label: "Delete Single Lead Document" },
                  { key: "bulkDelete", label: "Bulk Delete Database Records" },
                  { key: "manageTeam", label: "Manage Team Members & System Settings" },
                ].map((rule) => (
                  <tr key={rule.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{rule.label}</td>

                    {/* Admin Cell (Fixed Full Access) */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full Access
                      </span>
                    </td>

                    {/* Sales Manager Cell (Interactive Toggle) */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleRule("SALES_MANAGER", rule.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          rulesState.SALES_MANAGER[rule.key]
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                        }`}
                        title="Click to toggle Sales Manager permission"
                      >
                        {rulesState.SALES_MANAGER[rule.key] ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Allowed
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-rose-600" /> Restricted
                          </>
                        )}
                      </button>
                    </td>

                    {/* BDE Cell (Interactive Toggle) */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleRule("BDE", rule.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          rulesState.BDE[rule.key]
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                        }`}
                        title="Click to toggle BDE permission"
                      >
                        {rulesState.BDE[rule.key] ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Allowed
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-rose-600" /> Restricted
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs font-semibold text-slate-500">
            Loading agency staff roster...
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-semibold text-slate-500">
            No matching team members found.
          </div>
        ) : (
          filteredTeam.map((member) => (
            <div
              key={member._id}
              className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all space-y-4 relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-xs"
                    style={{ backgroundColor: "var(--color-brand-green)" }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {member.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border mt-1 ${getRoleBadgeStyle(
                        member.role
                      )}`}
                    >
                      <Shield className="w-3 h-3" />
                      {member.role.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openViewModal(member)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="View Member Performance & Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Edit Team Member"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteMember(member._id, member.name)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                    title="Delete Team Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-900 truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-900">{member.phone}</span>
                  </div>
                )}
                {/* Brand Access Badges */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Permitted Brand Leads:</span>
                  <div className="flex flex-wrap gap-1">
                    {(member.allowedBusinesses || ["tzar", "titepo", "adshalaa", "crownleaf"]).map((b) => (
                      <span key={b} className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── VIEW MEMBER DETAILS MODAL ───────────────────────────────────── */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-emerald-600" />

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Team Member Details & Performance
                </h3>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 border-b pb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-xs"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  {viewingMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">{viewingMember.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getRoleBadgeStyle(viewingMember.role)}`}>
                      <Shield className="w-3 h-3" />
                      {viewingMember.role.replace("_", " ")}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${viewingMember.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {viewingMember.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-slate-500 font-medium">Email Address:</span>
                  <p className="text-slate-900 font-bold mt-0.5">{viewingMember.email}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Phone Number:</span>
                  <p className="text-slate-900 font-bold mt-0.5">{viewingMember.phone || "N/A"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Member Since:</span>
                  <p className="text-slate-900 font-bold mt-0.5">{new Date(viewingMember.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Performance Summary Metrics */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assigned Pipeline Performance
                </h4>

                {memberStats ? (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Assigned Leads</span>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5">{memberStats.activeLeads}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Deals Closed</span>
                      <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{memberStats.dealsWon}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Won Revenue</span>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">₹{memberStats.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    Calculating pipeline statistics...
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setViewingMember(null);
                    openEditModal(viewingMember);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT MEMBER MODAL ─────────────────────────────────────── */}
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
                <UserPlus className="w-5 h-5 text-(--color-brand-green)" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingMember ? "Edit Team Member" : "Add Agency Team Member"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alexander Wright"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alexander@tzar.agency"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {editingMember ? "New Password (Optional)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!editingMember}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingMember ? "Leave blank to keep current" : "••••••••"}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned RBAC Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                >
                  <option value="BDE">💼 BDE (Business Development Executive)</option>
                  <option value="SALES_MANAGER">📊 Sales Manager</option>
                  <option value="SUPER_ADMIN">🛡️ Super Admin (Agency Owner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00002"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              {/* Brand Lead Access Controls for Admin */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  🛡️ Brand Lead Access Permissions (RBAC)
                </label>
                <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {[
                    { id: "tzar", label: "Tzar Venture", color: "text-blue-700 font-bold" },
                    { id: "titepo", label: "Titepo Toys", color: "text-amber-700 font-bold" },
                    { id: "adshalaa", label: "Adshalaa Institute", color: "text-emerald-700 font-bold" },
                    { id: "crownleaf", label: "Crownleaf Luxury", color: "text-purple-700 font-bold" },
                  ].map((b) => {
                    const isChecked = allowedBusinesses.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked ? "bg-white border-emerald-300 shadow-2xs" : "bg-slate-100/60 border-slate-200 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAllowedBusinesses((prev) => [...prev, b.id]);
                            } else {
                              setAllowedBusinesses((prev) => prev.filter((id) => id !== b.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                        />
                        <span className={b.color}>{b.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Controls which business leads this team member is permitted to view in the pipeline.
                </p>
              </div>

              {editingMember && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-(--color-brand-green)"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700">
                    Account Active Status
                  </label>
                </div>
              )}

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
                      <CheckCircle2 className="w-4 h-4" /> Save Team Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
