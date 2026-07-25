"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; role: string };
}

interface AuditLogResponse {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string; role: string };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/audit-logs")
      .then((res) =>
        setLogs(
          (res.data as AuditLogResponse[]).map((log) => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            createdAt: log.createdAt,
            user: log.actor,
          })),
        ),
      )
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(
    (l) =>
      !search ||
      `${l.action} ${l.entityType} ${l.user?.firstName} ${l.user?.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <AdminPageHeader
        title="Audit Log"
        subtitle="Complete history of all admin actions"
      />

      <div className="relative mb-6 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action, entity, or staff name..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate/20 rounded-lg font-body text-sm text-midnight placeholder:text-slate/50 focus:outline-none focus:border-daybreak bg-white"
        />
      </div>

      <AdminTable
        loading={loading}
        rows={filtered}
        keyExtractor={(l) => l.id}
        emptyMessage="No audit logs found."
        columns={[
          {
            key: "actor",
            label: "Actor",
            render: (l) => (
              <div>
                <p className="font-body text-sm font-semibold text-midnight">
                  {l.user
                    ? `${l.user.firstName} ${l.user.lastName}`
                    : "System"}
                </p>
                {l.user?.role && (
                  <p className="font-body text-xs text-slate capitalize">
                    {l.user.role}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "action",
            label: "Action",
            render: (l) => (
              <p className="font-body text-sm text-midnight">
                {l.action.replace(/_/g, " ").toLowerCase()}
              </p>
            ),
          },
          {
            key: "entity",
            label: "Entity",
            className: "hidden sm:table-cell",
            render: (l) => (
              <div>
                <p className="font-body text-sm text-slate capitalize">
                  {l.entityType.toLowerCase()}
                </p>
                <p className="font-mono text-xs text-slate/60 truncate max-w-[120px]">
                  {l.entityId}
                </p>
              </div>
            ),
          },
          {
            key: "time",
            label: "Time",
            render: (l) => (
              <p className="font-body text-sm text-slate whitespace-nowrap">
                {new Date(l.createdAt).toLocaleString("en-NG", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}
