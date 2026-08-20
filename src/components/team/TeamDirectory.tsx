"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
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
} from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export default function TeamDirectory() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BDE");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

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
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email);
    setPassword(""); // Leave blank if not changing
    setRole(member.role);
    setPhone(member.phone || "");
    setIsActive(member.isActive);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);

      if (editingMember) {
        // Edit existing
        await axios.patch(`/api/v1/team/${editingMember._id}`, {
          name,
          email,
          ...(password ? { password } : {}),
          role,
          phone,
          isActive,
        });
      } else {
        // Add new
        await axios.post("/api/v1/team", {
          name,
          email,
          password,
          role,
          phone,
        });
      }

      setIsModalOpen(false);
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
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-xs"
      >
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
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>
      </div>

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
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Member Modal */}
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
                  <option value="BDE">BDE (Sales Rep)</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="ACCOUNT_MANAGER">Account Manager</option>
                  <option value="MEDIA_BUYER">Media Buyer</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
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

              {editingMember && (
                <div className="flex items-center gap-2 pt-2">
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
