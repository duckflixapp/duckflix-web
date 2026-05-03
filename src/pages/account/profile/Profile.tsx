import { useState, type SubmitEvent } from 'react';
import axios from 'axios';
import { AlertTriangle, KeyRound, Loader2, Mail, User, UserKey, UserMinus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import { ButtonRow, Header, InfoRow, Section } from '../Components';
import { capitalize } from '../../../utils/string';
import { useDeleteProfile, useProfilePin } from '../../../hooks/useProfile';
import { ROUTES } from '../../../config/routes';

export default function ProfilePage() {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const { updatePin, removePin, isUpdatingPin, isRemovingPin } = useProfilePin();
    const { deleteProfile, isDeletingProfile } = useDeleteProfile();
    const [pinMode, setPinMode] = useState<'set' | 'remove' | null>(null);
    const [pin, setPin] = useState('');
    const [currentPin, setCurrentPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [confirmProfileName, setConfirmProfileName] = useState('');
    const [deleteProfilePin, setDeleteProfilePin] = useState('');
    const [deleteProfileError, setDeleteProfileError] = useState<string | null>(null);

    if (!auth?.account) return null;

    const isBusy = isUpdatingPin || isRemovingPin;
    const hasPin = auth.profile?.hasPin ?? false;
    const profileName = auth.profile?.name ?? '';
    const profileNameMatches = confirmProfileName.trim() === profileName;
    const deleteProfilePinValid = !hasPin || /^\d{4}$/.test(deleteProfilePin);

    const resetPinForm = () => {
        setPinMode(null);
        setPin('');
        setCurrentPin('');
        setError(null);
    };

    const handleSetPin = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!/^\d{4}$/.test(pin)) {
            setError('Profile PIN must be exactly 4 digits.');
            return;
        }

        if (hasPin && !/^\d{4}$/.test(currentPin)) {
            setError('Current PIN must be exactly 4 digits.');
            return;
        }

        try {
            await updatePin({ pin, currentPin: hasPin ? currentPin : undefined });
            toast.success(hasPin ? 'Profile PIN changed' : 'Profile PIN enabled');
            resetPinForm();
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Failed to update profile PIN.');
            else setError('Failed to update profile PIN.');
        }
    };

    const handleRemovePin = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!/^\d{4}$/.test(currentPin)) {
            setError('Current PIN must be exactly 4 digits.');
            return;
        }

        try {
            await removePin(currentPin);
            toast.success('Profile PIN removed');
            resetPinForm();
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Failed to remove profile PIN.');
            else setError('Failed to remove profile PIN.');
        }
    };

    const openDeleteProfileConfirm = () => {
        setConfirmProfileName('');
        setDeleteProfilePin('');
        setDeleteProfileError(null);
        setDeleteConfirmOpen(true);
    };

    const closeDeleteProfileConfirm = () => {
        if (isDeletingProfile) return;
        setDeleteConfirmOpen(false);
        setConfirmProfileName('');
        setDeleteProfilePin('');
        setDeleteProfileError(null);
    };

    const handleDeleteProfile = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!auth.profile || !profileNameMatches || !deleteProfilePinValid || isDeletingProfile) return;

        setDeleteProfileError(null);
        try {
            await deleteProfile({ pin: hasPin ? deleteProfilePin : undefined });
            toast.success('Profile deleted');
            closeDeleteProfileConfirm();
            navigate(ROUTES.routeOf('select-profile'), { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) setDeleteProfileError(err.response?.data?.message || 'Failed to delete profile.');
            else setDeleteProfileError('Failed to delete profile.');
        }
    };

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
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
                <InfoRow
                    icon={KeyRound}
                    label="Profile PIN"
                    value={hasPin ? 'Enabled' : 'Not set'}
                    trailing={
                        <div className="flex shrink-0 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setPinMode('set');
                                }}
                                className="rounded-3xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-text/80 transition-colors hover:bg-white/10"
                            >
                                {hasPin ? 'Change' : 'Set'}
                            </button>
                            {hasPin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setPinMode('remove');
                                    }}
                                    className="rounded-3xl border border-red-500/15 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/15"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    }
                />

                {pinMode === 'set' && (
                    <form onSubmit={handleSetPin} className="flex flex-col gap-3 px-5 py-4">
                        {hasPin && (
                            <PinInput value={currentPin} onChange={setCurrentPin} placeholder="Current PIN" disabled={isBusy} autoFocus />
                        )}
                        <PinInput value={pin} onChange={setPin} placeholder="New PIN" disabled={isBusy} autoFocus={!hasPin} />
                        {error && (
                            <p className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
                        )}
                        <PinActions
                            loading={isUpdatingPin}
                            submitLabel={hasPin ? 'Change PIN' : 'Set PIN'}
                            onCancel={resetPinForm}
                            disabled={isBusy}
                        />
                    </form>
                )}

                {pinMode === 'remove' && (
                    <form onSubmit={handleRemovePin} className="flex flex-col gap-3 px-5 py-4">
                        <PinInput value={currentPin} onChange={setCurrentPin} placeholder="Current PIN" disabled={isBusy} autoFocus />
                        {error && (
                            <p className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
                        )}
                        <PinActions loading={isRemovingPin} submitLabel="Remove PIN" onCancel={resetPinForm} disabled={isBusy} danger />
                    </form>
                )}
            </Section>

            <Section label="Danger Zone" desc="Permanently delete this profile.">
                <ButtonRow
                    icon={UserMinus}
                    label="Delete profile"
                    value="Delete the current profile and its watch data"
                    type="danger"
                    onClick={openDeleteProfileConfirm}
                    last
                />
            </Section>

            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
                        onClick={closeDeleteProfileConfirm}
                        aria-label="Close delete profile confirmation"
                    />
                    <form
                        onSubmit={handleDeleteProfile}
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
                                onClick={closeDeleteProfileConfirm}
                                disabled={isDeletingProfile}
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
                                    disabled={isDeletingProfile}
                                    className={`outline-none text-sm px-4 py-3 rounded-3xl bg-white/5 border transition-colors ${
                                        confirmProfileName && !profileNameMatches
                                            ? 'border-red-500/40'
                                            : 'border-white/8 focus:border-primary/50'
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
                                        <KeyRound
                                            size={15}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text/30 pointer-events-none"
                                        />
                                        <input
                                            value={deleteProfilePin}
                                            onChange={(event) => setDeleteProfilePin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                            type="password"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            placeholder="4-digit PIN"
                                            maxLength={4}
                                            disabled={isDeletingProfile}
                                            className={`w-full outline-none text-sm px-4 py-3 pl-11 rounded-3xl bg-white/5 border transition-colors ${
                                                deleteProfilePin && !deleteProfilePinValid
                                                    ? 'border-red-500/40'
                                                    : 'border-white/8 focus:border-primary/50'
                                            }`}
                                        />
                                    </div>
                                </div>
                            )}

                            {deleteProfileError && (
                                <p className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    {deleteProfileError}
                                </p>
                            )}
                        </div>

                        <div className="px-5 py-4 flex items-center justify-end gap-3 border-t border-white/6">
                            <button
                                type="button"
                                onClick={closeDeleteProfileConfirm}
                                disabled={isDeletingProfile}
                                className="px-5 py-2.5 rounded-3xl text-sm text-text/70 hover:text-text transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!profileNameMatches || !deleteProfilePinValid || isDeletingProfile}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-3xl text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeletingProfile && <Loader2 size={15} className="animate-spin" />}
                                {isDeletingProfile ? 'Deleting...' : 'Delete profile'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function PinInput({
    value,
    onChange,
    placeholder,
    disabled,
    autoFocus,
}: {
    value: string;
    onChange: (value: string) => unknown;
    placeholder: string;
    disabled: boolean;
    autoFocus?: boolean;
}) {
    return (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            maxLength={4}
            disabled={disabled}
            className="w-full rounded-3xl border border-white/10 bg-background/50 px-5 py-3 text-sm text-text outline-none transition-all focus:ring-2 ring-primary/50 disabled:opacity-55"
            autoFocus={autoFocus}
        />
    );
}

function PinActions({
    loading,
    submitLabel,
    onCancel,
    disabled,
    danger = false,
}: {
    loading: boolean;
    submitLabel: string;
    onCancel: () => unknown;
    disabled: boolean;
    danger?: boolean;
}) {
    return (
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
                type="button"
                onClick={onCancel}
                disabled={disabled}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-3xl border border-white/10 bg-secondary/10 py-3 text-sm font-semibold text-text transition-colors hover:bg-secondary/15 disabled:cursor-not-allowed disabled:opacity-55"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={disabled}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-3xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${
                    danger ? 'bg-red-500/90 text-white hover:bg-red-500' : 'bg-primary text-background hover:bg-primary/90'
                }`}
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : submitLabel}
            </button>
        </div>
    );
}
