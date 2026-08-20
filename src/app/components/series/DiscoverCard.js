"use client";

import { FiTv, FiExternalLink, FiPlus, FiX } from 'react-icons/fi';
import { STATUS_OPTIONS } from '../ui/StatusBadge';

export default function DiscoverCard({
    item,
    type = 'catalog', // 'catalog' | 'tvmaze'
    cardLayout = 'vertical',
    isAdding = false,
    selectedStatus = 'plan-to-watch',
    isSubmitting = false,
    onStartAdding,
    onCancelAdding,
    onSelectStatus,
    onConfirmAdd
}) {
    const isTvmaze = type === 'tvmaze';
    const title = item.name || item.title || 'Untitled';
    const imageUrl = isTvmaze
        ? item.image?.original || item.image?.medium || ''
        : item.imageUrl || '';
    const imdbId = isTvmaze ? item.externals?.imdb : item.imdbId;
    const totalEps = item.totalEpisodes || 0;
    const seasons = item.seasons || 1;

    return (
        <div 
            className={`group relative flex flex-col bg-white dark:bg-slate-900 border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ${
                isTvmaze
                    ? 'border-violet-200/70 dark:border-violet-900/40 hover:border-violet-500/50'
                    : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400/60 dark:hover:border-indigo-500/50'
            }`}
        >
            {/* Card Poster Header */}
            <div className={`relative overflow-hidden rounded-t-2xl bg-slate-950 ${
                cardLayout === 'vertical' 
                    ? 'aspect-[2/3]' 
                    : 'aspect-[16/10] sm:aspect-[4/3]'
            }`}>
                <img
                    src={imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'}
                    alt={title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'; }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />

                {/* Floating Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs ${
                        isTvmaze
                            ? 'bg-violet-600/90 text-white'
                            : 'bg-indigo-600/90 text-white'
                    }`}>
                        {isTvmaze ? 'Online Import' : 'Catalog'}
                    </span>

                    {imdbId && (
                        <a
                            href={`https://www.imdb.com/title/${imdbId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md bg-amber-500/90 text-slate-950 text-[10px] font-bold shadow-md hover:bg-amber-400"
                        >
                            <span>IMDb</span>
                            <FiExternalLink className="w-2.5 h-2.5" />
                        </a>
                    )}
                </div>

                {/* Poster Bottom Details */}
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h3 className="text-base font-bold tracking-tight leading-tight drop-shadow truncate mb-0.5" title={title}>
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                        {isTvmaze ? (
                            <>
                                <span>{item.premiered ? item.premiered.slice(0, 4) : 'TV Show'}</span>
                                {item.genres && item.genres.length > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="truncate">{item.genres[0]}</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="flex items-center gap-1">
                                    <FiTv className="w-3 h-3 text-slate-400" />
                                    {seasons} {seasons === 1 ? 'Season' : 'Seasons'}
                                </span>
                                <span>•</span>
                                <span>{totalEps} Episodes</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Action Area */}
            <div className="p-3.5 flex flex-col flex-grow justify-between gap-3 bg-white dark:bg-slate-900 rounded-b-2xl">
                {isAdding ? (
                    <div className="space-y-2 animate-in fade-in duration-150">
                        <div className="text-[11px] font-bold text-slate-500">Pick Starting Status:</div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => onSelectStatus(e.target.value)}
                            className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="flex gap-1.5">
                            <button
                                onClick={onConfirmAdd}
                                disabled={isSubmitting}
                                className={`flex-1 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                    isTvmaze
                                        ? 'bg-violet-600 hover:bg-violet-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {isSubmitting ? 'Adding...' : 'Confirm'}
                            </button>
                            <button
                                onClick={onCancelAdding}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                <FiX className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onStartAdding}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all active:scale-98 shadow-sm cursor-pointer ${
                            isTvmaze
                                ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/15'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/15'
                        }`}
                    >
                        <FiPlus className="w-4 h-4" />
                        <span>{isTvmaze ? 'Import & Add to List' : 'Add to My List'}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
