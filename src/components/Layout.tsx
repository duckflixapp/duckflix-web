import { Outlet } from 'react-router-dom';
import Navbar from './nav/Navbar';
import Sidebar from './sidebar/Sidebar';
import BottomNav from './nav/BottomNav';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const Layout = ({ type }: { type?: 'admin' | 'account' | 'default' }) => {
    const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>('sidebar-collapsed', false);

    return (
        <div className="relative flex h-screen w-full bg-background text-text font-sans overflow-hidden">
            <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[5%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="hidden sm:block">
                <Sidebar type={type} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
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
