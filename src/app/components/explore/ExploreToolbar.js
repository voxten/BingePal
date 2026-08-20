"use client";

import { FiPlus, FiGlobe } from 'react-icons/fi';
import SearchInput from '../ui/SearchInput';
import LayoutSwitcher from '../ui/LayoutSwitcher';

export default function ExploreToolbar({
    searchInputRef,
    searchQuery,
    onSearchChange,
    onClearSearch,
    isExternalSearching,
    searchOnlineEnabled,
    onToggleOnlineSearch,
    cardLayout,
    onSetCardLayout,
    sortBy,
    onSortChange,
    onOpenAddModal
}) {
    return (
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
            {/* Search Field with live instant search */}
            <SearchInput
                inputRef={searchInputRef}
                value={searchQuery}
                onChange={onSearchChange}
                onClear={onClearSearch}
                placeholder="Search all new series by title, IMDb ID or TVMaze ID..."
                isLoading={isExternalSearching}
                className="lg:max-w-xl"
            />

            {/* Layout Switcher, Sort & Add Button */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-end">
                
                {/* Live Online Search Toggle Pill */}
                <button
                    type="button"
                    onClick={onToggleOnlineSearch}
                    className={`flex items-center gap-1.5 px-3 h-[42px] rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        searchOnlineEnabled
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                    title="Auto-search online TVMaze database when typing"
                >
                    <FiGlobe className="w-3.5 h-3.5" />
                    <span>Online Search</span>
                    <span className={`w-2 h-2 rounded-full ${searchOnlineEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </button>

                {/* Reusable Layout Switcher */}
                <LayoutSwitcher
                    cardLayout={cardLayout}
                    setCardLayout={onSetCardLayout}
                />

                {/* Sort Selector */}
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-[42px] shadow-sm text-xs text-slate-600 dark:text-slate-300">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="bg-transparent font-semibold focus:outline-none cursor-pointer"
                    >
                        <option value="title">Title (A-Z)</option>
                        <option value="episodes">Most Episodes</option>
                        <option value="seasons">Most Seasons</option>
                        <option value="recent">Recently Added</option>
                    </select>
                </div>

                {/* Add Custom Series Modal Button */}
                <button
                    onClick={onOpenAddModal}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 h-[42px] rounded-xl transition-all active:scale-98 shadow-sm shadow-indigo-500/15 text-sm w-full sm:w-auto cursor-pointer"
                >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Custom</span>
                </button>
            </div>
        </div>
    );
}
