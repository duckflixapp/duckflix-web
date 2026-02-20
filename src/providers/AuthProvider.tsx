import type { ReactNode } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useAuth } from '../hooks/use-auth';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const auth = useAuth();

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
