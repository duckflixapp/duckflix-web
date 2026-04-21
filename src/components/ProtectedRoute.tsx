import { Navigate, Outlet, useLocation } from 'react-router-dom';
import FullscreenLoader from './FullscreenLoader';
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

export const AdminRoute = () => {
    const auth = useAuthContext()!;

    if (!auth.hasRole('admin')) return <Navigate to="/browse" replace />;

    return <Outlet />;
};

const Loading = () => <FullscreenLoader label="Loading your session" />;
