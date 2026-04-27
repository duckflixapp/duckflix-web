import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useAccount } from '../../../hooks/use-account';
import { ROUTES } from '../../../config/routes';
import { ButtonRow, Section } from '../Components';
import { RectangleEllipsis, ScanQrCode, Shield } from 'lucide-react';

export default function SecurityPage() {
    const auth = useAuthContext();
    const navigate = useNavigate();
    const account = useAccount();

    if (!auth?.user) return null;

    const handleTwoStepV = () => navigate(ROUTES.routeOf('account.security.twosv'));
    const handleChangePassword = () => navigate(ROUTES.routeOf('account.security.password'));
    const handleAuthenticator = () => navigate(ROUTES.routeOf('account.security.authenticator'));

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <Section label="Security">
                <ButtonRow
                    onClick={handleTwoStepV}
                    icon={Shield}
                    label="2-Step Verification"
                    value={account.twoFA?.enabled ? 'Enabled' : 'Disabled'}
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
                    value={account.twoFA?.methods.authenticator.enabled ? 'Enabled' : 'Setup authenticator to protect your account'}
                    type="info"
                    last
                />
            </Section>
        </div>
    );
}
