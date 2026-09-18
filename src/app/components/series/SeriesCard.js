"use client";

import {
    FiStar,
    FiChevronDown,
    FiCheck,
    FiList,
    FiTrash2,
    FiMinus,
    FiPlus
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import StatusBadge, { STATUS_CONFIG } from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import RatingStars from '../ui/RatingStars';
import StreamingBadge from '../ui/StreamingBadge';
import Badge from '../ui/Badge';
import { IconButton } from '../ui/Button';
import MediaCard from './MediaCard';
import { fetchTVMazeShowDetails } from '../../services/bingeStatsService';

const STEPPER_BUTTON = 'w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer';

export default function SeriesCard({
    series,
    cardLayout = 'vertical',
    isOwner = false,
    isHighlighted = false,
    isOpenStatusMenu = false,
    onToggleStatusMenu,
    onStatusChange,
    onRatingChange,
    onWatchedEpisodesChange,
    onOpenTracker,
    onEdit,
    onDelete
}) {
    const data = typeof series.data === 'function' ? series.data() : series;
    const seriesId = series.id || series.userSeriesId;
    const totalEps = data.totalEpisodes || 0;
    const watchedEps = data.watchedEpisodes || 0;
    const seasons = data.seasons || 1;

    const [providerName, setProviderName] = useState(() => {
        return data.webChannel?.name || data.network?.name || data.streamingService || data.network || data.webChannel || null;
    });

    useEffect(() => {
        if (providerName || !data.tvmazeId) return;
        let isMounted = true;
        fetchTVMazeShowDetails(data.tvmazeId).then(details => {
            if (!isMounted || !details) return;
            const prov = details.webChannel?.name || details.network?.name;
            if (prov) {
                setProviderName(prov);
            }
        });
        return () => { isMounted = false; };
    }, [data.tvmazeId, providerName]);

    const statusMeta = STATUS_CONFIG[data.status] || STATUS_CONFIG['plan-to-watch'];

    return (
        <MediaCard
            id={`series-card-${seriesId}`}
            imageUrl={data.imageUrl}
            title={data.title}
            aspect={cardLayout === 'vertical' ? 'poster' : 'wide'}
            highlighted={isHighlighted}
            topLeft={<StatusBadge status={data.status} />}
            topRight={
                <>
                    {providerName && <StreamingBadge providerName={providerName} />}
                    {data.rating > 0 && (
                        <Badge variant="overlay" tone="warning" icon={FiStar} iconClassName="fill-current">
                            {data.rating}
                        </Badge>
                    )}
                </>
            }
            meta={
                <>
                    <span>{seasons} {seasons === 1 ? 'season' : 'seasons'}</span>
                    <span className="text-white/40">·</span>
                    <span>{totalEps} eps</span>
                </>
            }
        >
            <ProgressBar
                watchedEpisodes={watchedEps}
                totalEpisodes={totalEps}
            />

            {isOwner ? (
                <>
                    <div className="flex items-center gap-2">
                        {/* Episode stepper */}
                        <div className="shrink-0 h-10 flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-1">
                            <button
                                type="button"
                                onClick={() => onWatchedEpisodesChange && onWatchedEpisodesChange(seriesId, watchedEps - 1, data)}
                                disabled={watchedEps <= 0}
                                className={STEPPER_BUTTON}
                                aria-label="Decrease watched episodes"
                            >
                                <FiMinus className="w-3.5 h-3.5" />
                            </button>

                            <input
                                type="number"
                                value={watchedEps}
                                onChange={(e) => onWatchedEpisodesChange && onWatchedEpisodesChange(seriesId, e.target.value, data)}
                                min="0"
                                max={totalEps}
                                aria-label="Watched episodes"
                                className="w-8 text-center bg-transparent text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                            <button
                                type="button"
                                onClick={() => onWatchedEpisodesChange && onWatchedEpisodesChange(seriesId, watchedEps + 1, data)}
                                disabled={watchedEps >= totalEps}
                                className={STEPPER_BUTTON}
                                aria-label="Increase watched episodes"
                            >
                                <FiPlus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Status picker */}
                        <div className="relative flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => onToggleStatusMenu && onToggleStatusMenu(isOpenStatusMenu ? null : seriesId)}
                                aria-haspopup="menu"
                                aria-expanded={isOpenStatusMenu}
                                className="w-full h-10 px-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta.dot}`} />
                                    <span className="truncate">{statusMeta.label}</span>
                                </span>
                                <FiChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpenStatusMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {isOpenStatusMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => onToggleStatusMenu && onToggleStatusMenu(null)}
                                    />
                                    <div role="menu" className="absolute right-0 bottom-[calc(100%+6px)] z-50 min-w-[170px] p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-pop-in">
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                            const isSelected = data.status === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    role="menuitemradio"
                                                    aria-checked={isSelected}
                                                    onClick={() => {
                                                        onStatusChange && onStatusChange(seriesId, key);
                                                        onToggleStatusMenu && onToggleStatusMenu(null);
                                                    }}
                                                    className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
                                                        <span className="whitespace-nowrap">{config.label}</span>
                                                    </span>
                                                    {isSelected && <FiCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <RatingStars
                            rating={data.rating || 0}
                            onChange={(newRating) => onRatingChange && onRatingChange(seriesId, newRating)}
                        />

                        <div className="flex items-center gap-0.5">
                            <IconButton
                                icon={FiList}
                                label="Episode tracker"
                                size="sm"
                                onClick={() => onOpenTracker && onOpenTracker({ id: seriesId, ...data })}
                            />
                            <IconButton
                                icon={FiTrash2}
                                label="Remove from collection"
                                variant="danger"
                                size="sm"
                                onClick={() => onDelete && onDelete(seriesId)}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <RatingStars rating={data.rating || 0} readOnly />
                    <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {data.rating || 0} / 5
                    </span>
                </div>
            )}
        </MediaCard>
    );
}
