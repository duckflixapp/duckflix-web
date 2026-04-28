import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleQuestionMark, LogOut, Monitor, Phone, Tablet, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AccountSessionDTO } from '@duckflixapp/shared';
import { BackButton } from '../../../components/buttons/BackButton';
import FullscreenLoader from '../../../components/FullscreenLoader';
import { api } from '../../../lib/api';
import { capitalize } from '../../../utils/string';
import { Section } from '../Components';
import { ROUTES } from '../../../config/routes';
import { useAuth } from '../../../hooks/use-auth';
import { AxiosError } from 'axios';

export default function DevicePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { clearStepUp } = useAuth();

    const [loggingOut, setLoggingOut] = useState(false);

    const query = useQuery({
        queryKey: ['account', 'sessions', id],
        queryFn: async () => {
            const { session } = await api.get<{ session: AccountSessionDTO }>('/account/sessions/' + id);
            return session;
        },
        retry: false,
    });

    if (query.isLoading) return <FullscreenLoader label="Loading device" />;

    const device = query.data;

    if (!device) {
        return (
            <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
                <BackButton to={ROUTES.routeOf('account.security.devices')} label="Devices" />
                <Section label="Device" desc="This session could not be found">
                    <div className="flex items-center gap-4 px-5 py-5">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <CircleQuestionMark size={16} className="text-white/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/85">Device not found</p>
                            <p className="text-xs text-white/40 mt-0.5">It may have already been logged out or expired.</p>
                        </div>
                    </div>
                </Section>
            </div>
        );
    }

    const Icon = getIconForType(device.deviceType);
    const deviceName = device.deviceName || getFallbackName(device.deviceType);

    const handleLogout = async () => {
        if (device.current || loggingOut) return;

        const returnTo = window.location.pathname;

        setLoggingOut(true);
        try {
            await api.delete(`/account/sessions/${device.id}`);
            await queryClient.invalidateQueries({ queryKey: ['account', 'sessions'] });
            toast.success('Device logged out');
            navigate(ROUTES.routeOf('account.security.devices'), { replace: true });
        } catch (e) {
            if (e instanceof AxiosError && e.response?.status === 403) {
                clearStepUp();
                toast('Verification expired', { description: 'Please verify again.' });
                navigate('/account/stepup', {
                    state: { scope: 'sensitive:write', returnTo },
                    replace: true,
                });
            }
            toast.error('Failed to log out device', {
                description: 'Please try again in a moment.',
            });
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <BackButton to={ROUTES.routeOf('account.security.devices')} label="Devices" />

            <Section label="Device" desc="Review this active session and where it is being used">
                <div className="flex justify-between items-end px-5 py-5 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-secondary/5 flex items-center justify-center shrink-0">
                            <Icon size={36} className="text-text" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <p className="text-base font-semibold text-white/90 truncate">{deviceName}</p>
                                {device.current && (
                                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                        Current
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-text/40 truncate">{formatDeviceType(device.deviceType)}</p>
                            <p className="text-xs text-text/40 truncate">{formatValue(device.browserName)}</p>
                            <p className="text-xs text-text/40 truncate">{formatValue(device.osName)}</p>
                        </div>
                    </div>
                    {!device.current && (
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center justify-center gap-2 rounded-3xl border border-red-500/20 bg-red-500/8 px-5 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/12 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                            <LogOut size={14} />
                            {loggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    )}
                </div>
                <div className="flex flex-col px-5 py-5 gap-6">
                    {device.lastRefreshedAt && (
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-text/85 mb-1 uppercase tracking-widest">Last Activity</p>
                            <p className="text-xs text-text/40 truncate">{formatValue(device.lastIpAddress)}</p>
                            <p className="text-xs text-text/40 truncate">{formatDateTime(device.lastRefreshedAt)}</p>
                        </div>
                    )}
                    {device.createdAt && (
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-text/85 mb-1 uppercase tracking-widest">Login</p>
                            <p className="text-xs text-text/40 truncate">{formatValue(device.ipAddress)}</p>
                            <p className="text-xs text-text/40 truncate">{formatDateTime(device.createdAt)}</p>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
}

const getIconForType = (type: AccountSessionDTO['deviceType']): LucideIcon => {
    if (type === 'desktop') return Monitor;
    if (type === 'mobile') return Phone;
    if (type === 'tablet') return Tablet;
    return CircleQuestionMark;
};

const getFallbackName = (type: AccountSessionDTO['deviceType']) => {
    if (!type) return 'Unknown device';
    return `${capitalize(type)} device`;
};

const formatDeviceType = (type: AccountSessionDTO['deviceType']) => {
    if (!type) return 'Unknown';
    return capitalize(type);
};

const formatValue = (value: string | null) => value || 'Unknown';

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
