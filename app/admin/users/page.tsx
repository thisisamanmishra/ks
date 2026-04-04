'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CustomerProfileModal from '@/components/admin/CustomerProfileModal'
import VendorProfileModal from '@/components/admin/VendorProfileModal'

interface User {
  id: number
  fullname: string
  email: string
  phone: string
  role: string
  department: string | null
  pillar_role: string | null
  is_approved: boolean
  status: string
  created_at: string
  last_login: string | null
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  vendor: 'bg-cyan-100 text-cyan-700',
  customer: 'bg-green-100 text-green-700',
  pending_admin: 'bg-amber-100 text-amber-700',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)
  const [profileVendorId, setProfileVendorId] = useState<number | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)

    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.users || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [page, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const updateUser = async (id: number, updates: Record<string, unknown>) => {
    setActionLoading(id)
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await fetchUsers()
    setActionLoading(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">👥 User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 text-sm shadow-sm"
          />
        </form>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-navy"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="vendor">Vendor</option>
          <option value="customer">Customer</option>
          <option value="pending_admin">Pending Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left p-4 font-semibold text-slate-600">User</th>
                <th className="text-left p-4 font-semibold text-slate-600">Role</th>
                <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                <th className="text-left p-4 font-semibold text-slate-600">Joined</th>
                <th className="text-right p-4 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td colSpan={5} className="p-4">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No users found</td>
                </tr>
              ) : (
                users.map(user => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-sm">
                          {user.fullname.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              if (user.role === 'customer') setProfileUserId(user.id)
                            }}
                            className={`font-medium text-navy ${user.role === 'customer' ? 'hover:text-accent hover:underline cursor-pointer' : 'cursor-default'}`}
                          >
                            {user.fullname}
                          </button>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${roleColors[user.role] || 'bg-slate-100 text-slate-600'}`}>
                        {user.role === 'admin' && user.department 
                           ? (user.department === 'operations' && user.pillar_role === 'project_manager' ? 'project_manager'
                              : user.department === 'operations' ? 'operation_head'
                              : `${user.department}_head`).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                           : user.role === 'pillar_member' && user.pillar_role
                           ? `${user.pillar_role}_saarthi`.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                           : user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {user.department && user.role !== 'admin' && (
                        <span className="ml-1 text-xs text-slate-400 capitalize">({user.department})</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.status === 'active' ? 'bg-green-500' : user.status === 'blocked' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-sm capitalize">{user.status}</span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== 'super_admin' && (
                          <>
                            <button
                              onClick={() => updateUser(user.id, { status: user.status === 'blocked' ? 'active' : 'blocked' })}
                              disabled={actionLoading === user.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                user.status === 'blocked'
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                            >
                              {actionLoading === user.id ? '...' : user.status === 'blocked' ? 'Unblock' : 'Block'}
                            </button>
                            {user.role !== 'board_member' && (
                              <select
                                value={
                                  user.role === 'admin' && (user.department === 'digital' || user.pillar_role === 'digital') ? 'digital_head' :
                                  user.role === 'admin' && user.department === 'operations' && user.pillar_role === 'project_manager' ? 'pm' :
                                  user.role === 'admin' && user.department === 'operations' ? 'ops_head' :
                                  user.role === 'admin' && user.department === 'marketing' ? 'marketing_head' :
                                  user.role === 'pillar_member' && user.pillar_role ? `pillar_${user.pillar_role}` :
                                  user.role
                                }
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === 'digital_head') updateUser(user.id, { role: 'admin', department: null, pillar_role: 'digital' })
                                  else if (val === 'ops_head') updateUser(user.id, { role: 'admin', department: 'operations', pillar_role: 'operation_head' })
                                  else if (val === 'pm') updateUser(user.id, { role: 'admin', department: 'operations', pillar_role: 'project_manager' }) 
                                  else if (val === 'marketing_head') updateUser(user.id, { role: 'admin', department: 'marketing', pillar_role: null })
                                  else if (val.startsWith('pillar_')) updateUser(user.id, { role: 'pillar_member', department: null, pillar_role: val.split('_')[1] })
                                  else updateUser(user.id, { role: val, department: null, pillar_role: null })
                                }}
                                className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 bg-white focus:outline-none cursor-pointer"
                              >
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                                <option value="admin">Global Admin</option>
                                <option value="digital_head">Digital Marketing Head</option>
                                <option value="ops_head">Operation Head</option>
                                <option value="pm">Project Manager</option>
                                <option value="marketing_head">Marketing Head</option>
                                <option disabled>── 5 Pillars ──</option>
                                <option value="pillar_campus">Campus Saarthi</option>
                                <option value="pillar_digital">Digital Saarthi</option>
                                <option value="pillar_calling">Calling Saarthi</option>
                                <option value="pillar_government">Government Saarthi</option>
                                <option value="pillar_market">Market Saarthi</option>
                              </select>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {page} of {Math.ceil(total / 20)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile modals */}
      <CustomerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      <VendorProfileModal vendorId={profileVendorId} onClose={() => setProfileVendorId(null)} />
    </div>
  )
}
