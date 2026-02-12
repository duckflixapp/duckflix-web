import * as z from 'zod';

export const createMovieSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),

    description: z.string().max(1000, 'Description is too long').default(''),

    releaseYear: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : val),
        z.coerce
            .number('Please enter a valid number')
            .int('Please enter a valid year')
            .min(1888, "Movies didn't exist then")
            .max(new Date().getFullYear() + 5, 'Year is too far in the future')
            .optional()
    ),

    bannerUrl: z.url('Invalid banner URL').or(z.literal('')).optional(),
    posterUrl: z.url('Invalid poster URL').or(z.literal('')).optional(),

    genreIds: z.array(z.uuid('Invalid genre ID')).min(1, 'Select at least one genre'),
});

export type MovieFormValues = z.infer<typeof createMovieSchema>;
