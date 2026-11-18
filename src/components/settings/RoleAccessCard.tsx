"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Lock, SpinnerGap, CheckCircle } from "@phosphor-icons/react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EDITABLE_ROLES, PERMISSIONS, ROLE_LABELS } from "@/lib/permissions";

type Matrix = Record<string, string[]>;

const sameList = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every((k) => b.includes(k));

/**
 * The default access of each role. Ticking a box here changes what everyone in that role can open,
 * except people the owner gave a personal list on the Team page.
 */
export default function RoleAccessCard() {
  const [saved, setSaved] = useState<Matrix | null>(null);
  const [draft, setDraft] = useState<Matrix>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    axios
      .get("/api/v1/settings/roles")
      .then((res) => {
        setSaved(res.data.roles);
        setDraft(res.data.roles);
      })
      .catch(() => setMessage({ kind: "error", text: "Could not load role access." }));
  }, []);

  const changedRoles = useMemo(
    () => (saved ? EDITABLE_ROLES.filter((r) => !sameList(saved[r], draft[r])) : []),
    [saved, draft]
  );

  const toggle = (role: string, key: string) => {
    setMessage(null);
    setDraft((prev) => {
      const list = prev[role] ?? [];
      return { ...prev, [role]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key] };
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = Object.fromEntries(changedRoles.map((r) => [r, draft[r] ?? []]));
      const res = await axios.put("/api/v1/settings/roles", { roles: payload });
      setSaved(res.data.roles);
      setDraft(res.data.roles);
      setMessage({ kind: "ok", text: "Saved. People in these roles get the new access on their next page load." });
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setMessage({ kind: "error", text: e.response?.data?.error || "Could not save role access." });
    } finally {
      setSaving(false);
    }
  };

  const groups = [...new Set(PERMISSIONS.map((p) => p.group))];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Role access</CardTitle>
            <CardDescription>
              Choose what each role can open by default. A person with a personal list set on the Team page keeps their own list.
              Team and Settings always stay with the Super Admin.
            </CardDescription>
          </div>
          <Button onClick={save} disabled={saving || changedRoles.length === 0}>
            {saving && <SpinnerGap size={18} className="animate-spin" />}
            Save changes
          </Button>
        </div>
        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`flex items-center gap-2 text-sm font-medium ${message.kind === "ok" ? "text-success" : "text-destructive"}`}
          >
            {message.kind === "ok" && <CheckCircle size={18} weight="fill" />}
            {message.text}
          </p>
        )}
      </CardHeader>

      {!saved ? (
        <div className="p-5 pt-0">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Page</TableHead>
              <TableHead className="text-center">Super Admin</TableHead>
              {EDITABLE_ROLES.map((r) => (
                <TableHead key={r} className="text-center">
                  {ROLE_LABELS[r]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <GroupRows key={group} group={group} draft={draft} saved={saved} toggle={toggle} />
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function GroupRows({ group, draft, saved, toggle }: { group: string; draft: Matrix; saved: Matrix; toggle: (role: string, key: string) => void }) {
  return (
    <>
      <TableRow className="bg-muted hover:bg-muted">
        <TableCell colSpan={2 + EDITABLE_ROLES.length} className="py-2 text-sm font-semibold text-muted-foreground">
          {group}
        </TableCell>
      </TableRow>
      {PERMISSIONS.filter((p) => p.group === group).map((p) => (
        <TableRow key={p.key}>
          <TableCell className="font-medium">{p.label}</TableCell>
          <TableCell className="text-center">
            <span className="inline-flex items-center justify-center text-muted-foreground" title="The Super Admin always has access">
              <Lock size={16} />
              <span className="sr-only">Always allowed</span>
            </span>
          </TableCell>
          {EDITABLE_ROLES.map((role) => {
            const checked = (draft[role] ?? []).includes(p.key);
            const changed = checked !== (saved[role] ?? []).includes(p.key);
            return (
              <TableCell key={role} className="text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(role, p.key)}
                  aria-label={`${ROLE_LABELS[role]} can open ${p.label}`}
                  className={`size-4 cursor-pointer accent-primary ${changed ? "outline-2 outline-offset-2 outline-accent" : ""}`}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

