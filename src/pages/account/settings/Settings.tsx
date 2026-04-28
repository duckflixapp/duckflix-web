import { Trash } from 'lucide-react';
import { useAuthContext } from '../../../contexts/AuthContext';
import { ButtonRow, Header, Section } from '../Components';

export default function AccountSettingsPage() {
    const auth = useAuthContext();

    if (!auth?.user) return null;

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <Header title="Account & Settings" />
            <Section label="Account">
                <ButtonRow icon={Trash} label="Delete account" value="Delete your account data permanently" type="danger" last />
            </Section>
        </div>
    );
}
