import { useState, type SubmitEvent } from 'react';
import axios from 'axios';
import { KeyRound, Loader2, Mail, User, UserKey } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '../../../contexts/AuthContext';
import { Header, InfoRow, Section } from '../Components';
import { capitalize } from '../../../utils/string';
import { useProfilePin } from '../../../hooks/useProfile';

export default function ProfilePage() {
    const auth = useAuthContext();
    const { updatePin, removePin, isUpdatingPin, isRemovingPin } = useProfilePin();
    const [pinMode, setPinMode] = useState<'set' | 'remove' | null>(null);
    const [pin, setPin] = useState('');
    const [currentPin, setCurrentPin] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!auth?.account) return null;

    const isBusy = isUpdatingPin || isRemovingPin;
    const hasPin = auth.profile?.hasPin ?? false;

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
