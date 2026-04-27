import { LogOut } from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { ButtonRow, Section } from '../Components';

export default function AccountSettingsPage() {
    const auth = useAuthContext();

    if (!auth?.user) return null;

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <Section label="Account">
                {/* {!auth.isVerified && (
                    <ButtonRow icon={AlertCircle} label="Verify your email" value="Unlock the full account experience" type="warn" />
                )} */}
                <ButtonRow
                    onClick={auth.logout}
                    icon={LogOut}
                    label="Sign out"
                    value="End the current session on this device"
                    type="danger"
                    last
                />
            </Section>
        </div>
    );
}
