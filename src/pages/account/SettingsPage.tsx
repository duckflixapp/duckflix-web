import { ChevronRight, LogOut, Mail, RectangleEllipsis, ScanQrCode, Shield, User, UserKey, type LucideIcon } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { capitalize } from '../../utils/string';
import { useNavigate } from 'react-router-dom';

export default function AccountSettingsPage() {
    const auth = useAuthContext();
    const navigate = useNavigate();

    if (!auth?.user) return null;

    // const handle2Step = () => navigate('/account/settings/2step');
    const handleChangePassword = () => navigate('/account/settings/password');
    const handleAuthenticator = () => navigate('/account/settings/authenticator');

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <Section label="Profile">
                <InfoRow icon={User} label="Display name" value={auth.user.name} />
                <InfoRow
                    icon={Mail}
                    label="Email address"
                    value={auth.user.email}
                    trailing={
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest shrink-0 ${auth.isVerified ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20' : 'bg-amber-500/10 text-amber-300 border border-amber-400/20'}`}
                        >
                            {auth.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                    }
                />
                <InfoRow icon={UserKey} label="Role" value={capitalize(auth.user.role)} last />
            </Section>

            <Section label="Security">
                <ButtonRow icon={Shield} label="2-Step Verification" value="Disabled" type="info" />
                <ButtonRow
                    onClick={handleChangePassword}
                    icon={RectangleEllipsis}
                    label="Password"
                    value="Change your password"
                    type="info"
                />
                <ButtonRow
                    onClick={handleAuthenticator}
                    icon={ScanQrCode}
                    label="Authenticator"
                    value="Setup authenticator to protect your account"
                    type="info"
                    last
                />
            </Section>

            <Section label="Account">
                {/* {!auth.isVerified && (
                    <ButtonRow icon={AlertCircle} label="Verify your email" value="Unlock the full account experience" type="warn" />
                )} */}
                <ButtonRow
                    onClick={auth.logout}
                    icon={LogOut}
                    label="Sign out"
                    value="End the current session on this device"
                    type="danger"
                    last
                />
            </Section>
        </div>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="my-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 px-1 mb-2">{label}</p>
            <div className="rounded-3xl border border-white/8 bg-white/3 overflow-hidden divide-y divide-white/6">{children}</div>
        </div>
    );
}

interface ListRowProps {
    type: 'info' | 'warn' | 'danger';
    icon: LucideIcon;
    label: string;
    value: string;
    last?: boolean;
    trailing?: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value, trailing }: Omit<ListRowProps, 'type'>) {
    return (
        <div className="flex items-center gap-4 px-5 py-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white/5`}>
                <Icon size={15} className="text-white/50" />
            </div>
            <div className="flex-1 min-w-0 text-start">
                <p className={`text-[11px] font-medium text-white/35`}>{label}</p>
                <p className="text-sm font-semibold text-white mt-0.5 truncate">{value}</p>
            </div>
            {trailing}
        </div>
    );
}

const rowColorScheme = {
    danger: {
        icon: 'text-red-400',
        iconBg: 'bg-red-500/10',
        title: 'text-red-400',
    },
    warn: {
        icon: 'text-amber-300',
        iconBg: 'bg-amber-500/10',
        title: 'text-amber-400',
    },
    info: {
        icon: 'text-white/50',
        iconBg: 'bg-white/5',
        title: 'text-white/85',
    },
};

function ButtonRow({
    type,
    icon: Icon,
    label,
    value,
    last,
    onClick,
}: Omit<ListRowProps, 'trailing'> & {
    onClick?: () => unknown;
}) {
    const colorScheme = rowColorScheme[type];
    const chevronColor =
        type === 'info' ? 'group-hover:text-white/50' : type === 'warn' ? 'group-hover:text-amber-400/50' : 'group-hover:text-red-400/50';

    return (
        <button
            type="button"
            className={`group w-full flex items-center gap-4 px-5 py-4 hover:bg-white/4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${last ? 'rounded-b-2xl' : ''}`}
            onClick={onClick}
        >
            <div className={`w-9 h-9 rounded-full  flex items-center justify-center shrink-0 ${colorScheme.iconBg}`}>
                <Icon size={16} className={colorScheme.icon} />
            </div>
            <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium ${colorScheme.title}`}>{label}</p>
                <p className="text-xs text-white/40 mt-0.5">{value}</p>
            </div>
            <ChevronRight size={16} className={`text-white/25 transition-colors shrink-0 ${chevronColor}`} />
        </button>
    );
}
