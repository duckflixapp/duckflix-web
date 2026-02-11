import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="absolute left-0 top-0 flex flex-col items-center justify-center w-screen h-screen">
                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />

                    <Loader2 className="animate-spin text-primary z-10" size={64} strokeWidth={1} />
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    return <>{children}</>;
};
