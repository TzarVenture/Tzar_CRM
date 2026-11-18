"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  UserPlus,
  MagnifyingGlass,
  DotsThree,
  PencilSimple,
  Trash,
  SpinnerGap,
  Phone,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/invoices/ConfirmDialog";
import { ASSIGNABLE_ROLES, PERMISSIONS, ROLE_LABELS, resolvePermissions } from "@/lib/permissions";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  allowedBusinesses?: string[];
  permissions?: string[];
  createdAt: string;
}


const BRANDS = [
  { value: "tzar", label: "Tzar Digital Agency" },
  { value: "adshalaa", label: "Adshalaa Edutech" },
  { value: "crownleaf", label: "Crownleaf" },
  { value: "titepo", label: "Titepo" },
];

const roleLabel = (role: string) => ROLE_LABELS[role] || role;
const PERMISSION_GROUPS = [...new Set(PERMISSIONS.map((p) => p.group))];

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

function apiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; details?: { fieldErrors?: Record<string, string[]> } } } };
  const field = e.response?.data?.details?.fieldErrors;
  const first = field ? Object.values(field).flat()[0] : undefined;
  return first || e.response?.data?.error || fallback;
}

export default function TeamDirectory() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [defaults, setDefaults] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [toDelete, setToDelete] = useState<TeamMember | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("BDE");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [access, setAccess] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>(BRANDS.map((b) => b.value));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await axios.get("/api/v1/team");
      setTeam(res.data.team || []);
      setDefaults(res.data.roleDefaults || {});
      setLoadError(null);
    } catch (err) {
      setLoadError(apiError(err, "Could not load the team"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTeam();
  }, [fetchTeam]);

  const openForm = (member: TeamMember | null) => {
    setEditing(member);
    setName(member?.name || "");
    setEmail(member?.email || "");
    setPhone(member?.phone || "");
    setRole(member?.role || "BDE");
    setPassword("");
    setIsActive(member?.isActive ?? true);
    setAccess(member ? resolvePermissions(member.role, member.permissions, defaults) : [...(defaults.BDE ?? [])]);
    setBrands(member?.allowedBusinesses?.length ? member.allowedBusinesses : BRANDS.map((b) => b.value));
    setFormError(null);
    setFormOpen(true);
  };

  const changeRole = (value: string) => {
    setRole(value);
    // A new role starts from that role's usual access; the owner can then adjust it
    setAccess([...(defaults[value] ?? [])]);
  };

  // Only store a personal list when it differs from the role's default, so later changes to the role apply
  const sameAsRoleDefault = (list: string[]) => {
    const base = defaults[role] ?? [];
    return list.length === base.length && list.every((k) => base.includes(k));
  };

  const toggleAccess = (key: string) =>
    setAccess((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const toggleBrand = (value: string) =>
    setBrands((prev) => (prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (brands.length === 0) {
      setFormError("Choose at least one brand.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await axios.patch(`/api/v1/team/${editing._id}`, {
          name,
          email,
          phone,
          ...(editing.role === "SUPER_ADMIN"
            ? {}
            : { role, isActive, permissions: sameAsRoleDefault(access) ? null : access, allowedBusinesses: brands }),
          ...(password ? { password } : {}),
        });
      } else {
        await axios.post("/api/v1/team", {
          name,
          email,
          phone,
          role,
          password,
          ...(sameAsRoleDefault(access) ? {} : { permissions: access }),
          allowedBusinesses: brands,
        });
      }
      setFormOpen(false);
      await fetchTeam();
    } catch (err) {
      setFormError(apiError(err, "Could not save this team member"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const member = toDelete;
    setToDelete(null);
    if (!member) return;
    try {
      await axios.delete(`/api/v1/team/${member._id}`);
      await fetchTeam();
    } catch (err) {
      setLoadError(apiError(err, "Could not remove this team member"));
    }
  };

  const shown = team.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description="Add people, set what they can open and which brands they can see."
        actions={
          <Button onClick={() => openForm(null)}>
            <UserPlus size={18} /> Add team member
          </Button>
        }
      />

      {loadError && (
        <div role="alert" className="rounded-lg border border-border bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
          {loadError}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search team"
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Brands</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : shown.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {team.length === 0 ? "No team members yet." : "No one matches your search."}
                </TableCell>
              </TableRow>
            ) : (
              shown.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{m.name[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                        {m.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone size={14} /> {m.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.role === "SUPER_ADMIN" ? "default" : "secondary"}>{roleLabel(m.role)}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-foreground">
                    {(m.allowedBusinesses?.length ?? 4) === 4
                      ? "All brands"
                      : m.allowedBusinesses?.map((b) => BRANDS.find((x) => x.value === b)?.label || b).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.isActive ? "success" : "outline"}>{m.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        aria-label={`Actions for ${m.name}`}
                      >
                        <DotsThree size={20} weight="bold" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openForm(m)}>
                          <PencilSimple size={18} /> Edit
                        </DropdownMenuItem>
                        {m.role !== "SUPER_ADMIN" && (
                          <DropdownMenuItem destructive onSelect={() => setToDelete(m)}>
                            <Trash size={18} /> Remove
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader className="mb-4">
            <DialogTitle>{editing ? "Edit team member" : "Add team member"}</DialogTitle>
            <DialogDescription>
              {editing ? "Change details, access or password." : "They sign in with this email and password."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name">Full name</Label>
              <Input id="tm-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tm-email">Email</Label>
                <Input id="tm-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tm-phone">Phone (optional)</Label>
                <Input id="tm-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            {editing?.role === "SUPER_ADMIN" ? (
              <p className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground">
                This is the Super Admin account. It has access to everything and can&apos;t be removed or restricted.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="tm-role">Role</Label>
                  <select id="tm-role" value={role} onChange={(e) => changeRole(e.target.value)} className={selectClass}>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                    {!ASSIGNABLE_ROLES.some((r) => r.value === role) && <option value={role}>{roleLabel(role)}</option>}
                  </select>
                  <p className="text-sm text-muted-foreground">{ASSIGNABLE_ROLES.find((r) => r.value === role)?.description}</p>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">What they can see</legend>
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group} className="space-y-2">
                      <p className="text-sm text-muted-foreground">{group}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {PERMISSIONS.filter((p) => p.group === group).map((p) => (
                          <label key={p.key} className="flex items-center gap-2.5 rounded-lg border border-input px-3 py-2.5 text-sm text-foreground cursor-pointer hover:bg-muted">
                            <input type="checkbox" checked={access.includes(p.key)} onChange={() => toggleAccess(p.key)} className="size-4 accent-slate-900" />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </fieldset>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="tm-password">{editing ? "New password (leave blank to keep the current one)" : "Password"}</Label>
              <Input
                id="tm-password"
                type="password"
                autoComplete="new-password"
                required={!editing}
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">At least 10 characters.</p>
            </div>
            {editing?.role !== "SUPER_ADMIN" && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Brands they can see</legend>
              <div className="grid sm:grid-cols-2 gap-2">
                {BRANDS.map((b) => (
                  <label key={b.value} className="flex items-center gap-2.5 rounded-lg border border-input px-3 py-2.5 text-sm text-foreground cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={brands.includes(b.value)}
                      onChange={() => toggleBrand(b.value)}
                      className="size-4 accent-slate-900"
                    />
                    {b.label}
                  </label>
                ))}
              </div>
            </fieldset>
            )}
            {editing && editing.role !== "SUPER_ADMIN" && (
              <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 accent-slate-900" />
                Account is active (untick to block sign-in)
              </label>
            )}

            {formError && (
              <p role="alert" className="rounded-lg border border-border bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <SpinnerGap size={18} className="animate-spin" />}
                {editing ? "Save changes" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {toDelete && (
        <ConfirmDialog
          title={`Remove ${toDelete.name}?`}
          message="They lose access immediately. This cannot be undone. To keep their history, edit them and mark the account inactive instead."
          confirmLabel="Remove member"
          cancelLabel="Keep member"
          onConfirm={remove}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
