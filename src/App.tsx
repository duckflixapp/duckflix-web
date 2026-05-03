import { Routes, Route, Outlet } from 'react-router-dom';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { SuspenseRoute } from './components/SuspenseRoute';
import { StepUpRoute } from './components/StepUpRoute';
import { ROUTES } from './config/routes';
import type { RouteNode } from './lib/routes';

function renderRoutes(node: RouteNode): React.ReactNode {
    const { element: Element, guard, scope, suspenseLabel, children } = node.config ?? {};

    const wrapped = Element ? (
        <SuspenseRoute label={suspenseLabel ?? 'Loading...'}>
            <Element />
        </SuspenseRoute>
    ) : (
        <Outlet />
    );

    const guarded =
        guard === 'protected' ? (
            <ProtectedRoute />
        ) : guard === 'admin' ? (
            <AdminRoute />
        ) : guard === 'stepup' ? (
            <StepUpRoute onCancelReturnTo={node.parent ? node.parent.path : undefined} scope={scope ?? 'sensitive:write'} />
        ) : (
            wrapped
        );

    return (
        <Route key={node.name} path={node.index} element={guarded}>
            {children?.map(renderRoutes)}
        </Route>
    );
}

export default function App() {
    return <Routes>{ROUTES.config?.children?.map(renderRoutes)}</Routes>;
}
