import type { UserDTO, UserRole } from '@duckflix/shared';
import { createContext, useContext } from 'react';

export interface AuthContextType {
    user: UserDTO | null;
    isLoading: boolean;
    logout: () => void;
    hasRole: (role: UserRole | null) => boolean;
    isVerified: boolean;
}
export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
