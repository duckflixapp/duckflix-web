import { AlertCircle, CheckCircle2, LogOut, Mail, Shield, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { capitalize } from '../../utils/string';

export default function AccountSettingsPage() {
    const auth = useAuthContext();

    if (!auth?.user) return null;

    return (
        <div className="max-w-5xl w-full xl:pr-40 mx-auto p-6 md:p-10 pb-24">
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="text-primary" size={28} />
                    Account Settings
                </h1>
                <p className="text-white/40 text-sm mt-1">Review your profile details and account status.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
                <section className="rounded-4xl border border-white/8 bg-white/3 backdrop-blur-2xl p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35 font-bold">Profile</p>
                            <h2 className="mt-3 text-2xl font-bold text-white">{auth.user.name}</h2>
                            <p className="mt-1 text-sm text-white/45">{auth.user.email}</p>
                        </div>

                        <div
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                                auth.isVerified
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/15'
                                    : 'bg-amber-500/10 text-amber-300 border border-amber-400/15'
                            }`}
                        >
                            {auth.isVerified ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            {auth.isVerified ? 'Verified' : 'Verification Needed'}
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoCard icon={User} label="Display Name" value={auth.user.name} />
                        <InfoCard icon={Mail} label="Email Address" value={auth.user.email} />
                        <InfoCard icon={Shield} label="Role" value={capitalize(auth.user.role)} />
                    </div>
                </section>

                <section className="rounded-4xl border border-white/8 bg-white/3 backdrop-blur-2xl p-6 md:p-8 space-y-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35 font-bold">Actions</p>
                        <h2 className="mt-3 text-xl font-bold text-white">Account controls</h2>
                    </div>

                    {!auth.isVerified && (
                        <Link
                            to="/verify-email"
                            className="flex items-center justify-between gap-3 rounded-3xl border border-amber-400/15 bg-amber-500/8 px-4 py-4 text-left transition-colors hover:bg-amber-500/12"
                        >
                            <div>
                                <p className="text-sm font-semibold text-white">Verify your email</p>
                                <p className="text-xs text-white/45 mt-1">Unlock the full account flow and remove verification prompts.</p>
                            </div>
                            <AlertCircle className="shrink-0 text-amber-300" size={18} />
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={auth.logout}
                        className="w-full flex items-center justify-between gap-3 rounded-3xl border border-red-500/15 bg-red-500/8 px-4 py-4 text-left transition-colors cursor-pointer hover:bg-red-500/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                    >
                        <div>
                            <p className="text-sm font-semibold text-white">Sign out</p>
                            <p className="text-xs text-white/45 mt-1">End the current session on this device.</p>
                        </div>
                        <LogOut className="shrink-0 text-red-300" size={18} />
                    </button>
                </section>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-white/8 bg-background/35 px-4 py-4">
            <div className="flex items-center gap-2 text-white/35">
                <Icon size={15} />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-white wrap-break-word">{value}</p>
        </div>
    );
}
