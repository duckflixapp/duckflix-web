import { ChevronRight, CircleQuestionMark, Monitor, Phone, Tablet, type LucideIcon } from 'lucide-react';
import type { AccountSessionDTO, AccountSessionMinDTO } from '@duckflixapp/shared';
import { BackButton } from '../../../components/buttons/BackButton';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useAccountSessions } from '../../../hooks/useAccount';
import { capitalize } from '../../../utils/string';
import { Section } from '../Components';
import { useNavigate } from 'react-router-dom';

export default function DevicesPage() {
    const auth = useAuthContext();
    const { sessions, isLoading } = useAccountSessions();

    if (!auth?.account) return null;

    const devices = sessions ?? [];

    return (
        <div className="max-w-6xl w-full mx-auto px-10 py-6 md:px-16 md:py-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/security" label="Security" />

            <Section
                label="Your Devices"
                desc="Device which session is active and not expired. There might be multiple activity sessions from the same device."
                loading={isLoading}
            >
                {devices.length > 0 ? (
                    devices.map((device) => <DeviceRow key={device.id} device={device} />)
                ) : (
                    <div className="flex items-center gap-4 px-5 py-5">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <Monitor size={16} className="text-white/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/85">No active devices</p>
                            <p className="text-xs text-white/40 mt-0.5">Your active sessions will appear here.</p>
                        </div>
                    </div>
                )}
            </Section>
        </div>
    );
}

function DeviceRow({ device }: { device: AccountSessionMinDTO }) {
    const navigate = useNavigate();
    const Icon = getIconForType(device.deviceType);
    const deviceName = device.deviceName || getFallbackName(device.deviceType);
    const details = getDeviceDetails(device);

    const handleClick = () => navigate('/account/security/devices/' + device.id);

    return (
        <button
            onClick={handleClick}
            type="button"
            className={`group w-full flex items-center gap-4 px-5 py-4 hover:bg-white/4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 `}
        >
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-text/50 group-hover:text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-white/85 truncate">{deviceName}</p>
                    {device.current && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Current
                        </span>
                    )}
                </div>
                <p className="text-xs text-white/40 mt-0.5 truncate">{details}</p>
            </div>
            <ChevronRight size={16} className={`text-white/25 transition-colors shrink-0 group-hover:text-primary`} />
        </button>
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

const getDeviceDetails = (device: AccountSessionMinDTO) => {
    const platform = [device.browserName, device.osName].filter(Boolean).join(' - ');
    const type = device.deviceType ? capitalize(device.deviceType) : 'Unknown type';

    return [platform || type, device.lastRefreshedAt ? formatSessionDate(device.lastRefreshedAt) : null].filter(Boolean).join(' - ');
};

const formatSessionDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
