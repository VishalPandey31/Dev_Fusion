import React, { useEffect, useState, useContext } from 'react'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, Activity, LogOut, Check, X, Trash2, Plus } from 'lucide-react'

const AdminDashboard = () => {
    const { user, setUser } = useContext(UserContext)
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [logs, setLogs] = useState([])
    const [activeTab, setActiveTab] = useState('users') // 'users' or 'logs'
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)

    // Add User Form State
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        if (!user || !user.isAdmin) {
            navigate('/admin-login')
            return
        }
        fetchUsers()
        fetchLogs()
    }, [user, navigate])

    function fetchUsers() {
        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => console.error(err))
    }

    function fetchLogs() {
        // Assuming we have this endpoint, if not I'll need to create it or similar
        // Based on plan, I need to create 'getAuditLogs' in backend or reuse 'getAllLogsController'
        axios.get('/admin/audit-logs').then(res => {
            setLogs(res.data.logs)
        }).catch(err => console.error(err))
    }

    function toggleApproval(userId, currentStatus) {
        // Re-using the approveUserController logic or creating a toggle
        // For now, let's use the '/users/approve' endpoint which sets isApproved=true
        // If we want to REVOKE, we need a revoke endpoint. The user asked for "assign or revoke".

        // I will implement a dedicated toggle in backend or just use approve for now and assume revoke isn't strictly requested in Detail?
        // User said: "Assign or revoke login permissions" -> YES, strict requirement.
        // I need to ensure backend supports revoking. 
        // For now I will assume approveUserController ONLY approves. I might need to add revoke logic.

        axios.put('/admin/manage-user', { userId, action: currentStatus ? 'revoke' : 'approve' })
            .then(() => {
                fetchUsers()
            })
            .catch(err => alert(err.response?.data?.error || "Action failed"))
    }

    function addUser(e) {
        e.preventDefault()
        // Admin creating a member
        // We can use the register endpoint but bypass proof?
        // Or a specific admin-create-user endpoint.
        // User requirement: "Admin must register first... then... Add new team members"

        axios.put('/admin/manage-user', {
            action: 'create',
            email: newEmail,
            password: newPassword
        }).then(res => {
            alert("User created successfully")
            setIsAddUserModalOpen(false)
            setNewEmail('')
            setNewPassword('')
            fetchUsers()
        }).catch(err => alert(err.response?.data?.error || "Failed to create user"))
    }

    function removeUser(userId) {
        if (!confirm("Are you sure? This accounts and data will be lost.")) return;
        axios.put('/admin/manage-user', { userId, action: 'remove' })
            .then(() => fetchUsers())
            .catch(err => alert("Failed to remove"))
    }

    function logout() {
        axios.get('/users/logout').then(() => {
            localStorage.removeItem('token')
            setUser(null)
            navigate('/admin-login')
        })
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
            {/* Header */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Admin Console</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">Welcome, Administrator</span>
                    <button onClick={logout} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex flex-grow overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                    <nav className="p-4 space-y-2">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600/10 text-blue-500 border border-blue-600/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="font-medium">User Management</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'logs' ? 'bg-blue-600/10 text-blue-500 border border-blue-600/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                        >
                            <Activity className="w-5 h-5" />
                            <span className="font-medium">Audit Logs</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-grow p-8 overflow-auto bg-slate-950 relative">

                    {activeTab === 'users' && (
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Team Members</h2>
                                <button onClick={() => setIsAddUserModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all">
                                    <Plus className="w-4 h-4" /> Add Member
                                </button>
                            </div>

                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                                            <th className="p-4 font-semibold">Email</th>
                                            <th className="p-4 font-semibold">Role</th>
                                            <th className="p-4 font-semibold">Status</th>
                                            <th className="p-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-sm">
                                        {users.map(u => (
                                            <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 text-slate-300 font-medium">{u.email}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${u.isAdmin ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-700/50 text-slate-400 border border-slate-600'}`}>
                                                        {u.isAdmin ? 'Admin' : 'Member'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {u.isApproved ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-400">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-amber-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right flex items-center justify-end gap-2">
                                                    {!u.isAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => toggleApproval(u._id, u.isApproved)}
                                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${u.isApproved ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                                                            >
                                                                {u.isApproved ? "Revoke Access" : "Data Grant"}
                                                            </button>
                                                            <button
                                                                onClick={() => removeUser(u._id)}
                                                                className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-md text-xs font-medium transition-colors"
                                                            >
                                                                Remove User
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6">Activity Logs</h2>
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                                            <th className="p-4 font-semibold">User</th>
                                            <th className="p-4 font-semibold">Role</th>
                                            <th className="p-4 font-semibold">Login Time</th>
                                            <th className="p-4 font-semibold">Logout Time</th>
                                            <th className="p-4 font-semibold">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-sm">
                                        {logs.map((log, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 text-slate-300 font-medium">{log.email}</td>
                                                <td className="p-4 text-slate-400">{log.role}</td>
                                                <td className="p-4 text-emerald-400">{new Date(log.loginTime).toLocaleString()}</td>
                                                <td className="p-4 text-amber-400">{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : '-'}</td>
                                                <td className="p-4 text-slate-500 text-xs font-mono">{log.ipAddress || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </main>

                {/* Add User Modal */}
                {isAddUserModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm shadow-2xl">
                            <h3 className="text-lg font-bold mb-4">Add Team Member</h3>
                            <form onSubmit={addUser} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Set Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 justify-end mt-6">
                                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 hover:bg-slate-800 rounded text-slate-400 transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">Create Member</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default AdminDashboard
