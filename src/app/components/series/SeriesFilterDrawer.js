"use client";

import { 
    FiFilter, 
    FiX, 
    FiRotateCcw, 
    FiArrowUp, 
    FiArrowDown, 
    FiStar 
} from 'react-icons/fi';
import { STATUS_CONFIG } from '../ui/StatusBadge';

export default function SeriesFilterDrawer({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    sortConfig,
    onSortChange,
    onToggleSortDirection,
    sortOptions = [],
    onReset,
    activeFiltersCount = 0,
    onRemoveFilter
}) {
    if (!isOpen && activeFiltersCount === 0) return null;

    return (
        <div className="space-y-4">
            {/* Expanded Drawer Panel */}
            {isOpen && (
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <FiFilter className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Filter & Sort Options</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                type="button"
                                onClick={onReset} 
                                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                                <FiRotateCcw className="w-3.5 h-3.5" />
                                <span>Reset All</span>
                            </button>
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {/* Sort selector */}
                        {sortConfig && (
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Sort By
                                </label>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={sortConfig.key} 
                                        onChange={(e) => onSortChange && onSortChange(e.target.value)}
                                        className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 h-[40px] cursor-pointer"
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={onToggleSortDirection}
                                        title={sortConfig.direction === 'asc' ? 'Ascending Order' : 'Descending Order'}
                                        className="h-[40px] px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
                                    >
                                        {sortConfig.direction === 'asc' ? (
                                            <FiArrowUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        ) : (
                                            <FiArrowDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status Filter */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Status
                            </label>
                            <select 
                                name="status" 
                                value={filters.status} 
                                onChange={onFilterChange} 
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 h-[40px] cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="plan-to-watch">Plan to Watch</option>
                                <option value="watching">Watching</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                                <option value="dropped">Dropped</option>
                            </select>
                        </div>

                        {/* Progress Filter */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Progress
                            </label>
                            <select 
                                name="progressStatus" 
                                value={filters.progressStatus} 
                                onChange={onFilterChange} 
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 h-[40px] cursor-pointer"
                            >
                                <option value="">Any Progress</option>
                                <option value="not-started">Not Started (0%)</option>
                                <option value="in-progress">In Progress (1-99%)</option>
                                <option value="completed">Finished (100%)</option>
                            </select>
                        </div>

                        {/* Seasons Range */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Seasons Range
                            </label>
                            <div className="flex items-center gap-1.5">
                                <input 
                                    type="number" 
                                    name="seasonsMin" 
                                    value={filters.seasonsMin} 
                                    onChange={onFilterChange} 
                                    min="0" 
                                    placeholder="Min" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                                <span className="text-slate-400 font-medium text-xs">-</span>
                                <input 
                                    type="number" 
                                    name="seasonsMax" 
                                    value={filters.seasonsMax} 
                                    onChange={onFilterChange} 
                                    min="0" 
                                    placeholder="Max" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                            </div>
                        </div>

                        {/* Watched Eps Range */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Watched Eps Range
                            </label>
                            <div className="flex items-center gap-1.5">
                                <input 
                                    type="number" 
                                    name="episodesMin" 
                                    value={filters.episodesMin} 
                                    onChange={onFilterChange} 
                                    min="0" 
                                    placeholder="Min" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                                <span className="text-slate-400 font-medium text-xs">-</span>
                                <input 
                                    type="number" 
                                    name="episodesMax" 
                                    value={filters.episodesMax} 
                                    onChange={onFilterChange} 
                                    min="0" 
                                    placeholder="Max" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                            </div>
                        </div>

                        {/* Rating (Stars) Range */}
                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-1">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Rating (Stars)
                            </label>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-[38px]">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Min</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={`min-${star}`}
                                                type="button"
                                                onClick={() => onRemoveFilter && onRemoveFilter('ratingMin', filters.ratingMin === star.toString() ? '' : star.toString())}
                                                className="focus:outline-none transition-transform active:scale-125 p-0.5 cursor-pointer"
                                            >
                                                <FiStar className={`w-3.5 h-3.5 ${star <= (filters.ratingMin ? parseInt(filters.ratingMin) : 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-[38px]">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Max</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={`max-${star}`}
                                                type="button"
                                                onClick={() => onRemoveFilter && onRemoveFilter('ratingMax', filters.ratingMax === star.toString() ? '' : star.toString())}
                                                className="focus:outline-none transition-transform active:scale-125 p-0.5 cursor-pointer"
                                            >
                                                <FiStar className={`w-3.5 h-3.5 ${star <= (filters.ratingMax ? parseInt(filters.ratingMax) : 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Active Filters Dismissible Pills Bar */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Active filters:</span>
                    
                    {filters.status && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Status: {STATUS_CONFIG[filters.status]?.label || filters.status}
                            <button type="button" onClick={() => onRemoveFilter && onRemoveFilter('status', '')} className="hover:text-indigo-900 cursor-pointer">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.progressStatus && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Progress: {filters.progressStatus}
                            <button type="button" onClick={() => onRemoveFilter && onRemoveFilter('progressStatus', '')} className="hover:text-indigo-900 cursor-pointer">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {(filters.seasonsMin || filters.seasonsMax) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Seasons: {filters.seasonsMin || '0'} - {filters.seasonsMax || '∞'}
                            <button type="button" onClick={() => { onRemoveFilter && onRemoveFilter('seasonsMin', ''); onRemoveFilter && onRemoveFilter('seasonsMax', ''); }} className="hover:text-indigo-900 cursor-pointer">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {(filters.episodesMin || filters.episodesMax) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Episodes: {filters.episodesMin || '0'} - {filters.episodesMax || '∞'}
                            <button type="button" onClick={() => { onRemoveFilter && onRemoveFilter('episodesMin', ''); onRemoveFilter && onRemoveFilter('episodesMax', ''); }} className="hover:text-indigo-900 cursor-pointer">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {(filters.ratingMin || filters.ratingMax) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Rating: {filters.ratingMin ? `${filters.ratingMin}★` : '1★'} - {filters.ratingMax ? `${filters.ratingMax}★` : '5★'}
                            <button type="button" onClick={() => { onRemoveFilter && onRemoveFilter('ratingMin', ''); onRemoveFilter && onRemoveFilter('ratingMax', ''); }} className="hover:text-indigo-900 cursor-pointer">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    <button 
                        type="button"
                        onClick={onReset} 
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 ml-1 underline decoration-dotted cursor-pointer"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
}
