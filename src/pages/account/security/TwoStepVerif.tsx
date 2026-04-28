import { BadgeAlert, BadgeCheck, BookKey, ScanQrCode } from 'lucide-react';
import { BackButton } from '../../../components/buttons/BackButton';
import { useAccount } from '../../../hooks/use-account';

export default function TwoStepVerif() {
    const { twoFA } = useAccount();
    if (!twoFA) return null;
    const backupCodes = twoFA.methods.backupCodes.remaining;
    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 flex flex-col gap-y-8">
            <BackButton to="/account/security" label="Security" />
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 px-1 mb-2">2FA Authentication</p>
                <div className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden divide-y divide-white/6">
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
                                {backupCodes} codes available.{backupCodes === 0 && ' Reset authenticator.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
