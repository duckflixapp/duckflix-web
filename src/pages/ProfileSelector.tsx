import { useNavigate } from 'react-router-dom';
import { useProfile, useProfiles } from '../hooks/useProfile';
import { useEffect, type ButtonHTMLAttributes } from 'react';
import type { ProfileDTO } from '@duckflixapp/shared';

export default function ProfileSelectorPage() {
    const { profile, isLoading: isLoadingProfile, selectProfile } = useProfile();
    const { profiles, isLoading } = useProfiles();
    const navigate = useNavigate();

    useEffect(() => {
        if (!!profile && !isLoadingProfile) {
            navigate('/browse', { replace: true });
        }
    }, [profile, navigate]);

    const handleSelect = (profile: ProfileDTO) => {
        selectProfile(profile.id);
    };

    return (
        <div className="relative w-screen min-h-screen bg-background text-text">
            <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-full h-full pt-[22vh] flex items-center justify-center">
                <ProfileSelector profiles={profiles} loading={isLoading} onSelect={handleSelect} />
            </div>
        </div>
    );
}

function ProfileSelector({
    profiles,
    loading,
    onSelect,
}: {
    profiles: ProfileDTO[];
    loading: boolean;
    onSelect: (profile: ProfileDTO) => unknown;
}) {
    if (loading) return <p>loading</p>;
    return (
        <div className="flex flex-col items-center gap-8">
            <h1 className="text-3xl text-center">Who's watching?</h1>
            <div className="flex flex-wrap gap-6 items-center justify-center p-4">
                {profiles.map((profile) => (
                    <ProfileBox profile={profile} key={profile.id} onClick={() => onSelect(profile)} />
                ))}
            </div>
        </div>
    );
}

function ProfileBox({ profile, className, ...props }: { profile: ProfileDTO } & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <div className="flex flex-col gap-3 items-center">
            <button
                {...props}
                className={`bg-secondary/10 rounded-2xl w-32 h-32 overflow-clip cursor-pointer transition-all hover:scale-105 ${className}`}
            >
                {profile.avatar.url && <img src={profile.avatar.url} alt="Profile picture" />}
            </button>
            <span>{profile.name}</span>
        </div>
    );
}
