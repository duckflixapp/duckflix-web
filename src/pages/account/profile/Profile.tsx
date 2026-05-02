import { Mail, UserKey } from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Header, InfoRow, Section } from '../Components';
import { capitalize } from '../../../utils/string';

export default function ProfilePage() {
    const auth = useAuthContext();

    if (!auth?.account) return null;

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <Header title="My Profile" />

            <Section label="Profile" desc="View and edit your Duckflix profile.">
                {/* <InfoRow icon={User} label="Display name" value={auth.profile?.name ?? ''} /> */}
                <InfoRow
                    icon={Mail}
                    label="Email address"
                    value={auth.account.email}
                    trailing={
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest shrink-0 ${auth.isVerified ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20' : 'bg-amber-500/10 text-amber-300 border border-amber-400/20'}`}
                        >
                            {auth.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                    }
                />
                <InfoRow icon={UserKey} label="Role" value={capitalize(auth.account.role)} last />
            </Section>
        </div>
    );
}
