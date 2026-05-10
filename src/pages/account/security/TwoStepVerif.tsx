import { BadgeAlert, BadgeCheck, BookKey, ScanQrCode } from 'lucide-react';
import { BackButton } from '../../../components/buttons/BackButton';
import { useAccountTwoFa } from '../../../hooks/useAccount';
import { Section } from '../Components';

export default function TwoStepVerif() {
    const { twoFA } = useAccountTwoFa();
    if (!twoFA) return null;
    const backupCodes = twoFA.methods.backupCodes.remaining;
    return (
        <div className="max-w-6xl w-full mx-auto px-10 py-6 md:px-16 md:py-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/security" label="Security" />
            <Section label="2F Authentication" desc="Review and manage your two-factor authentication methods and backup settings">
                <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <ScanQrCode size={15} className="text-white/50" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white/85">Authenticator</p>
                        <p className="text-xs text-white/40 mt-0.5">{twoFA.methods.authenticator.enabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-secondary/8 flex items-center justify-center shrink-0">
                        <BookKey size={15} className="text-text/50" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-text/85">Backup codes</p>
                        <p className="text-xs text-text/40 mt-0.5">{twoFA.methods.backupCodes.enabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                        {backupCodes > 0 ? (
                            <BadgeCheck size={16} className="text-[#67d267]" />
                        ) : (
                            <BadgeAlert size={16} className="text-red-400" />
                        )}
                        <p className="text-xs text-text/40">
                            {backupCodes} codes available.
                            {backupCodes === 0 && twoFA.methods.authenticator.enabled && ' Reset authenticator.'}
                        </p>
                    </div>
                </div>
            </Section>
        </div>
    );
}
