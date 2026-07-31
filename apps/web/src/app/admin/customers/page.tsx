"use client"

import { useEffect, useState, useCallback } from "react"
import { Search, Shield, ShieldOff, Trash2, Edit2, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/admin-page-header"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  emailVerified: boolean
  createdAt: string
  _count: { policies: number; claims: number }
}

interface EditModalProps {
  user: User
  onClose: () => void
  onSave: (updated: User) => void
}

function EditModal({ user, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    role: user.role,
    emailVerified: user.emailVerified,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await api.patch(`/users/admin/${user.id}`, form)
      onSave(res.data)
      toast.success('User updated successfully.')
      onClose()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message
      toast.error(message || 'Could not update user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="font-display font-bold text-midnight text-xl mb-6">
          Edit User
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                First Name
              </label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Last Name
              </label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-midnight mb-1.5">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
            />
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-midnight mb-1.5">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak bg-white"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="emailVerified"
              checked={form.emailVerified}
              onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })}
              className="w-4 h-4 accent-daybreak"
            />
            <label htmlFor="emailVerified" className="font-body text-sm text-midnight">
              Email Verified
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-slate/20 text-midnight font-body text-sm font-semibold py-2.5 rounded-xl hover:border-midnight transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-daybreak text-midnight font-body text-sm font-bold py-2.5 rounded-xl hover:bg-[#C4700E] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/admin/all')
      setUsers(res.data)
    } catch {
      toast.error('Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesSearch =
      !search ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    return matchesRole && matchesSearch
  })

  async function handleMakeAdmin(user: User) {
    const newRole = user.role === 'admin' ? 'customer' : 'admin'
    const action = newRole === 'admin' ? 'make admin' : 'remove admin'
    if (!confirm(`Are you sure you want to ${action} for ${user.firstName} ${user.lastName}?`)) return

    try {
      const res = await api.patch(`/users/admin/${user.id}`, { role: newRole })
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: res.data.role } : u))
      toast.success(`${user.firstName} is now a ${newRole}.`)
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message
      toast.error(message || 'Could not update role.')
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Permanently delete ${user.firstName} ${user.lastName}'s account? This cannot be undone.`)) return
    setDeletingId(user.id)
    try {
      await api.delete(`/users/admin/${user.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      toast.success('User account deleted.')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message
      toast.error(message || 'Could not delete user.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleEditSave(updated: User) {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, ...updated } : u))
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <AdminPageHeader
        title="User Management"
        subtitle={`${users.length} total users · ${users.filter((u) => u.role === 'admin').length} admins`}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate/20 rounded-xl font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'customer', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2.5 rounded-xl font-body text-sm font-medium capitalize transition-colors ${
                roleFilter === role
                  ? 'bg-midnight text-white'
                  : 'border border-slate/20 text-slate hover:border-midnight hover:text-midnight'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-body text-slate text-sm">No users found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate/5 border-b border-slate/10">
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3">User</th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3 hidden md:table-cell">Phone</th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3">Role</th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Verified</th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Policies</th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/5">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate/5 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-midnight/10 flex items-center justify-center shrink-0">
                        <span className="font-body text-xs font-bold text-midnight">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-sm font-semibold text-midnight">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="font-body text-xs text-slate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="font-body text-sm text-midnight">{user.phone || '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      user.role === 'admin'
                        ? 'bg-midnight/10 text-midnight'
                        : 'bg-slate/10 text-slate'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    {user.emailVerified ? (
                      <CheckCircle size={16} className="text-cover-green" />
                    ) : (
                      <XCircle size={16} className="text-slate" />
                    )}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <p className="font-body text-sm text-midnight">
                      {user._count.policies} policies · {user._count.claims} claims
                    </p>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <p className="font-body text-xs text-slate">
                      {new Date(user.createdAt).toLocaleDateString('en-NG')}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 rounded-lg hover:bg-slate/10 text-slate hover:text-midnight transition-colors"
                        title="Edit user"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => handleMakeAdmin(user)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.role === 'admin'
                            ? 'hover:bg-alert-coral/10 text-alert-coral hover:text-alert-coral'
                            : 'hover:bg-midnight/10 text-slate hover:text-midnight'
                        }`}
                        title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      >
                        {user.role === 'admin' ? <ShieldOff size={15} /> : <Shield size={15} />}
                      </button>

                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        className="p-1.5 rounded-lg hover:bg-alert-coral/10 text-slate hover:text-alert-coral transition-colors disabled:opacity-50"
                        title="Delete account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}
