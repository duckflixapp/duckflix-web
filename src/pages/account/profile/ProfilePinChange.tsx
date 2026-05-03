import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '../../../components/buttons/BackButton';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useProfilePin } from '../../../hooks/useProfile';
import { Section } from '../Components';

export default function ProfilePinChangePage() {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const { updatePin, isUpdatingPin } = useProfilePin();
    const [currentPin, setCurrentPin] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!auth?.account) return null;

    const hasPin = auth.profile?.hasPin ?? false;

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (hasPin && !/^\d{4}$/.test(currentPin)) {
            setError('Current PIN must be exactly 4 digits.');
            return;
        }

        if (!/^\d{4}$/.test(pin)) {
            setError('New PIN must be exactly 4 digits.');
            return;
        }

        try {
            await updatePin({ pin, currentPin: hasPin ? currentPin : undefined });
            toast.success(hasPin ? 'Profile PIN changed' : 'Profile PIN enabled');
            navigate('/account/profile/pin', { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Failed to update profile PIN.');
            else setError('Failed to update profile PIN.');
        }
    };

    const handleCancel = () => {
        setCurrentPin('');
        setPin('');
        setError(null);
        navigate('/account/profile/pin');
    };

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/profile/pin" label="Profile PIN" />

            <form onSubmit={handleSubmit}>
                <Section label={hasPin ? 'Change PIN' : 'Set PIN'} desc="Use a 4-digit PIN to protect this profile">
                    <div className="flex items-center gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <KeyRound size={15} className="text-white/50" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/85">{hasPin ? 'Change Profile PIN' : 'Set Profile PIN'}</p>
                            <p className="text-xs text-white/40 mt-0.5">
                                {hasPin ? 'Enter your current PIN and choose a new one' : 'Choose a 4-digit PIN'}
                            </p>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-3">
                        {hasPin && (
                            <PinField label="Current PIN" value={currentPin} onChange={setCurrentPin} disabled={isUpdatingPin} autoFocus />
                        )}
                        <PinField label="New PIN" value={pin} onChange={setPin} disabled={isUpdatingPin} autoFocus={!hasPin} />
                        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
                    </div>
                </Section>

                <div className="px-5 py-4 my-2 flex items-center justify-end gap-3">
                    <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-3xl text-sm text-text/75 cursor-pointer">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isUpdatingPin}
                        className={`px-6 py-2 rounded-3xl text-sm text-background font-medium ${
                            !isUpdatingPin ? 'cursor-pointer bg-primary' : 'bg-primary/75'
                        }`}
                    >
                        {isUpdatingPin ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function PinField({
    label,
    value,
    onChange,
    disabled,
    autoFocus,
}: {
    label: string;
    value: string;
    onChange: (value: string) => unknown;
    disabled: boolean;
    autoFocus?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-white/35 px-1">{label}</label>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                maxLength={4}
                disabled={disabled}
                className="outline-0 text-sm px-1 py-1.5 disabled:opacity-55"
                autoFocus={autoFocus}
            />
        </div>
    );
}
