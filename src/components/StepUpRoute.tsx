import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { ROUTES } from '../config/routes';

interface StepUpRouteProps {
    scope: string;
}

export const StepUpRoute = ({ scope }: StepUpRouteProps) => {
    const { hasStepUp } = useAuth();
    const location = useLocation();

    if (!hasStepUp()) {
        return <Navigate to={ROUTES.routeOf('account.stepup')} state={{ scope, returnTo: location.pathname }} replace />;
    }

    return <Outlet />;
};
