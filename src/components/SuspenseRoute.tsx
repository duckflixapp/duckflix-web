import { Suspense, type ReactNode } from 'react';
import FullscreenLoader from './FullscreenLoader';

export const SuspenseRoute = ({ label, children }: { label: string; children: ReactNode }) => (
    <Suspense fallback={<FullscreenLoader label={label} />}>{children}</Suspense>
);
