import * as z from 'zod';

export const createMovieSchema = z.object({
    dbUrl: z.url('Invalid URL').or(z.literal('')).optional(),

    title: z.string().max(255, 'Title is too long').optional(),

    overview: z.string().max(1000, 'Overview is too long').optional(),

    releaseYear: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : val),
        z.coerce
            .number()
            .int()
            .min(1888)
            .max(new Date().getFullYear() + 5)
            .optional()
    ),

    bannerUrl: z.url('Invalid banner URL').or(z.literal('')).optional(),
    posterUrl: z.url('Invalid poster URL').or(z.literal('')).optional(),

    genreIds: z.array(z.uuid()).optional(),
});

export type MovieFormValues = z.infer<typeof createMovieSchema>;

export const updateMovieSchema = z.object({
    dbUrl: z.url('Invalid DB URL').max(1000).optional().nullable(),
    title: z.string().min(1).max(255).optional().nullable(),
    overview: z.string().max(1000).optional().nullable(),
    releaseYear: z.coerce
        .number()
        .int()
        .min(1888)
        .max(new Date().getFullYear() + 5)
        .optional()
        .nullable(),
    bannerUrl: z.url().max(1000).optional().nullable(),
    posterUrl: z.url().max(1000).optional().nullable(),
    genreIds: z.preprocess((val) => (typeof val === 'string' ? [val] : val), z.array(z.uuid()).max(10)).optional(),
});

export type MovieUpdateFormValues = z.infer<typeof updateMovieSchema>;
