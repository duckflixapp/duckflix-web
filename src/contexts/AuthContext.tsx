import type { AccountDTO, ProfileDTO, UserRole } from '@duckflixapp/shared';
import { createContext, useContext } from 'react';

export interface AuthContextType {
    account: AccountDTO | null;
    isLoading: boolean;
    logout: () => void;
    hasRole: (role: UserRole | null) => boolean;
    isVerified: boolean;
    isStepupActive: boolean;
    hasStepUp: () => boolean;
    applyStepUp: (token: string, expires: number) => unknown;
    clearStepUp: () => unknown;
    hasSelectedProfile: boolean;
    profile: ProfileDTO | null;
}
export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
