import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/nav/Navbar';
import FullscreenLoader from './components/FullscreenLoader';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { AdminRoute, ContributorRoute, ProtectedRoute } from './components/ProtectedRoute';
import BrowsePage from './pages/BrowsePage';
import Sidebar from './components/sidebar/Sidebar';
import SearchPage from './pages/SearchPage';
import MovieDetailsPage from './pages/details/MovieDetailsPage';
import DetailsResolver from './pages/details/DetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import LibraryPage from './pages/LibraryPage';
import { Toaster } from 'sonner';
import { AuthProvider } from './providers/AuthProvider';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmail';
import { useLocalStorage } from './hooks/useLocalStorage';
import SeriesDetailsPage from './pages/details/SeriesDetailsPage';
import SeriesSeasonDetailsPage from './pages/details/SeriesSeasonDetailsPage';
import EpisodeDetailsPage from './pages/details/EpisodeDetailsPage';
import { lazy, Suspense } from 'react';
import BottomNav from './components/nav/BottomNav';

const UploadPage = lazy(() => import('./pages/UploadPage'));
const WatchPage = lazy(() => import('./pages/WatchPage'));
const AdminOverviewPage = lazy(() => import('./pages/admin/OverviewPage'));
const AdminSystemPage = lazy(() => import('./pages/admin/SystemPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AccountSettingsPage = lazy(() => import('./pages/account/SettingsPage'));

function App() {
    return (
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
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />

                        <Route element={<ProtectedRoute />}>
                            <Route
                                path="/watch/:id"
                                element={
                                    <Suspense fallback={<FullscreenLoader label="Loading player" />}>
                                        <WatchPage />
                                    </Suspense>
                                }
                            />

                            <Route element={<Layout />}>
                                <Route index path="/browse" element={<BrowsePage />} />
                                <Route path="/library" element={<LibraryPage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/details/:id" element={<DetailsResolver />} />
                                <Route path="/details/movie/:id" element={<MovieDetailsPage />} />
                                <Route path="/details/series/:id" element={<SeriesDetailsPage />} />
                                <Route path="/details/season/:id" element={<SeriesSeasonDetailsPage />} />
                                <Route path="/details/episode/:id" element={<EpisodeDetailsPage />} />
                                <Route path="/account" element={<Navigate to="/account/settings" replace />} />
                                <Route
                                    path="/account/settings"
                                    element={
                                        <Suspense fallback={<FullscreenLoader label="Loading account settings" />}>
                                            <AccountSettingsPage />
                                        </Suspense>
                                    }
                                />

                                {/* Contributor Only */}
                                <Route element={<ContributorRoute />}>
                                    <Route
                                        path="/upload"
                                        element={
                                            <Suspense fallback={<FullscreenLoader label="Loading upload tools" />}>
                                                <UploadPage />
                                            </Suspense>
                                        }
                                    />
                                </Route>

                                {/* Auto-redirects */}
                                {['details', 'watch'].map((path) => (
                                    <Route key={path} path={path} element={<Navigate to="/browse" replace />} />
                                ))}
                            </Route>

                            <Route path="/admin" element={<AdminRoute />}>
                                <Route element={<Layout admin={true} />}>
                                    <Route
                                        index
                                        element={
                                            <Suspense fallback={<FullscreenLoader label="Loading admin overview" />}>
                                                <AdminOverviewPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path="system"
                                        element={
                                            <Suspense fallback={<FullscreenLoader label="Loading system settings" />}>
                                                <AdminSystemPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path="roles"
                                        element={
                                            <Suspense fallback={<FullscreenLoader label="Loading role manager" />}>
                                                <AdminUsersPage />
                                            </Suspense>
                                        }
                                    />
                                </Route>
                            </Route>
                        </Route>

                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

const Layout = ({ admin }: { admin?: boolean }) => {
    const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>('sidebar-collapsed', false);

    return (
        <div className="relative flex h-screen w-full bg-background text-text font-sans overflow-hidden">
            <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="hidden sm:block">
                <Sidebar admin={admin} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            </div>
            <div
                className={`
                    relative flex-1 flex flex-col min-w-0 overflow-hidden 
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'sm:pl-20' : 'sm:pl-56 lg:pl-64'}
                `}
            >
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pb-16 sm:pb-0">
                    <Outlet />
                </main>

                <BottomNav />
            </div>
        </div>
    );
};
