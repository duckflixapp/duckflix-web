import type { ContentDTO, MovieDTO } from '@duckflixapp/shared';
import { type CatalogItem, type CatalogKind } from '../../hooks/useCatalog';
import { capitalize } from '../../utils/string';

export const isMovie = (item: CatalogItem): item is MovieDTO => 'releaseYear' in item;

export const getReleaseLabel = (item: CatalogItem) => {
    if (isMovie(item)) return item.releaseYear ? String(item.releaseYear) : '';
    return item.firstAirDate ? String(new Date(item.firstAirDate).getFullYear()) : '';
};

export const toContentDTO = (item: CatalogItem, kind: CatalogKind): ContentDTO => ({
    type: kind === 'movies' ? 'movie' : 'series',
    id: item.id,
    title: item.title,
    image: item.posterUrl,
    rating: item.rating ? Number(item.rating) : null,
    createdAt: '',
    release: getReleaseLabel(item),
});

export const getHeroMeta = (item: CatalogItem) => {
    const release = getReleaseLabel(item);
    const genres = item.genres.slice(0, 3).map((genre) => capitalize(genre.name));
    const meta = [release, item.rating ? `${item.rating} rating` : null, ...genres].filter(Boolean);

    if (!isMovie(item) && item.seasons.length > 0) {
        meta.splice(2, 0, `${item.seasons.length} season${item.seasons.length === 1 ? '' : 's'}`);
    }

    return meta;
};
