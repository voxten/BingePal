"use client";

import {
    FiClock,
    FiTv,
    FiCheckCircle,
    FiStar,
    FiLoader
} from 'react-icons/fi';
import StatusBadge, { STATUS_CONFIG } from '../ui/StatusBadge';
import RatingStars from '../ui/RatingStars';
import ProgressBar from '../ui/ProgressBar';
import Card, { StatCard } from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

const Unit = ({ children }) => (
    <span className="ml-0.5 mr-1.5 text-sm font-normal text-slate-500 dark:text-slate-400">{children}</span>
);

export default function UserProfileStats({ stats, loadingEnrichment = false }) {
    // Overall collection completion percentage
    const completionPercent = stats.totalEpisodesInCollection > 0
        ? Math.min(100, Math.round((stats.totalWatchedEpisodes / stats.totalEpisodesInCollection) * 100))
        : 0;

    // Approximate equivalent in movies (110 mins average)
    const movieEquivalent = Math.round(stats.watchTime.totalMinutes / 110) || 0;

    // Series completed percentage
    const completedSeriesRate = stats.totalSeries > 0
        ? Math.round(((stats.statusCounts['completed'] || 0) / stats.totalSeries) * 100)
        : 0;

    return (
        <div className="space-y-8">

            {/* Key metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Watch time"
                    icon={FiClock}
                    value={
                        <>
                            {stats.watchTime.days}<Unit>d</Unit>
                            {stats.watchTime.hours}<Unit>h</Unit>
                            {stats.watchTime.minutes}<Unit>m</Unit>
                        </>
                    }
                    sub={`${stats.watchTime.totalMinutes.toLocaleString()} min, about ${movieEquivalent} films`}
                />

                <StatCard
                    label="Episodes watched"
                    icon={FiTv}
                    value={stats.totalWatchedEpisodes.toLocaleString()}
                    unit={`/ ${(stats.totalEpisodesInCollection || 0).toLocaleString()}`}
                >
                    <ProgressBar
                        percent={completionPercent}
                        label="Of your library"
                        size="sm"
                        className="mt-2"
                    />
                </StatCard>

                <StatCard
                    label="Series completed"
                    icon={FiCheckCircle}
                    value={stats.statusCounts['completed'] || 0}
                    unit={`/ ${stats.totalSeries}`}
                    sub={`${completedSeriesRate}% of tracked series`}
                />

                <StatCard
                    label="Average rating"
                    icon={FiStar}
                    value={stats.averageRating}
                    unit="/ 5"
                >
                    <div className="mt-1.5 flex items-center gap-2">
                        <RatingStars rating={Number(stats.averageRating) || 0} readOnly />
                        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {stats.ratedCount} rated
                        </span>
                    </div>
                </StatCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Collection status breakdown */}
                <Card className="space-y-5">
                    <SectionHeader
                        title="Collection status"
                        count={stats.totalSeries}
                        as="h3"
                    />

                    <div className="space-y-3.5">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                            const count = stats.statusCounts[key] || 0;
                            const pct = stats.totalSeries > 0 ? Math.round((count / stats.totalSeries) * 100) : 0;

                            return (
                                <div key={key} className="flex items-center gap-4">
                                    <div className="w-32 shrink-0">
                                        <StatusBadge status={key} variant="subtle" />
                                    </div>

                                    <div className="flex-1 min-w-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>

                                    <div className="w-20 shrink-0 flex justify-end gap-3 text-xs tabular-nums">
                                        <span className="font-medium text-slate-900 dark:text-slate-100">{count}</span>
                                        <span className="w-8 text-right text-slate-500 dark:text-slate-400">{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Top genres */}
                <Card className="space-y-5">
                    <SectionHeader
                        title="Top genres"
                        as="h3"
                        actions={loadingEnrichment && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                Updating
                            </span>
                        )}
                    />

                    {stats.topGenres.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            No genre data yet. It appears once your series are linked to TVMaze.
                        </p>
                    ) : (
                        <div className="space-y-3.5">
                            {stats.topGenres.map(({ genre, count, percentage }, idx) => (
                                <div key={genre} className="flex items-center gap-4">
                                    <div className="w-32 shrink-0 flex items-center gap-2 text-sm min-w-0">
                                        <span className="w-4 text-xs text-slate-400 tabular-nums">{idx + 1}</span>
                                        <span className="truncate font-medium text-slate-900 dark:text-white">{genre}</span>
                                    </div>

                                    <div className="flex-1 min-w-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    <div className="w-20 shrink-0 flex justify-end gap-3 text-xs tabular-nums">
                                        <span className="font-medium text-slate-900 dark:text-slate-100">{count}</span>
                                        <span className="w-8 text-right text-slate-500 dark:text-slate-400">{percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

        </div>
    );
}
