import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './providers/AuthProvider.tsx';
import { BrowserRouter } from 'react-router-dom';
import FullscreenLoader from './components/FullscreenLoader.tsx';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <Toaster
                        theme="dark"
                        position="bottom-right"
                        expand={false}
                        richColors
                        toastOptions={{
                            style: {
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(23, 23, 23, 0.5) 100%)',
                                backdropFilter: 'blur(20px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '1.25rem',
                                color: '#fff',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                                padding: '12px 16px',
                            },
                        }}
                    />
                    <Suspense fallback={<FullscreenLoader />}>
                        <App />
                    </Suspense>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>
);
