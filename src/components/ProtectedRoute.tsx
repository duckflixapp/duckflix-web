import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
    const auth = useAuthContext();
    const location = useLocation();

    if (!auth || auth.isLoading) return <Loading />;

    if (!auth.user) return <Navigate to="/login" state={{ from: location }} replace />;

    if (!auth.isVerified && location.pathname !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }

    return <Outlet />;
};

export const ContributorRoute = () => {
    const auth = useAuthContext()!;

    if (!auth.hasRole('contributor')) return <Navigate to="/browse" replace />;

    return <Outlet />;
};

const Loading = () => (
    <div className="absolute left-0 top-0 flex flex-col items-center justify-center w-screen h-screen">
        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />

            <Loader2 className="animate-spin text-primary z-10" size={64} strokeWidth={1} />
        </div>
    </div>
);
