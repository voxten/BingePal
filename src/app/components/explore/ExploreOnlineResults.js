"use client";

import { FiGlobe } from 'react-icons/fi';
import DiscoverCard from '../series/DiscoverCard';

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
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <FiGlobe className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            Online TV Database Results ({results.length})
                        </h2>
                        <p className="text-[11px] text-slate-400">
                            Available online to import & track in 1-click
                        </p>
                    </div>
                </div>
            </div>

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
