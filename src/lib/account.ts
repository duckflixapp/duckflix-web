import type { AccountMinDTO } from '@duckflixapp/shared';

export const getAccountDisplayName = (account: Pick<AccountMinDTO, 'profile'> | null | undefined, fallback = 'Unknown user') =>
    account?.profile?.name ?? fallback;
