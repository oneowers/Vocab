"use client"

import { useState } from "react"
import { Plus, Ticket, Trash, Power, PowerOff, Crown } from "lucide-react"

import {
  AdminBadge,
  AdminEmptyState,
  AdminPageIntro,
  AdminPagination,
  AdminPillButton,
  AdminSurface
} from "@/components/admin/AdminAppleUI"
import { useToast } from "@/components/Toast"
import { useClientResource } from "@/hooks/useClientResource"
import type { AdminPromoCodesPayload } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

export function AdminPromoCodesView({ embedded = false }: { embedded?: boolean }) {
  const { showToast } = useToast()
  const [page, setPage] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data, loading, revalidate } = useClientResource<AdminPromoCodesPayload>({
    key: `admin:promo-codes:page=${page}`,
    loader: async () => {
      const response = await fetch(`/api/admin/promo-codes?page=${page}`)
      if (!response.ok) {
        throw new Error("Could not load promo codes.")
      }
      return await response.json()
    },
    onError: () => showToast("Could not load promo codes.", "error")
  })

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) {
        throw new Error()
      }

      showToast(`Promo code ${!currentStatus ? 'activated' : 'deactivated'}`, "success")
      void revalidate()
    } catch {
      showToast("Failed to update status", "error")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this promo code?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error()
      }

      showToast("Promo code deleted", "success")
      void revalidate()
    } catch {
      showToast("Failed to delete promo code", "error")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!embedded ? (
        <AdminPageIntro
          title="Promo Codes"
          description="Manage PRO subscription codes."
          actions={
            <AdminPillButton type="button" tone="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              Create Promo Code
            </AdminPillButton>
          }
        />
      ) : null}

      {embedded ? (
        <div className="flex justify-end">
          <AdminPillButton type="button" tone="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            Create Promo Code
          </AdminPillButton>
        </div>
      ) : null}

      <AdminSurface
        className={
          embedded
            ? "overflow-hidden border-0 bg-transparent p-0 shadow-none"
            : "overflow-hidden p-1"
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/34">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Uses</th>
                <th className="p-4 font-semibold">Duration</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/40">
                    Loading promo codes...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/40">
                    <div className="py-4">
                      <AdminEmptyState
                        title="No promo codes yet"
                        description="Create the first subscription code to start running campaigns and grants."
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map((code) => (
                  <tr key={code.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white uppercase tracking-wider">{code.code}</span>
                        {code.description && <span className="text-[12px] text-white/40">{code.description}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${code.maxUses && code.currentUses >= code.maxUses ? 'text-rose-400' : 'text-white'}`}>
                        {code.currentUses} {code.maxUses ? `/ ${code.maxUses}` : '(Unlimited)'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-white/80">
                        <Crown size={14} className="text-amber-400" />
                        {code.proDurationDays} days
                      </span>
                    </td>
                    <td className="p-4">
                      <AdminBadge tone={code.isActive ? "success" : "danger"}>{code.isActive ? "Active" : "Inactive"}</AdminBadge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(code.id, code.isActive)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            code.isActive 
                              ? 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white' 
                              : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                          title={code.isActive ? "Deactivate" : "Activate"}
                        >
                          {code.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(code.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
                          title="Delete"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminSurface>

      {data && !embedded ? (
        <AdminPagination
          page={data.page}
          totalPages={data.totalPages}
          onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
          onNext={() => setPage((current) => Math.min(current + 1, data.totalPages))}
        />
      ) : null}

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreatePromoCodeModal 
            onClose={() => setIsCreateModalOpen(false)} 
            onSuccess={() => {
              setIsCreateModalOpen(false)
              void revalidate()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreatePromoCodeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    maxUses: "",
    proDurationDays: "30"
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.code.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          description: formData.description,
          maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : undefined,
          proDurationDays: parseInt(formData.proDurationDays, 10) || 30
        })
      })

      if (!response.ok) {
        throw new Error()
      }

      showToast("Promo code created", "success")
      onSuccess()
    } catch {
      showToast("Failed to create promo code", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0B] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/20">
            <Ticket className="text-blue-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">New Promo Code</h2>
            <p className="text-[13px] text-white/50">Create a code for PRO subscription</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-white/40">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. SUMMER2026"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[15px] text-white outline-none focus:border-blue-500/50 focus:bg-white/10 uppercase"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-wider text-white/40">Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Summer campaign"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[15px] text-white outline-none focus:border-blue-500/50 focus:bg-white/10"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-white/40">Uses Limit</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                placeholder="Unlimited"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[15px] text-white outline-none focus:border-blue-500/50 focus:bg-white/10"
                min="1"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-white/40">PRO Days</label>
              <input
                type="number"
                value={formData.proDurationDays}
                onChange={(e) => setFormData(prev => ({ ...prev, proDurationDays: e.target.value }))}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[15px] text-white outline-none focus:border-blue-500/50 focus:bg-white/10"
                min="1"
                required
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl bg-white/5 text-[14px] font-bold text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.code.trim()}
              className="h-12 flex-1 rounded-xl bg-blue-500 text-[14px] font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Code"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
