import { useState } from 'react';
import { UserPlus, Shield, Mail, Loader2, Edit2, type LucideIcon, UserLock, Trash2 } from 'lucide-react';
import type { UserRole } from '@duckflix/shared';
import { useAdminUsers } from '../../hooks/useAdminUser';

export default function UsersPage() {
    const { users, loading, updateRole, isUpdating, deleteUser } = useAdminUsers();

    // Form state
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'watcher' | 'contributor' | 'admin'>('watcher');

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        updateRole({ email, role });
    };

    const handleDeleteUser = async (userEmail: string) => {
        if (!confirm(`Are you sure you want to delete ${userEmail}?`)) return;
        deleteUser({ email: userEmail });
    };

    if (loading)
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );

    const getInputClassName = () => `
        w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm 
        outline-none transition-all focus:border-primary/50 text-white
    `;

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20">
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <UserLock className="text-primary" size={28} />
                    User Roles
                </h1>
                <p className="text-white/40 text-sm mt-1">Manage user roles and permissions across the platform.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <AdminSection title="Assign Role" icon={UserPlus}>
                    <form onSubmit={handleUpdateRole} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="User Email" description="Enter the email of the user you want to modify">
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        placeholder="user@example.com"
                                        className={getInputClassName()}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                </div>
                            </InputGroup>

                            <InputGroup label="System Role" description="Select the permission level">
                                <select
                                    className={`${getInputClassName()} appearance-none cursor-pointer pr-10`}
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                >
                                    <option value="watcher" className="bg-[#1a1a1a]">
                                        Watcher (View only)
                                    </option>
                                    <option value="contributor" className="bg-[#1a1a1a]">
                                        Contributor (Can upload)
                                    </option>
                                    <option value="admin" className="bg-[#1a1a1a]">
                                        Admin (Full access)
                                    </option>
                                </select>
                            </InputGroup>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isUpdating || !email}
                                className="bg-primary hover:bg-primary/80 text-black text-sm font-medium px-8 py-2.5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUpdating && <Loader2 size={16} className="animate-spin" />}
                                Update Permissions
                            </button>
                        </div>
                    </form>
                </AdminSection>

                <AdminSection title="Active Users" icon={Shield}>
                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/2">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Current Role</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-white/2 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-white/80">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-[10px] px-2.5 py-1 rounded-lg uppercase font-bold tracking-wider ${
                                                    user.role === 'admin'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : user.role === 'contributor'
                                                          ? 'bg-blue-500/20 text-blue-400'
                                                          : 'bg-white/10 text-white/40'
                                                }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setEmail(user.email);
                                                    setRole(user.role);
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/20 hover:text-primary"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.email)}
                                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/20 hover:text-red-400"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AdminSection>
            </div>
        </div>
    );
}

function InputGroup({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2.5 w-full">
            <div className="flex flex-col">
                <label className="text-[13px] font-bold text-white/80 tracking-tight">{label}</label>
                {description && <span className="text-[10px] text-white/40 mt-0.5">{description}</span>}
            </div>
            {children}
        </div>
    );
}

function AdminSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
    return (
        <div className="bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-4xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-primary">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-white/90 tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    );
}
