import { useNavigate } from 'react-router-dom';
import { useCreateProfile, useProfile, useProfileAvatars, useProfiles, type ProfileAvatarDTO } from '../hooks/useProfile';
import { useEffect, useState, type ButtonHTMLAttributes, type SubmitEvent } from 'react';
import type { ProfileDTO } from '@duckflixapp/shared';
import { Check, Loader2, LockKeyhole, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuthContext } from '../contexts/AuthContext';

export default function ProfileSelectorPage() {
    const auth = useAuthContext();
    const { profile, isLoading: isLoadingProfile, selectProfileAsync, isSelectingProfile } = useProfile();
    const { profiles, isLoading } = useProfiles();
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [pinProfile, setPinProfile] = useState<ProfileDTO | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!!profile && !isLoadingProfile) {
            navigate('/browse', { replace: true });
        }
    }, [profile, isLoadingProfile, navigate]);

    const handleSelect = async (profile: ProfileDTO) => {
        if (profile.hasPin) {
            setPinProfile(profile);
            return;
        }

        await selectProfileAsync({ profileId: profile.id });
    };

    const handlePinSubmit = (pin: string) => selectProfileAsync({ profileId: pinProfile!.id, pin });

    return (
        <div className="relative w-screen min-h-screen bg-background text-text">
            <button
                type="button"
                onClick={() => auth?.logout()}
                className="absolute right-5 top-5 z-10 flex cursor-pointer items-center gap-2 rounded-3xl border border-white/10 bg-secondary/10 px-4 py-2 text-sm font-medium text-text/75 transition-colors hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-400/60"
            >
                <LogOut size={16} />
                Logout
            </button>
            <div className="w-full min-h-screen px-5 py-16 flex items-center justify-center">
                {pinProfile ? (
                    <ProfilePinPrompt
                        profile={pinProfile}
                        isSubmitting={isSelectingProfile}
                        onCancel={() => setPinProfile(null)}
                        onSubmit={handlePinSubmit}
                    />
                ) : (profiles.length === 0 && !isLoading) || isCreatingProfile ? (
                    <CreateProfileFlow onCancel={profiles.length > 0 ? () => setIsCreatingProfile(false) : undefined} />
                ) : (
                    <ProfileSelector
                        profiles={profiles}
                        loading={isLoading || isLoadingProfile}
                        onSelect={handleSelect}
                        onAddProfile={() => setIsCreatingProfile(true)}
                    />
                )}
            </div>
        </div>
    );
}

function ProfileSelector({
    profiles,
    loading,
    onSelect,
    onAddProfile,
}: {
    profiles: ProfileDTO[];
    loading: boolean;
    onSelect: (profile: ProfileDTO) => unknown;
    onAddProfile: () => unknown;
}) {
    if (loading)
        return (
            <div className="flex items-center gap-3 text-text/60">
                <Loader2 className="animate-spin text-primary" size={22} />
                <span>Loading profiles</span>
            </div>
        );

    return (
        <div className="flex flex-col items-center gap-8">
            <h1 className="text-3xl text-center">Who is watching?</h1>
            <div className="flex flex-wrap gap-6 items-center justify-center p-4">
                {profiles.map((profile) => (
                    <ProfileBox profile={profile} key={profile.id} onClick={() => onSelect(profile)} />
                ))}
                {profiles.length < 10 && <AddProfileBox onClick={onAddProfile} />}
            </div>
        </div>
    );
}

function ProfileBox({ profile, className, ...props }: { profile: ProfileDTO } & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <div className="flex flex-col gap-3 items-center">
            <button
                {...props}
                className={`relative bg-secondary/10 rounded-2xl w-32 h-32 overflow-clip cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/70 shadow-lg ${className}`}
            >
                {profile.avatar.url && <img src={profile.avatar.url} alt="Profile picture" className="h-full w-full object-cover" />}
                {profile.hasPin && (
                    <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-primary backdrop-blur">
                        <LockKeyhole size={15} />
                    </span>
                )}
            </button>
            <span>{profile.name}</span>
        </div>
    );
}

function AddProfileBox({ onClick }: { onClick: () => unknown }) {
    return (
        <div className="flex flex-col gap-3 items-center">
            <button
                type="button"
                onClick={onClick}
                className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-secondary/10 text-text transition-all hover:scale-105 hover:border-primary/60 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/70"
            >
                <Plus size={34} />
            </button>
            <span>New profile</span>
        </div>
    );
}

function CreateProfileFlow({ onCancel }: { onCancel?: () => unknown }) {
    const navigate = useNavigate();
    const [step, setStep] = useState<'name' | 'avatar'>('name');
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { avatars, isLoading } = useProfileAvatars(step === 'avatar');
    const { createProfileAsync, isCreating } = useCreateProfile();

    const profileName = name.trim();

    const submitName = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (profileName.length < 2) {
            setError('Profile name must be at least 2 characters.');
            return;
        }

        if (profileName.length > 32) {
            setError('Profile name must be less than 33 characters.');
            return;
        }

        if (pin.length > 0 && !/^\d{4}$/.test(pin)) {
            setError('Profile PIN must be exactly 4 digits.');
            return;
        }

        setStep('avatar');
    };

    const createProfile = async () => {
        setError(null);

        if (avatars.length > 0 && !selectedAvatarId) {
            setError('Choose an avatar first.');
            return;
        }

        try {
            await createProfileAsync({ name: profileName, avatarAssetId: selectedAvatarId, pin: pin || undefined });
            toast.success('Profile created');
            navigate('/browse', { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Failed to create profile.');
            else setError('Failed to create profile.');
        }
    };

    return (
        <div className="w-full max-w-3xl">
            {step === 'name' ? (
                <form onSubmit={submitName} className="mx-auto flex max-w-md flex-col gap-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-semibold tracking-tight">Create your profile</h1>
                        <p className="mt-2 text-sm text-text/55">This is the profile you will use for watching.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="ml-1 text-xs font-medium text-text/75">Profile name</label>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            type="text"
                            placeholder="Family"
                            maxLength={32}
                            className="w-full rounded-3xl border border-white/10 bg-secondary/10 px-5 py-3 text-sm text-text outline-none transition-all focus:ring-2 ring-primary/50"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="ml-1 text-xs font-medium text-text/75">Profile PIN</label>
                        <input
                            value={pin}
                            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="Optional 4-digit PIN"
                            maxLength={4}
                            className="w-full rounded-3xl border border-white/10 bg-secondary/10 px-5 py-3 text-sm text-text outline-none transition-all focus:ring-2 ring-primary/50"
                        />
                    </div>

                    {error && <p className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex flex-1 cursor-pointer items-center justify-center rounded-3xl border border-white/10 bg-secondary/10 py-3 text-sm font-semibold text-text transition-colors hover:bg-secondary/15"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex flex-1 cursor-pointer items-center justify-center rounded-3xl bg-primary py-3 text-sm font-semibold text-background transition-all hover:bg-primary/90 active:scale-[0.98]"
                        >
                            Continue
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col items-center gap-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-semibold tracking-tight">Choose an avatar</h1>
                        <p className="mt-2 text-sm text-text/55">{profileName}</p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-3 text-text/60">
                            <Loader2 className="animate-spin text-primary" size={22} />
                            <span>Loading avatars</span>
                        </div>
                    ) : (
                        <AvatarGrid avatars={avatars} selectedAvatarId={selectedAvatarId} onSelect={setSelectedAvatarId} />
                    )}

                    {error && (
                        <p className="max-w-md rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="flex w-full max-w-md flex-col-reverse gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setStep('name');
                            }}
                            disabled={isCreating}
                            className="flex flex-1 cursor-pointer items-center justify-center rounded-3xl border border-white/10 bg-secondary/10 py-3 text-sm font-semibold text-text transition-colors hover:bg-secondary/15 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={createProfile}
                            disabled={isCreating || isLoading || (avatars.length > 0 && !selectedAvatarId)}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-3xl bg-primary py-3 text-sm font-semibold text-background transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Create profile'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfilePinPrompt({
    profile,
    isSubmitting,
    onCancel,
    onSubmit,
}: {
    profile: ProfileDTO;
    isSubmitting: boolean;
    onCancel: () => unknown;
    onSubmit: (pin: string) => Promise<unknown>;
}) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);

    const submitPin = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!/^\d{4}$/.test(pin)) {
            setError('Enter the 4-digit PIN.');
            return;
        }

        try {
            await onSubmit(pin);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Invalid profile PIN.');
            else setError('Invalid profile PIN.');
        }
    };

    return (
        <form onSubmit={submitPin} className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
                <div className="h-28 w-28 overflow-hidden rounded-2xl bg-secondary/10 shadow-lg">
                    {profile.avatar.url && <img src={profile.avatar.url} alt="Profile picture" className="h-full w-full object-cover" />}
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
                    <p className="mt-1 text-sm text-text/55">Enter profile PIN</p>
                </div>
            </div>

            <input
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="PIN"
                maxLength={4}
                className="w-full rounded-3xl border border-white/10 bg-secondary/10 px-5 py-3 text-center font-mono text-lg tracking-[0.35em] text-text outline-none transition-all focus:ring-2 ring-primary/50"
                autoFocus
            />

            {error && <p className="w-full rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex flex-1 cursor-pointer items-center justify-center rounded-3xl border border-white/10 bg-secondary/10 py-3 text-sm font-semibold text-text transition-colors hover:bg-secondary/15 disabled:cursor-not-allowed disabled:opacity-55"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-3xl bg-primary py-3 text-sm font-semibold text-background transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Unlock'}
                </button>
            </div>
        </form>
    );
}

function AvatarGrid({
    avatars,
    selectedAvatarId,
    onSelect,
}: {
    avatars: ProfileAvatarDTO[];
    selectedAvatarId: string | null;
    onSelect: (avatarId: string | null) => void;
}) {
    if (avatars.length === 0) return <p className="text-sm text-text/55">No avatars available.</p>;

    return (
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {avatars.map((avatar, index) => {
                const isSelected = avatar.id === selectedAvatarId;

                return (
                    <button
                        key={avatar.id ?? avatar.url ?? `avatar-${index}`}
                        type="button"
                        disabled={!avatar.id}
                        onClick={() => onSelect(avatar.id)}
                        className={`relative aspect-square overflow-hidden rounded-2xl border bg-secondary/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isSelected ? 'border-primary scale-[1.03]' : 'border-white/8 hover:border-white/25 hover:scale-[1.02]'
                        }`}
                    >
                        {avatar.url && <img src={avatar.url} alt="Profile avatar" className="h-full w-full object-cover" />}
                        {isSelected && (
                            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-background">
                                <Check size={17} />
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
