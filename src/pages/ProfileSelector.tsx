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
        <div className="relative w-screen h-screen bg-background text-text">
            <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="w-full h-full flex items-center justify-center">
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
        <div className="flex flex-wrap gap-4 items-center">
            {profiles.map((profile) => (
                <ProfileBox profile={profile} key={profile.id} onClick={() => onSelect(profile)} />
            ))}
        </div>
    );
}

function ProfileBox({ profile, className, ...props }: { profile: ProfileDTO } & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...props} className={`bg-secondary/10 rounded-2xl w-16 h-16 ${className}`}>
            {profile.name}
        </button>
    );
}
