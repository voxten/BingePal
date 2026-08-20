"use client";

import { 
    FiTv, 
    FiStar, 
    FiChevronDown, 
    FiCheck, 
    FiList, 
    FiEdit2, 
    FiTrash2, 
    FiClock, 
    FiPlay, 
    FiCheckCircle, 
    FiPauseCircle, 
    FiXCircle 
} from 'react-icons/fi';
import StatusBadge, { STATUS_CONFIG } from '../ui/StatusBadge';
import ProgressBar, { getProgressColor } from '../ui/ProgressBar';
import RatingStars from '../ui/RatingStars';

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

    const statusMeta = STATUS_CONFIG[data.status] || STATUS_CONFIG['plan-to-watch'];

    return (
        <div 
            id={`series-card-${seriesId}`}
            className={`group relative flex flex-col bg-white dark:bg-slate-900 border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ${
                isHighlighted
                    ? 'border-indigo-500 ring-4 ring-indigo-500/40 dark:ring-indigo-500/50 shadow-2xl scale-[1.02] z-20'
                    : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
        >
            {/* Card Poster Header */}
            <div className={`relative overflow-hidden rounded-t-2xl bg-slate-950 ${
                cardLayout === 'vertical' 
                    ? 'aspect-[2/3]' 
                    : 'aspect-[16/10] sm:aspect-[4/3]'
            }`}>
                <img
                    src={data.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'}
                    alt={data.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'; }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />

                {/* Floating Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <StatusBadge status={data.status} />

                    <div className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-amber-400 text-[11px] font-bold shadow-lg">
                        <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{data.rating ? Number(data.rating).toFixed(1) : '—'}</span>
                    </div>
                </div>

                {/* Poster Bottom Details */}
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h3 className="text-base font-bold tracking-tight leading-tight drop-shadow truncate mb-0.5" title={data.title}>
                        {data.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                            <FiTv className="w-3 h-3 text-slate-400" />
                            {data.seasons || 1} {data.seasons === 1 ? 'Season' : 'Seasons'}
                        </span>
                        <span>•</span>
                        <span>{totalEps} Episodes</span>
                    </div>
                </div>
            </div>

            {/* Card Content & Tracking Area */}
            <div className="p-3.5 flex flex-col flex-grow justify-between gap-3 bg-white dark:bg-slate-900 rounded-b-2xl">
                
                {/* Progress Bar & Episode Count */}
                <ProgressBar
                    watchedEpisodes={watchedEps}
                    totalEpisodes={totalEps}
                />

                {/* Episode Stepper & Interactive Status Menu */}
                {isOwner ? (
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            {/* Compact Numeric Stepper */}
                            <div className="shrink-0 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-1 shadow-sm h-[38px]">
                                <button
                                    type="button"
                                    onClick={() => onWatchedEpisodesChange && onWatchedEpisodesChange(seriesId, watchedEps - 1, data)}
                                    disabled={watchedEps <= 0}
                                    className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs cursor-pointer"
                                    aria-label="Decrease watched episode"
                                >
                                    -
                                </button>

                                <div className="flex items-center justify-center px-1">
                                    <input
                                        type="number"
                                        value={watchedEps}
                                        onChange={(e) => onWatchedEpisodesChange && onWatchedEpisodesChange(seriesId, e.target.value, data)}
                                        min="0"
                                        max={totalEps}
                                        className="w-8 text-center bg-transparent text-slate-800 dark:text-white font-bold text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onWatchedEpisodesChange && onWatchedEpisodesChange(seriesId, watchedEps + 1, data)}
                                    disabled={watchedEps >= totalEps}
                                    className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs cursor-pointer"
                                    aria-label="Increase watched episode"
                                >
                                    +
                                </button>
                            </div>

                            {/* Centered Custom Status Picker Dropdown */}
                            <div className="relative flex-1 min-w-0">
                                <button
                                    type="button"
                                    onClick={() => onToggleStatusMenu && onToggleStatusMenu(seriesId)}
                                    className="relative w-full h-[38px] px-6 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta.dot}`} />
                                    <span className="truncate whitespace-nowrap text-xs font-semibold tracking-tight">
                                        {statusMeta.label}
                                    </span>
                                    <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpenStatusMenu ? 'rotate-180 text-indigo-500' : ''}`} />
                                </button>

                                {/* Floating Status Options Menu */}
                                {isOpenStatusMenu && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => onToggleStatusMenu && onToggleStatusMenu(null)} 
                                        />
                                        <div className="absolute right-0 bottom-[calc(100%+6px)] z-50 min-w-[155px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                                const OptionIcon = config.icon;
                                                const isSelected = data.status === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => {
                                                            onStatusChange && onStatusChange(seriesId, key);
                                                            onToggleStatusMenu && onToggleStatusMenu(null);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                                            isSelected 
                                                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold' 
                                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
                                                            <OptionIcon className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="whitespace-nowrap">{config.label}</span>
                                                        </div>
                                                        {isSelected && <FiCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <RatingStars rating={data.rating || 0} readOnly />
                        <span className="text-[11px] font-semibold text-slate-400">
                            {data.rating || 0} / 5
                        </span>
                    </div>
                )}

                {/* Interactive Rating & Action Strip */}
                {isOwner && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <RatingStars 
                            rating={data.rating || 0}
                            onChange={(newRating) => onRatingChange && onRatingChange(seriesId, newRating)}
                        />

                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => onOpenTracker && onOpenTracker({ id: seriesId, ...data })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                title="Episode List Tracker"
                            >
                                <FiList className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={() => onEdit && onEdit({ id: seriesId, ...data })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                title="Edit Series"
                            >
                                <FiEdit2 className="w-3.5 h-3.5" />
                            </button>

                            <button 
                                onClick={() => onDelete && onDelete(seriesId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete Series"
                            >
                                <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
