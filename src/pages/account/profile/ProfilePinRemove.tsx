import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '../../../components/buttons/BackButton';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useProfilePin } from '../../../hooks/useProfile';
import { Section } from '../Components';

export default function ProfilePinRemovePage() {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const { removePin, isRemovingPin } = useProfilePin();
    const [currentPin, setCurrentPin] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!auth?.account) return null;

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!/^\d{4}$/.test(currentPin)) {
            setError('Current PIN must be exactly 4 digits.');
            return;
        }

        try {
            await removePin(currentPin);
            toast.success('Profile PIN removed');
            navigate('/account/profile/pin', { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Failed to remove profile PIN.');
            else setError('Failed to remove profile PIN.');
        }
    };

    const handleCancel = () => {
        setCurrentPin('');
        setError(null);
        navigate('/account/profile/pin');
    };

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/profile/pin" label="Profile PIN" />

            <form onSubmit={handleSubmit}>
                <Section label="Remove PIN" desc="Stop requiring a PIN for this profile">
                    <div className="flex items-center gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                            <ShieldOff size={15} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-400">Remove Profile PIN</p>
                            <p className="text-xs text-white/40 mt-0.5">Enter the current PIN to remove it</p>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-white/35 px-1">Current PIN</label>
                            <input
                                value={currentPin}
                                onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                                type="password"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="••••"
                                maxLength={4}
                                disabled={isRemovingPin}
                                className="outline-0 text-sm px-1 py-1.5 disabled:opacity-55"
                                autoFocus
                            />
                            {error && <p className="text-xs text-red-400 px-1">{error}</p>}
                        </div>
                    </div>
                </Section>

                <div className="px-5 py-4 my-2 flex items-center justify-end gap-3">
                    <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-3xl text-sm text-text/75 cursor-pointer">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isRemovingPin}
                        className={`px-6 py-2 rounded-3xl text-sm text-white font-medium ${
                            !isRemovingPin ? 'cursor-pointer bg-red-500/90 hover:bg-red-500' : 'bg-red-500/60'
                        }`}
                    >
                        {isRemovingPin ? 'Removing...' : 'Remove'}
                    </button>
                </div>
            </form>
        </div>
    );
}
