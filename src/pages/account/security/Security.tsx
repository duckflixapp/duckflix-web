import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useAccountSessions, useAccountTwoFa } from '../../../hooks/useAccount';
import { ROUTES } from '../../../config/routes';
import { ButtonRow, Header, Section } from '../Components';
import { CircleQuestionMark, Monitor, RectangleEllipsis, ScanQrCode, Shield, Smartphone, Tablet } from 'lucide-react';
import { capitalize } from '../../../utils/string';
import type { AccountSessionDTO } from '@duckflixapp/shared';

export default function SecurityPage() {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const { sessions, isLoading: isSessionsLoading } = useAccountSessions();
    const { twoFA } = useAccountTwoFa();

    if (!auth?.account) return null;

    const handleTwoStepV = () => navigate(ROUTES.routeOf('account.security.twosv'));
    const handleChangePassword = () => navigate(ROUTES.routeOf('account.security.password'));
    const handleAuthenticator = () => navigate(ROUTES.routeOf('account.security.authenticator'));
    const handleDeviceClick = () => navigate(ROUTES.routeOf('account.security.devices'));

    const types = [...new Set(sessions?.map((s) => s.deviceType))];
    const groupedSessions = types
        .filter((t) => !!t)
        .map((type) => {
            const devices = sessions?.filter((s) => s.deviceType === type) ?? [];
            const names =
                devices
                    .slice(0, 3)
                    .map((d) => d.deviceName)
                    .join(', ') + (devices.length > 3 ? '...' : '');
            return { type, total: devices?.length, names };
        });

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <Header title="Privacy & Security" />
            <Section label="Security" desc="Manage ways to sign-in and protect your account">
                <ButtonRow
                    onClick={handleTwoStepV}
                    icon={Shield}
                    label="2-Step Verification"
                    value={twoFA?.enabled ? 'Enabled' : 'Disabled'}
                    type="info"
                />
                <ButtonRow
                    onClick={handleChangePassword}
                    icon={RectangleEllipsis}
                    label="Password"
                    value="Change your password"
                    type="info"
                />
                <ButtonRow
                    onClick={handleAuthenticator}
                    icon={ScanQrCode}
                    label="Authenticator"
                    value={twoFA?.methods.authenticator.enabled ? 'Enabled' : 'Setup authenticator to protect your account'}
                    type="info"
                    last
                />
            </Section>
            <Section label="Sessions" desc="Keep track on devices where you’re signed in" loading={isSessionsLoading}>
                {groupedSessions?.map((group) => (
                    <ButtonRow
                        key={group.type}
                        onClick={handleDeviceClick}
                        icon={getIconForType(group.type)}
                        label={`${group.total} sessions on ${capitalize(group.type)}`}
                        value={group.names}
                        type="info"
                    />
                ))}
            </Section>
        </div>
    );
}

const getIconForType = (type: AccountSessionDTO['deviceType']) => {
    if (type === 'desktop') return Monitor;
    if (type === 'mobile') return Smartphone;
    if (type === 'tablet') return Tablet;
    return CircleQuestionMark;
};
