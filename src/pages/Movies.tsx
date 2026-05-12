import { CatalogPage } from '../components/catalog/CatalogPage';

export default function MoviesPage() {
    return (
        <CatalogPage
            kind="movies"
            title="Movies"
            eyebrow="Feature films"
            description="Browse every movie in your Duckflix library."
            emptyTitle="No movies yet"
            emptyDescription="Movies will appear here as soon as they are added to the library."
        />
    );
}
