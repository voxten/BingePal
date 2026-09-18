"use client";

import { FiExternalLink, FiPlus, FiX, FiGlobe } from 'react-icons/fi';
import { STATUS_OPTIONS } from '../ui/StatusBadge';
import StreamingBadge from '../ui/StreamingBadge';
import Badge from '../ui/Badge';
import Button, { IconButton } from '../ui/Button';
import { Select } from '../ui/Field';
import MediaCard from './MediaCard';

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

    const meta = isTvmaze ? (
        <>
            <span>{item.premiered ? item.premiered.slice(0, 4) : 'TV show'}</span>
            {item.genres && item.genres.length > 0 && (
                <>
                    <span className="text-white/40">·</span>
                    <span className="truncate">{item.genres[0]}</span>
                </>
            )}
        </>
    ) : (
        <>
            <span>{seasons} {seasons === 1 ? 'season' : 'seasons'}</span>
            <span className="text-white/40">·</span>
            <span>{totalEps} eps</span>
        </>
    );

    return (
        <MediaCard
            imageUrl={imageUrl}
            title={title}
            aspect={cardLayout === 'vertical' ? 'poster' : 'wide'}
            meta={meta}
            topLeft={
                <>
                    {isTvmaze && (
                        <Badge variant="overlay" icon={FiGlobe} title="Result from the TVMaze database">
                            TVMaze
                        </Badge>
                    )}
                    <StreamingBadge showData={item} />
                </>
            }
            topRight={imdbId && (
                <Badge
                    variant="overlay"
                    tone="warning"
                    href={`https://www.imdb.com/title/${imdbId}`}
                    icon={FiExternalLink}
                    title="Open on IMDb"
                >
                    IMDb
                </Badge>
            )}
        >
            {isAdding ? (
                <div className="space-y-2 animate-fade-in">
                    <Select
                        size="sm"
                        value={selectedStatus}
                        onChange={(e) => onSelectStatus(e.target.value)}
                        aria-label="Starting status"
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Select>
                    <div className="flex gap-1.5">
                        <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            loading={isSubmitting}
                            onClick={onConfirmAdd}
                        >
                            {isSubmitting ? 'Adding…' : 'Add'}
                        </Button>
                        <IconButton icon={FiX} label="Cancel" variant="secondary" size="sm" onClick={onCancelAdding} />
                    </div>
                </div>
            ) : (
                <Button variant="secondary" size="sm" icon={FiPlus} fullWidth onClick={onStartAdding}>
                    {isTvmaze ? 'Import & add' : 'Add to list'}
                </Button>
            )}
        </MediaCard>
    );
}
