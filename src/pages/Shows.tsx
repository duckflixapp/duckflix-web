import { CatalogPage } from '../components/catalog/CatalogPage';

export default function ShowsPage() {
    return (
        <CatalogPage
            kind="shows"
            title="Shows"
            eyebrow="Series"
            description="Browse series, seasons, and ongoing shows in your Duckflix library."
            emptyTitle="No shows yet"
            emptyDescription="Shows will appear here as soon as series are added to the library."
        />
    );
}
