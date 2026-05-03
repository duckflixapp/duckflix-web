import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldOff } from 'lucide-react';
import { BackButton } from '../../../components/buttons/BackButton';
import { useAuthContext } from '../../../contexts/AuthContext';
import { ROUTES } from '../../../config/routes';
import { ButtonRow, Section } from '../Components';

export default function ProfilePinPage() {
    const auth = useAuthContext();
    const navigate = useNavigate();

    if (!auth?.account) return null;

    const hasPin = auth.profile?.hasPin ?? false;

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/profile" label="Profile" />

            <Section label="Profile PIN" desc="Manage the 4-digit PIN for this profile">
                <ButtonRow
                    icon={KeyRound}
                    label={hasPin ? 'Change PIN' : 'Set PIN'}
                    value={hasPin ? 'Update the current profile PIN' : 'Protect this profile with a PIN'}
                    type="info"
                    onClick={() => navigate(ROUTES.routeOf('account.profile-pin-change'))}
                    last={!hasPin}
                />
                {hasPin && (
                    <ButtonRow
                        icon={ShieldOff}
                        label="Remove PIN"
                        value="Stop requiring a PIN for this profile"
                        type="danger"
                        onClick={() => navigate(ROUTES.routeOf('account.profile-pin-remove'))}
                        last
                    />
                )}
            </Section>
        </div>
    );
}
