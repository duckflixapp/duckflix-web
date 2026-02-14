import * as z from 'zod';

export const createMovieSchema = z
    .object({
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
    })
    .refine(
        (data) => {
            if (data.dbUrl && data.dbUrl.trim() !== '') {
                return true;
            }
            const hasTitle = data.title && data.title.trim().length > 0;
            const hasGenres = data.genreIds && data.genreIds.length > 0;

            return !!(hasTitle && hasGenres);
        },
        {
            message: 'Either provide a URL or fill manually',
            path: ['dbUrl'],
        }
    );

export type MovieFormValues = z.infer<typeof createMovieSchema>;
