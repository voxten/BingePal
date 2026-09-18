"use client";

import { FiChevronRight } from 'react-icons/fi';
import Poster from '../ui/Poster';
import Badge from '../ui/Badge';
import StreamingBadge from '../ui/StreamingBadge';

const parseAirdate = (airdate) => {
    if (!airdate) return null;
    const [y, m, d] = airdate.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

const countdownLabel = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
};

export default function ScheduleRow({ item, onOpen, showCountdown = true }) {
    const ep = item.nextEpisode;
    const date = parseAirdate(ep.airdate);
    const days = ep.countdown?.days;
    const isSoon = days !== null && days <= 1;

    const weekday = date ? date.toLocaleDateString(undefined, { weekday: 'short' }) : '';
    const dayMonth = date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ep.airdate;
    const episodeTag = `S${String(ep.season).padStart(2, '0')}E${String(ep.number).padStart(2, '0')}`;

    const countdown = showCountdown && days !== null && (
        <Badge tone={isSoon ? 'accent' : 'neutral'}>{countdownLabel(days)}</Badge>
    );

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800/40 cursor-pointer"
        >
            <Poster
                src={item.imageUrl}
                alt={item.title}
                className="w-10 h-[60px] rounded-md shrink-0 ring-1 ring-slate-900/5 dark:ring-white/5"
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {item.title}
                    </span>
                    <span className="hidden sm:flex min-w-0">
                        <StreamingBadge providerName={item.network} variant="soft" />
                    </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums text-slate-700 dark:text-slate-300">{episodeTag}</span>
                    {ep.name && <> · {ep.name}</>}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums sm:hidden">
                    <span>{weekday} {dayMonth}{ep.airtime ? `, ${ep.airtime}` : ''}</span>
                    {countdown}
                </div>
            </div>

            <div className="hidden sm:flex flex-col items-end shrink-0 tabular-nums">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {weekday}, {dayMonth}
                </span>
                {ep.airtime && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {ep.airtime}
                    </span>
                )}
            </div>

            <div className="hidden sm:block w-24 shrink-0 text-right">
                {countdown}
            </div>

            <FiChevronRight className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
        </button>
    );
}
