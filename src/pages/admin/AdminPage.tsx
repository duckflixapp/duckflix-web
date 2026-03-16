import { useState, useEffect } from 'react';
import { Globe, Mail, Cpu, Languages, Loader2, ChevronDown, type LucideIcon, Settings } from 'lucide-react';
import { api } from '../../lib/api';
import { adminConfigSchema } from '../../schemas/admin';
import { useForm, useWatch, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdmin } from '../../hooks/useAdmin';
import { toast } from 'sonner';
import type { SystemSettingsDTO } from '@duckflix/shared';
import axios from 'axios';

export default function AdminPage() {
    const { system } = useAdmin();
    const [loading] = useState(false);

    const {
        register,
        setValue,
        reset,
        control,
        formState: { errors, isDirty },
    } = useForm({
        resolver: zodResolver(adminConfigSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (system) {
            reset(system);
        }
    }, [system, reset]);

    const formData = useWatch({ control });
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        if (!isDirty || Object.keys(formData).length === 0) return;

        const saveConfig = async () => {
            if (Object.keys(errors).length > 0) {
                setStatus('error');
                return;
            }

            setStatus('saving');
            try {
                await api
                    .patch<SystemSettingsDTO>('/admin/system', formData)
                    .then(() => {
                        setStatus('saved');
                        toast('System configuration saved successfuly!');
                    })
                    .catch((e) => {
                        let errorMessage = '';
                        if (axios.isAxiosError(e)) errorMessage = e.response?.data?.error || e.message;
                        toast('Error occured while saving settings!', { description: errorMessage });
                    });
            } catch {
                setStatus('error');
            }
        };

        const timeoutId = setTimeout(saveConfig, 1200); // debounce
        return () => clearTimeout(timeoutId);
    }, [formData, errors, isDirty]);

    if (loading)
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    if (!system) return null;

    const getInputClassName = (error?: FieldError) => `
        w-full bg-white/5 border rounded-2xl px-4 py-2.5 text-sm outline-none transition-all 
        ${error ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' : 'border-white/10 focus:border-primary/50'}
    `;

    return (
        <div className="max-w-6xl w-full xl:pr-56 mx-auto p-6 md:p-10 pb-20 transition-all ease-in-out">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-text flex items-center gap-3">
                        <Settings className="text-primary" size={28} />
                        System Configuration
                        {status === 'saving' && <Loader2 size={16} className="animate-spin text-primary" />}
                        {status === 'saved' && (
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-lg uppercase tracking-widest animate-in fade-in">
                                Saved
                            </span>
                        )}
                    </h1>
                    <p className="text-text/40 text-sm mt-1">Changes are saved automatically as you type.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* 1. Core Features */}
                <AdminSection title="System Features" icon={Cpu}>
                    <div className="space-y-6">
                        <InputGroup label="Auto Transcoding Mode" error={errors.features?.autoTranscoding}>
                            <div className="relative">
                                <select
                                    {...register('features.autoTranscoding')}
                                    className={`${getInputClassName(errors.features?.autoTranscoding)} appearance-none cursor-pointer pr-10`}
                                >
                                    <option value="off">Off (Direct Play Only)</option>
                                    <option value="compatibility">Compatibility (H.264)</option>
                                    <option value="smart">Smart</option>
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text/20"
                                />
                            </div>
                        </InputGroup>

                        <InputGroup
                            label="Concurrent Processes"
                            description="Max simultaneous transcodes"
                            error={errors.features?.concurrentProcessing}
                        >
                            <input
                                type="number"
                                {...register('features.concurrentProcessing', { valueAsNumber: true })}
                                className={getInputClassName(errors.features?.concurrentProcessing)}
                            />
                        </InputGroup>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold text-text/80">Enable Registration</p>
                                <p className="text-[11px] text-text/40">Enable users to create their accounts</p>
                            </div>
                            <Toggle
                                enabled={!!formData.features?.registration?.enabled}
                                onChange={(val) =>
                                    setValue('features.registration.enabled', val, { shouldValidate: true, shouldDirty: true })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold text-text/80">Trust Emails</p>
                                <p className="text-[11px] text-text/40">Verify users automatically</p>
                            </div>
                            <Toggle
                                enabled={!!formData.features?.registration?.trustEmails}
                                onChange={(val) =>
                                    setValue('features.registration.trustEmails', val, { shouldValidate: true, shouldDirty: true })
                                }
                            />
                        </div>
                    </div>
                </AdminSection>

                {/* 2. Email (SMTP) */}
                <AdminSection title="Email (SMTP)" icon={Mail}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-text/80 uppercase tracking-widest text-[10px] opacity-40 font-bold">
                                Enable Email Service
                            </span>
                            <Toggle
                                enabled={!!formData.external?.email?.enabled}
                                onChange={(val) => setValue('external.email.enabled', val, { shouldValidate: true, shouldDirty: true })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <InputGroup label="SMTP Host" error={errors.external?.email?.smtpSettings?.host}>
                                    <input
                                        type="text"
                                        {...register('external.email.smtpSettings.host')}
                                        className={getInputClassName(errors.external?.email?.smtpSettings?.host)}
                                    />
                                </InputGroup>
                            </div>
                            <InputGroup label="Port" error={errors.external?.email?.smtpSettings?.port}>
                                <input
                                    type="number"
                                    {...register('external.email.smtpSettings.port', { valueAsNumber: true })}
                                    className={getInputClassName(errors.external?.email?.smtpSettings?.port)}
                                />
                            </InputGroup>
                            <InputGroup label="User" error={errors.external?.email?.smtpSettings?.username}>
                                <input
                                    type="text"
                                    {...register('external.email.smtpSettings.username')}
                                    className={getInputClassName(errors.external?.email?.smtpSettings?.username)}
                                />
                            </InputGroup>
                            <InputGroup label="Password" error={errors.external?.email?.smtpSettings?.password}>
                                <input
                                    type="text"
                                    {...register('external.email.smtpSettings.password')}
                                    className={getInputClassName(errors.external?.email?.smtpSettings?.password)}
                                />
                            </InputGroup>
                        </div>
                    </div>
                </AdminSection>

                {/* 3. OpenSubtitles */}
                <AdminSection title="OpenSubtitles" icon={Languages}>
                    <div className="space-y-4">
                        <InputGroup label="API Key" error={errors.external?.openSubtitles?.apiKey}>
                            <input
                                type="text"
                                {...register('external.openSubtitles.apiKey')}
                                className={getInputClassName(errors.external?.openSubtitles?.apiKey)}
                            />
                        </InputGroup>
                        <div className="flex items-center justify-between">
                            <span className="uppercase tracking-widest text-[10px] opacity-40 font-bold">Use Authentication</span>
                            <Toggle
                                enabled={!!formData.external?.openSubtitles?.useLogin}
                                onChange={(val) =>
                                    setValue('external.openSubtitles.useLogin', val, { shouldValidate: true, shouldDirty: true })
                                }
                            />
                        </div>
                        {formData.external?.openSubtitles?.useLogin && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <InputGroup label="Username" error={errors.external?.openSubtitles?.username}>
                                    <input
                                        type="text"
                                        {...register('external.openSubtitles.username')}
                                        className={getInputClassName(errors.external?.openSubtitles?.username)}
                                    />
                                </InputGroup>
                                <InputGroup label="Password" error={errors.external?.openSubtitles?.password}>
                                    <input
                                        type="text"
                                        {...register('external.openSubtitles.password')}
                                        className={getInputClassName(errors.external?.openSubtitles?.password)}
                                    />
                                </InputGroup>
                            </div>
                        )}
                    </div>
                </AdminSection>

                {/* 4. TMDB */}
                <AdminSection title="TMDB Integration" icon={Globe}>
                    <InputGroup label="API Key (v3)" description="Metadata and posters provider" error={errors.external?.tmdb?.apiKey}>
                        <input
                            type="text"
                            {...register('external.tmdb.apiKey')}
                            className={getInputClassName(errors.external?.tmdb?.apiKey)}
                        />
                    </InputGroup>
                </AdminSection>
            </div>
        </div>
    );
}

function InputGroup({
    label,
    description,
    error,
    children,
}: {
    label: string;
    description?: string;
    error?: FieldError;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2.5 w-full">
            <div className="flex flex-col relative">
                <div className="flex justify-between items-center">
                    <label className="text-[13px] font-bold text-text/80 tracking-tight">{label}</label>
                    {error && (
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-1 duration-200">
                            {error.message}
                        </span>
                    )}
                </div>
                {description && <span className="text-[10px] text-text/40 mt-0.5 leading-tight">{description}</span>}
            </div>
            <div>{children}</div>
        </div>
    );
}

function AdminSection({ title, icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
    const Icon = icon;
    return (
        <div className="bg-secondary/10 backdrop-blur-3xl border border-white/10 rounded-4xl p-6 mb-auto shadow-xl">
            <div className="flex items-center gap-3 mb-6 text-primary">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-text/90 tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!enabled)}
            className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${enabled ? 'bg-primary' : 'bg-white/10'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white shadow-sm ${enabled ? 'left-7' : 'left-1'}`} />
        </div>
    );
}
