import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './nav/Navbar';
import BottomNav from './nav/BottomNav';

export const Layout = ({ type }: { type?: 'admin' | 'account' | 'default' }) => {
    const location = useLocation();
    const hasMediaUnderNavbar = location.pathname.startsWith('/browse') || location.pathname.startsWith('/details');

    return (
        <div className="relative flex h-screen w-full bg-background text-text font-sans overflow-hidden">
            <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar type={type} />
                <main
                    className={`flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pb-16 sm:pb-0 ${
                        hasMediaUnderNavbar ? '' : 'pt-18 sm:pt-24'
                    }`}
                >
                    <Outlet />
                </main>

                <BottomNav />
            </div>
        </div>
    );
};
