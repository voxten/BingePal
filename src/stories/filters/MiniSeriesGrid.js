import { FiFilter, FiStar } from 'react-icons/fi';
import EmptyState from '../../app/components/ui/EmptyState';
import Button from '../../app/components/ui/Button';
import { STATUS_CONFIG } from '../../app/components/ui/StatusBadge';

/** Stand-in for the collection grid so the filters have something to act on. */
export default function MiniSeriesGrid({ series, onReset, columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' }) {
    if (series.length === 0) {
        return (
            <EmptyState
                icon={FiFilter}
                title="No series match these filters"
                description="Loosen a range or clear the filters."
                action={onReset && <Button onClick={onReset}>Clear filters</Button>}
            />
        );
    }

    return (
        <div className={`grid ${columns} gap-x-4 gap-y-6`}>
            {series.map((s) => {
                const status = STATUS_CONFIG[s.status];
                const pct = Math.round((s.watchedEpisodes / s.totalEpisodes) * 100);
                return (
                    <article key={s.id} className="min-w-0">
                        <div className="aspect-[2/3] rounded-xl bg-slate-200 dark:bg-slate-800 flex items-end p-3">
                            <span className="font-display text-lg leading-tight font-semibold text-slate-400 dark:text-slate-600">{s.title}</span>
                        </div>
                        <div className="mt-2.5 space-y-1">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{s.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                    {status.label}
                                </span>
                                <span>·</span>
                                <span>{s.seasons} S</span>
                                {s.rating > 0 && (
                                    <>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-0.5">
                                            <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            {s.rating}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div className={`h-full ${status.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{s.watchedEpisodes}/{s.totalEpisodes} eps</p>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
