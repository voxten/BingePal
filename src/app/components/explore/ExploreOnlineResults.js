"use client";

import DiscoverCard from '../series/DiscoverCard';
import SectionHeader from '../ui/SectionHeader';

export default function ExploreOnlineResults({
    results = [],
    cardLayout = 'vertical',
    addingSeriesId,
    selectedStatus,
    isSubmitting,
    onStartAdding,
    onCancelAdding,
    onSelectStatus,
    onImport
}) {
    if (!results || results.length === 0) return null;

    return (
        <div className="space-y-4">
            <SectionHeader
                title="From TVMaze"
                count={results.length}
                description="Not in the catalog yet. Importing adds them for everyone."
            />

            <div className={
                cardLayout === 'vertical'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
                    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
            }>
                {results.map((show) => (
                    <DiscoverCard
                        key={show.id}
                        item={show}
                        type="tvmaze"
                        cardLayout={cardLayout}
                        isAdding={addingSeriesId === `tv_${show.id}`}
                        selectedStatus={selectedStatus}
                        isSubmitting={isSubmitting}
                        onStartAdding={() => onStartAdding(`tv_${show.id}`)}
                        onCancelAdding={onCancelAdding}
                        onSelectStatus={onSelectStatus}
                        onConfirmAdd={() => onImport(show, selectedStatus)}
                    />
                ))}
            </div>
        </div>
    );
}
