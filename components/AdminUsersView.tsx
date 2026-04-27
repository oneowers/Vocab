"use client"

import { useEffect, useState } from "react"

import { AdminTable } from "@/components/AdminTable"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import { formatTimestamp } from "@/lib/date"
import type { AdminUserRow, AdminUsersPayload, Role } from "@/lib/types"

export function AdminUsersView() {
  const [payload, setPayload] = useState<AdminUsersPayload | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const { data, loading, refreshing } = useClientResource<AdminUsersPayload>({
    key: `admin-users:${page}:${search}`,
    loader: async () => {
      const response = await fetch(
        `/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`,
        {
          cache: "no-store"
        }
      )

      if (!response.ok) {
        throw new Error("Could not load users.")
      }

      return (await response.json()) as AdminUsersPayload
    },
    onError: () => {
      showToast("Could not load users.", "error")
    }
  })

  useEffect(() => {
    if (data) {
      setPayload(data)
    }
  }, [data])

  async function handleRoleChange(user: AdminUserRow, nextRole: Role) {
    if (user.role === nextRole) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role: nextRole
        })
      })

      if (!response.ok) {
        throw new Error("Role update failed.")
      }

      setPayload((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === user.id ? { ...item, role: nextRole } : item
              )
            }
          : current
      )
      showToast("User role updated.", "success")
    } catch {
      showToast("Could not update the user role.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleExportCsv() {
    try {
      const response = await fetch(
        `/api/admin/users?all=true&search=${encodeURIComponent(search)}`,
        {
          cache: "no-store"
        }
      )

      if (!response.ok) {
        throw new Error("Could not export users.")
      }

      const exportPayload = (await response.json()) as AdminUsersPayload
      const rows = [
        ["Name", "Email", "Role", "Cards", "Reviews", "Streak", "Last active"],
        ...exportPayload.items.map((item) => [
          item.name || "",
          item.email,
          item.role,
          String(item.cardCount),
          String(item.reviewCount),
          String(item.streak),
          item.lastActiveAt || ""
        ])
      ]

      const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "wlingo-users.csv"
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast("Could not export users.", "error")
    }
  }

  async function confirmDelete() {
    if (!selectedUser) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Delete failed.")
      }

      setPayload((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== selectedUser.id)
            }
          : current
      )
      setSelectedUser(null)
      showToast("User deleted.", "success")
    } catch {
      showToast("Could not delete the user.", "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AdminTable
        title="Users"
        subtitle="Manage access, roles, and activity."
        actions={
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              placeholder="Search name or email"
              className="input-field"
            />
            <button
              type="button"
              onClick={() => void handleExportCsv()}
              className="button-secondary"
            >
              Export CSV
            </button>
          </div>
        }
      >
        {loading || !payload ? (
          <div className="skeleton h-80 rounded-[1.75rem]" />
        ) : (
          <div className={`transition-opacity ${refreshing ? "opacity-70" : "opacity-100"}`}>
            <div className="space-y-3 md:hidden">
              {payload.items.map((user) => (
                <article key={user.id} className="rounded-card border border-separator bg-bg-primary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[17px] font-semibold text-text-primary">{user.name || "—"}</p>
                      <p className="mt-1 text-[15px] text-text-secondary">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-semibold text-text-primary">
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-text-tertiary">
                    <div>Cards: {user.cardCount}</div>
                    <div>Reviews: {user.reviewCount}</div>
                    <div>Streak: {user.streak}</div>
                    <div>Last active: {user.lastActiveAt ? formatTimestamp(user.lastActiveAt) : "—"}</div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <select
                      value={user.role}
                      disabled={submitting}
                      onChange={(event) =>
                        void handleRoleChange(user, event.target.value as Role)
                      }
                      className="input-field"
                    >
                      <option value="USER">USER</option>
                      <option value="PRO">PRO</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="button-secondary border-separator text-dangerText"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden min-w-full text-left text-sm md:table">
              <thead className="text-quiet">
                <tr>
                  {[
                    "Avatar",
                    "Name",
                    "Email",
                    "Role",
                    "Cards",
                    "Reviews",
                    "Streak",
                    "Last active",
                    "Actions"
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.items.map((user) => (
                  <tr key={user.id} className="border-t border-line">
                    <td className="px-3 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary text-sm font-semibold text-text-primary">
                        {(user.name || user.email).slice(0, 1).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-3 py-4 font-medium text-ink">{user.name || "—"}</td>
                    <td className="px-3 py-4 text-muted">{user.email}</td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-bg-secondary px-3 py-1 text-xs font-semibold text-text-primary">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-muted">{user.cardCount}</td>
                    <td className="px-3 py-4 text-muted">{user.reviewCount}</td>
                    <td className="px-3 py-4 text-muted">{user.streak}</td>
                    <td className="px-3 py-4 text-muted">
                      {user.lastActiveAt ? formatTimestamp(user.lastActiveAt) : "—"}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={user.role}
                          disabled={submitting}
                          onChange={(event) =>
                            void handleRoleChange(user, event.target.value as Role)
                          }
                          className="input-field w-auto min-w-[112px] px-3 text-xs font-medium"
                        >
                          <option value="USER">USER</option>
                          <option value="PRO">PRO</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="button-secondary border-separator px-3 py-2 text-xs font-medium text-dangerText"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted">
                Page {payload.page} of {payload.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page === 1}
                  className="button-secondary"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(current + 1, payload.totalPages)
                    )
                  }
                  disabled={page >= payload.totalPages}
                  className="button-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminTable>

      <ConfirmModal
        open={Boolean(selectedUser)}
        title="Delete user?"
        description={
          selectedUser
            ? `This removes ${selectedUser.email} and all of their cards and review logs.`
            : ""
        }
        onCancel={() => setSelectedUser(null)}
        onConfirm={() => void confirmDelete()}
        loading={submitting}
      />
    </>
  )
}
