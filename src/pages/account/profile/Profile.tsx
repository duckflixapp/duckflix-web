import { useState, type SubmitEvent } from 'react';
import axios from 'axios';
import { AlertTriangle, KeyRound, Loader2, Mail, User, UserKey, UserMinus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import { ButtonRow, Header, InfoRow, Section } from '../Components';
import { capitalize } from '../../../utils/string';
import { useDeleteProfile } from '../../../hooks/useProfile';
import { ROUTES } from '../../../config/routes';

export default function ProfilePage() {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const { deleteProfile, isDeletingProfile } = useDeleteProfile();
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    if (!auth?.account) return null;

    const hasPin = auth.profile?.hasPin ?? false;
    const profileName = auth.profile?.name ?? '';

    const closeDeleteProfileConfirm = () => {
        if (isDeletingProfile) return;
        setDeleteConfirmOpen(false);
    };

    const handleDeleteProfile = async (pin?: string) => {
        await deleteProfile({ pin });
        toast.success('Profile deleted');
        closeDeleteProfileConfirm();
        navigate(ROUTES.routeOf('select-profile'), { replace: true });
    };

    return (
        <div className="max-w-6xl w-full mx-auto px-10 py-6 md:px-16 md:py-10 pb-20 flex flex-col gap-y-8">
            <Header title="My Profile" />

            <Section label="Account" desc="View and edit your account profile.">
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

            <Section label="Personalized" desc="View and edit your personalized profile.">
                <InfoRow icon={User} label="Display name" value={auth.profile?.name ?? ''} />
                <ButtonRow
                    icon={KeyRound}
                    label="Profile PIN"
                    value={hasPin ? 'Enabled' : 'Not set'}
                    type="info"
                    onClick={() => navigate(ROUTES.routeOf('account.profile-pin'))}
                    last
                />
            </Section>

            <Section label="Danger Zone" desc="Permanently delete this profile.">
                <ButtonRow
                    icon={UserMinus}
                    label="Delete profile"
                    value="Delete the current profile and its watch data"
                    type="danger"
                    onClick={() => setDeleteConfirmOpen(true)}
                    last
                />
            </Section>

            {deleteConfirmOpen && (
                <ConfirmDeleteProfile
                    profileName={profileName}
                    hasPin={hasPin}
                    deleting={isDeletingProfile}
                    onClose={closeDeleteProfileConfirm}
                    onConfirm={handleDeleteProfile}
                />
            )}
        </div>
    );
}

function ConfirmDeleteProfile({
    profileName,
    hasPin,
    deleting,
    onClose,
    onConfirm,
}: {
    profileName: string;
    hasPin: boolean;
    deleting: boolean;
    onClose: () => unknown;
    onConfirm: (pin?: string) => Promise<unknown>;
}) {
    const [confirmProfileName, setConfirmProfileName] = useState('');
    const [deleteProfilePin, setDeleteProfilePin] = useState('');
    const [error, setError] = useState<string | null>(null);

    const profileNameMatches = confirmProfileName.trim() === profileName;
    const deleteProfilePinValid = !hasPin || /^\d{4}$/.test(deleteProfilePin);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!profileNameMatches || !deleteProfilePinValid || deleting) return;

        setError(null);
        try {
            await onConfirm(hasPin ? deleteProfilePin : undefined);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Failed to delete profile.');
            else setError('Failed to delete profile.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
                onClick={onClose}
                aria-label="Close delete profile confirmation"
            />
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-md bg-background/60 backdrop-blur-3xl border border-white/7 rounded-3xl sm:rounded-4xl shadow-2xl shadow-black/50 overflow-hidden"
            >
                <div className="flex items-start gap-4 px-5 py-5 border-b border-white/6">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-400">Delete profile</p>
                        <p className="text-xs text-text/45 mt-1 leading-relaxed">
                            This deletes the current profile. Type the profile name to confirm.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="p-1.5 rounded-full text-text/35 hover:text-text/70 hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-text/35 px-1">Profile name</label>
                        <input
                            value={confirmProfileName}
                            onChange={(event) => setConfirmProfileName(event.target.value)}
                            type="text"
                            placeholder={profileName}
                            disabled={deleting}
                            className={`outline-none text-sm px-4 py-3 rounded-3xl bg-white/5 border transition-colors ${
                                confirmProfileName && !profileNameMatches ? 'border-red-500/40' : 'border-white/8 focus:border-primary/50'
                            }`}
                            autoFocus
                        />
                        {confirmProfileName && !profileNameMatches && (
                            <p className="text-xs text-red-400 px-1">Profile name does not match.</p>
                        )}
                    </div>

                    {hasPin && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium text-text/35 px-1">Profile PIN</label>
                            <div className="relative">
                                <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 pointer-events-none" />
                                <input
                                    value={deleteProfilePin}
                                    onChange={(event) => setDeleteProfilePin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                    type="password"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="4-digit PIN"
                                    maxLength={4}
                                    disabled={deleting}
                                    className={`w-full outline-none text-sm px-4 py-3 pl-11 rounded-3xl bg-white/5 border transition-colors ${
                                        deleteProfilePin && !deleteProfilePinValid
                                            ? 'border-red-500/40'
                                            : 'border-white/8 focus:border-primary/50'
                                    }`}
                                />
                            </div>
                        </div>
                    )}

                    {error && <p className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
                </div>

                <div className="px-5 py-4 flex items-center justify-end gap-3 border-t border-white/6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="px-5 py-2.5 rounded-3xl text-sm text-text/70 hover:text-text transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!profileNameMatches || !deleteProfilePinValid || deleting}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-3xl text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {deleting && <Loader2 size={15} className="animate-spin" />}
                        {deleting ? 'Deleting...' : 'Delete profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
