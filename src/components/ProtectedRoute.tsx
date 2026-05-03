import { Navigate, Outlet, useLocation } from 'react-router-dom';
import FullscreenLoader from './FullscreenLoader';
import { useAuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../config/routes';

export const ProtectedRoute = () => {
    const auth = useAuthContext();
    const location = useLocation();

    if (!auth) return <Loading />;

    if (auth.isLoggedOut) return <Navigate to={ROUTES.routeOf('login')} replace />;

    if (auth.isLoading) return <Loading />;

    if (!auth.account) return <Navigate to={ROUTES.routeOf('login')} state={{ from: location }} replace />;

    if (!auth.isVerified && location.pathname !== ROUTES.routeOf('verify-email')) {
        return <Navigate to={ROUTES.routeOf('verify-email')} replace />;
    }

    if (!auth.hasSelectedProfile && location.pathname !== ROUTES.routeOf('select-profile'))
        return <Navigate to={ROUTES.routeOf('select-profile')} replace />;

    return <Outlet />;
};

export const ContributorRoute = () => {
    const auth = useAuthContext()!;

    if (!auth.hasRole('contributor')) return <Navigate to={ROUTES.routeOf('browse')} replace />;

    return <Outlet />;
};

export const AdminRoute = () => {
    const auth = useAuthContext()!;

    if (!auth.hasRole('admin')) return <Navigate to={ROUTES.routeOf('browse')} replace />;

    return <Outlet />;
};

const Loading = () => <FullscreenLoader label="Loading your session" />;
