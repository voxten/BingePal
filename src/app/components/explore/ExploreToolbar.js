"use client";

import { FiGlobe } from 'react-icons/fi';
import SearchInput from '../ui/SearchInput';
import LayoutSwitcher from '../ui/LayoutSwitcher';
import Button from '../ui/Button';
import { Select } from '../ui/Field';

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
    onSortChange
}) {
    return (
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
            <SearchInput
                inputRef={searchInputRef}
                value={searchQuery}
                onChange={onSearchChange}
                onClear={onClearSearch}
                placeholder="Search by title, IMDb ID or TVMaze ID"
                isLoading={isExternalSearching}
                className="lg:max-w-xl"
            />

            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-end">
                <Button
                    icon={FiGlobe}
                    pressed={searchOnlineEnabled}
                    onClick={onToggleOnlineSearch}
                    title="Also search the TVMaze database while typing"
                >
                    Search TVMaze
                </Button>

                <LayoutSwitcher
                    cardLayout={cardLayout}
                    setCardLayout={onSetCardLayout}
                />

                <Select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    aria-label="Sort catalog"
                    className="w-44"
                >
                    <option value="title">Title (A-Z)</option>
                    <option value="episodes">Most episodes</option>
                    <option value="seasons">Most seasons</option>
                    <option value="recent">Recently added</option>
                </Select>
            </div>
        </div>
    );
}
