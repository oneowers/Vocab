"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, Download, Plus, Trash2 } from "lucide-react"

import { AppleCard } from "@/components/AppleDashboardComponents"
import {
  AdminControlGroup,
  AdminEmptyState,
  AdminPagination,
  AdminPillButton,
  AdminSearchInput,
  AdminToolbar
} from "@/components/admin/AdminAppleUI"
import { AdminTable } from "@/components/AdminTable"
import { AdminTableSkeleton } from "@/components/admin/AdminLoadingSkeletons"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import type { AdminUserRow, AdminUsersPayload, Role } from "@/lib/types"

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  onCreated: (user: any) => void
}

function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("USER")
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create user")
      }

      const data = await response.json()
      onCreated(data.user)
      showToast("User created successfully", "success")
      onClose()
    } catch (err: any) {
      showToast(err.message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[2rem] border border-line bg-bg-secondary p-8 shadow-2xl"
      >
        <h2 className="text-2xl font-black text-ink mb-6">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-quiet mb-1.5 px-1">Email</label>
            <input 
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-quiet mb-1.5 px-1">Name</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-quiet mb-1.5 px-1">Password</label>
            <input 
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-quiet mb-1.5 px-1">Role</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className="input-field"
            >
              <option value="USER">USER</option>
              <option value="PRO">PRO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="button-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="button-primary flex-1"
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export function AdminUsersView() {
  const [payload, setPayload] = useState<AdminUsersPayload | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
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
      anchor.download = "lexiflow-users.csv"
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
        hideHeaderText
        surfaceClassName="overflow-visible bg-transparent shadow-none"
        headerClassName="top-[68px] rounded-[30px] bg-transparent px-4 pt-4 pb-4 md:top-0 md:px-0 md:pb-4"
        contentClassName="px-0 pb-0 pt-2 md:px-0"
        actions={
          <AdminToolbar className="gap-4">
            <AdminSearchInput
              className="w-full"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              placeholder="Search name or email"
            />
            <AdminControlGroup className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto md:justify-end">
              <AdminPillButton
                type="button"
                tone="primary"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full justify-center md:w-auto"
              >
                <Plus size={16} />
                Create User
              </AdminPillButton>
              <AdminPillButton type="button" onClick={() => void handleExportCsv()} className="w-full justify-center md:w-auto">
                <Download size={16} />
                Export CSV
              </AdminPillButton>
            </AdminControlGroup>
          </AdminToolbar>
        }
      >
        {loading || !payload ? <AdminTableSkeleton /> : payload.items.length === 0 ? (
          <AdminEmptyState
            title="No users found"
            description="Try a different search or create a new teammate account from this screen."
          />
        ) : (
          <div className={`transition-opacity ${refreshing ? "opacity-70" : "opacity-100"}`}>
            <AppleCard className="overflow-hidden rounded-none border-0 bg-transparent shadow-none p-0">
              {payload.items.map((user, index) => (
                <div key={user.id} className="relative px-4 py-3.5 md:px-0">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-white">{user.email}</p>
                    </div>
                    <div className="relative shrink-0">
                      <select
                        value={user.role}
                        disabled={submitting}
                        onChange={(event) => void handleRoleChange(user, event.target.value as Role)}
                        aria-label={`Change role for ${user.email}`}
                        className="input-field !w-auto h-10 min-w-[108px] appearance-none rounded-full border-white/[0.06] bg-black px-4 pr-9 text-xs font-semibold tracking-[0.08em] md:min-w-[116px]"
                      >
                        <option value="USER">USER</option>
                        <option value="PRO">PRO</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/62" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      aria-label={`Delete ${user.email}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/58 transition active:scale-[0.96] disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {index !== payload.items.length - 1 ? (
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-white/[0.06] md:left-0 md:right-0" />
                  ) : null}
                </div>
              ))}
            </AppleCard>

            <AdminPagination
              page={payload.page}
              totalPages={payload.totalPages}
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() => setPage((current) => Math.min(current + 1, payload.totalPages))}
            />
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

      <CreateUserModal 
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          // Re-fetch current page
          setPage(1)
          setSearch("")
        }}
      />
    </>
  )
}
