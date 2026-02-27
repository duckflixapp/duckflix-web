import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/nav/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { AdminRoute, ContributorRoute, ProtectedRoute } from './components/ProtectedRoute';
import BrowsePage from './pages/BrowsePage';
import Sidebar from './components/sidebar/Sidebar';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import DetailsPage from './pages/DetailsPage';
import WatchPage from './pages/WatchPage';
import NotFoundPage from './pages/NotFoundPage';
import LibraryPage from './pages/LibraryPage';
import { Toaster } from 'sonner';
import { AuthProvider } from './providers/AuthProvider';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmail';
import AdminPage from './pages/admin/AdminPage';
import UsersPage from './pages/admin/RolesPage';
import { useState } from 'react';

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
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/watch/:id" element={<WatchPage />} />

                        <Route element={<Layout />}>
                            <Route index path="/browse" element={<BrowsePage />} />
                            <Route path="/library" element={<LibraryPage />} />
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/details/:id" element={<DetailsPage />} />

                            {/* Contributor Only */}
                            <Route element={<ContributorRoute />}>
                                <Route path="/upload" element={<UploadPage />} />
                            </Route>

                            {/* Auto-redirects */}
                            {['details', 'watch'].map((path) => (
                                <Route key={path} path={path} element={<Navigate to="/browse" replace />} />
                            ))}
                        </Route>

                        <Route path="/admin" element={<AdminRoute />}>
                            <Route element={<Layout admin={true} />}>
                                <Route index element={<AdminPage />} />
                                <Route path="roles" element={<UsersPage />} />
                            </Route>
                        </Route>

                        <Route path="/account"></Route>
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

const Layout = ({ admin }: { admin?: boolean }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className="relative flex h-screen w-full bg-background text-text font-sans overflow-hidden">
            <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <Sidebar admin={admin} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div
                className={`
                    relative flex-1 flex flex-col min-w-0 overflow-hidden 
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'pl-20' : 'pl-56 lg:pl-64'}
                `}
            >
                <Navbar />
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
