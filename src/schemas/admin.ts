import { z } from 'zod';

export const adminConfigSchema = z.object({
    features: z.object({
        autoTranscoding: z.enum(['off', 'compatibility', 'smart']),
        concurrentProcessing: z.number('Must be a number').int().min(1, 'Min 1').max(10, 'Max 10 simultaneous processes'),
        registration: z.object({
            enabled: z.boolean(),
            trustEmails: z.boolean(),
        }),
    }),
    preferences: z.object({
        subtitles: z.array(
            z.object({
                lang: z.string().min(2, 'Invalid lang'),
                variants: z.number().int().min(1),
            })
        ),
    }),
    external: z.object({
        tmdb: z.object({
            apiKey: z.string().min(1, 'TMDB Key is required'),
        }),
        openSubtitles: z
            .object({
                apiKey: z.string().min(1, 'OpenSubtitles API Key is required'),
                username: z.string().optional(),
                password: z.string().optional(),
                useLogin: z.boolean(),
            })
            .refine(
                (data) => {
                    if (data.useLogin) {
                        const hasUser = !!data.username && !data.username.includes('****');
                        const hasPass = !!data.password && !data.password.includes('****');
                        return hasUser && hasPass;
                    }
                    return true;
                },
                {
                    message: 'Credentials required when login enabled',
                    path: ['username'],
                }
            ),
        email: z
            .object({
                enabled: z.boolean(),
                smtpSettings: z
                    .object({
                        host: z.string().default(''),
                        port: z.number('Port is required').default(587),
                        username: z.string().default(''),
                        password: z.string().default(''),
                    })
                    .optional(),
            })
            .refine(
                (data) => {
                    if (data.enabled) {
                        const s = data.smtpSettings;
                        return !!s?.host && !!s?.username && !!s?.port && !!s?.password;
                    }
                    return true;
                },
                {
                    message: 'All SMTP settings are required when enabled',
                    path: ['smtpSettings'],
                }
            ),
    }),
});
