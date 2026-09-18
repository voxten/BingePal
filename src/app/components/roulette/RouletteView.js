"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiShuffle, FiList, FiPlay, FiRotateCw, FiFilter } from 'react-icons/fi';
import { fetchTVMazeShowDetails } from '../../services/bingeStatsService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Poster from '../ui/Poster';
import ProgressBar from '../ui/ProgressBar';
import RatingStars from '../ui/RatingStars';
import StatusBadge from '../ui/StatusBadge';
import StreamingBadge from '../ui/StreamingBadge';
import SegmentedControl from '../ui/SegmentedControl';
import SectionHeader from '../ui/SectionHeader';
import EmptyState from '../ui/EmptyState';
import MediaCard from '../series/MediaCard';

const POOL_OPTIONS = [
    { value: 'plan-to-watch', label: 'Plan to watch' },
    { value: 'watching', label: 'Watching' },
    { value: 'on-hold', label: 'On hold' },
    { value: 'unfinished', label: 'Unfinished', title: 'Everything except completed and dropped' },
];

const RATING_OPTIONS = [
    { value: '0', label: 'Any' },
    { value: '3', label: '3★+' },
    { value: '4', label: '4★+' },
];

// Reel geometry: the visible card sits at START_INDEX before a spin and the winner at WIN_INDEX after it
const STRIP_LENGTH = 60;
const START_INDEX = 4;
const WIN_INDEX = 54;
const SPIN_MS = 5200;
const SETTLE_MS = 350;
const SPIN_EASING = 'cubic-bezier(0.1, 0.7, 0.15, 1)';
const SETTLE_EASING = 'cubic-bezier(0.3, 0, 0.2, 1)';

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

function buildStrip(candidates, first, winner) {
    const strip = [];
    for (let i = 0; i < STRIP_LENGTH; i++) {
        if (i === START_INDEX && first) { strip.push(first); continue; }
        if (i === WIN_INDEX) { strip.push(winner); continue; }

        // Avoid the same poster twice in a row when the pool allows it
        const neighbour = i + 1 === WIN_INDEX ? winner : i + 1 === START_INDEX ? first : null;
        let item = pickRandom(candidates);
        for (let tries = 0; tries < 6 && candidates.length > 1 && (item.id === strip[i - 1]?.id || item.id === neighbour?.id); tries++) {
            item = pickRandom(candidates);
        }
        strip.push(item);
    }
    return strip;
}

const matchesPool = (status, pool) => {
    if (pool === 'unfinished') return status !== 'completed' && status !== 'dropped';
    return status === pool;
};

export default function RouletteView({ allSeries = [], onOpenTracker }) {
    const [pool, setPool] = useState('plan-to-watch');
    const [minRating, setMinRating] = useState('0');

    const [strip, setStrip] = useState([]);
    const [position, setPosition] = useState({ index: START_INDEX, offset: 0, duration: 0, easing: SPIN_EASING });
    const [metrics, setMetrics] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [history, setHistory] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [provider, setProvider] = useState(null);

    const [containerEl, setContainerEl] = useState(null);
    const phaseRef = useRef('idle'); // 'idle' | 'spinning' | 'settling'

    const candidates = useMemo(() => {
        return allSeries.filter(series => {
            const data = typeof series.data === 'function' ? series.data() : series;
            return matchesPool(data.status, pool) && (data.rating || 0) >= Number(minRating);
        });
    }, [allSeries, pool, minRating]);

    // New filters: fresh idle reel and no result. Snapshot updates (e.g. "Start watching") don't reset anything.
    useEffect(() => {
        setWinner(null);
        setPosition({ index: START_INDEX, offset: 0, duration: 0, easing: SPIN_EASING });
        setStrip(candidates.length > 0 ? buildStrip(candidates, null, pickRandom(candidates)) : []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pool, minRating]);

    // First data arrival after mount
    useEffect(() => {
        if (strip.length === 0 && candidates.length > 0 && !isSpinning) {
            setStrip(buildStrip(candidates, null, pickRandom(candidates)));
        }
    }, [candidates, strip.length, isSpinning]);

    // Measure the viewport and card pitch so the centre marker lines up at every width
    useEffect(() => {
        if (!containerEl) return;

        const measure = () => {
            const items = containerEl.querySelectorAll('[data-reel-item]');
            if (items.length < 2) return;
            setMetrics({
                containerWidth: containerEl.clientWidth,
                itemWidth: items[0].offsetWidth,
                step: items[1].offsetLeft - items[0].offsetLeft,
            });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(containerEl);
        return () => observer.disconnect();
    }, [containerEl, strip.length]);

    // Streaming provider for the result panel (cached TVMaze lookup)
    const liveWinner = winner ? (allSeries.find(s => s.id === winner.id) || winner) : null;
    useEffect(() => {
        setProvider(null);
        if (!liveWinner?.tvmazeId) return;
        let alive = true;
        fetchTVMazeShowDetails(liveWinner.tvmazeId).then(details => {
            if (alive && details) setProvider(details.webChannel?.name || details.network?.name || null);
        });
        return () => { alive = false; };
    }, [liveWinner?.tvmazeId]);

    const finish = (picked) => {
        phaseRef.current = 'idle';
        setWinner(picked);
        setIsSpinning(false);
        setHistory(prev => [picked, ...prev.filter(p => p.id !== picked.id)].slice(0, 7));
    };

    const spin = () => {
        if (phaseRef.current !== 'idle' || candidates.length === 0 || !metrics) return;

        const current = strip[position.index];
        const picked = pickRandom(candidates);
        const nextStrip = buildStrip(candidates, current, picked);

        setWinner(null);
        setIsSpinning(true);
        setStrip(nextStrip);
        setPosition({ index: START_INDEX, offset: 0, duration: 0, easing: SPIN_EASING });

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            setPosition({ index: WIN_INDEX, offset: 0, duration: 0, easing: SPIN_EASING });
            finish(picked);
            return;
        }

        phaseRef.current = 'spinning';
        // Land slightly off-centre, then settle, so the stop feels physical
        const direction = Math.random() < 0.5 ? -1 : 1;
        const jitter = direction * (0.1 + Math.random() * 0.25) * metrics.itemWidth;

        // Two frames: let the reset position paint before starting the long transition
        requestAnimationFrame(() => requestAnimationFrame(() => {
            setPosition({ index: WIN_INDEX, offset: jitter, duration: SPIN_MS, easing: SPIN_EASING });
        }));
    };

    const handleTransitionEnd = (e) => {
        if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;

        if (phaseRef.current === 'spinning') {
            phaseRef.current = 'settling';
            setPosition({ index: WIN_INDEX, offset: 0, duration: SETTLE_MS, easing: SETTLE_EASING });
        } else if (phaseRef.current === 'settling') {
            finish(strip[WIN_INDEX]);
        }
    };

    const startWatching = async () => {
        if (!liveWinner) return;
        setIsUpdating(true);
        try {
            await updateDoc(doc(db, 'userSeries', liveWinner.id), { status: 'watching' });
        } catch {
            try { await updateDoc(doc(db, 'series', liveWinner.id), { status: 'watching' }); } catch (e) { console.error(e); }
        } finally {
            setIsUpdating(false);
        }
    };

    const translateX = metrics
        ? -(position.index * metrics.step + metrics.itemWidth / 2 - metrics.containerWidth / 2 + position.offset)
        : 0;

    const landedIndex = !isSpinning && winner && strip[position.index]?.id === winner.id ? position.index : null;

    const watched = liveWinner?.watchedEpisodes || 0;
    const total = liveWinner?.totalEpisodes || 0;
    const upNextLabel = !liveWinner ? '' :
        total > 0 && watched >= total ? 'All episodes watched' :
        watched === 0 ? 'Start from episode 1' :
        `${watched} / ${total || '?'} · Up next: episode ${watched + 1}`;
    const canStartWatching = liveWinner && (liveWinner.status === 'plan-to-watch' || liveWinner.status === 'on-hold');
    const earlierPicks = history.filter(p => p.id !== winner?.id).slice(0, 6);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card padding="sm" className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="space-y-1.5 min-w-0">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">Pick from</span>
                    <div className="overflow-x-auto no-scrollbar">
                        <SegmentedControl
                            aria-label="Pool"
                            options={POOL_OPTIONS}
                            value={pool}
                            onChange={setPool}
                            disabled={isSpinning}
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">Minimum rating</span>
                    <SegmentedControl
                        aria-label="Minimum rating"
                        options={RATING_OPTIONS}
                        value={minRating}
                        onChange={setMinRating}
                        disabled={isSpinning}
                    />
                </div>
                <p className="lg:ml-auto lg:pb-2.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="font-medium text-slate-900 dark:text-white">{candidates.length}</span> in the pool
                </p>
            </Card>

            {/* Reel */}
            {candidates.length === 0 ? (
                <EmptyState
                    icon={FiFilter}
                    title="Nothing in this pool"
                    description="No series match these filters. Try another pool or a lower minimum rating."
                />
            ) : (
                <Card padding="none" className="overflow-hidden">
                    <div className="relative py-8">
                        {/* Centre slot and markers */}
                        <div className="pointer-events-none absolute inset-y-5 left-1/2 -translate-x-1/2 w-36 sm:w-44 rounded-2xl border-2 border-indigo-500/60 bg-indigo-500/5 dark:border-indigo-400/60" />
                        <div className="pointer-events-none absolute top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[9px] border-t-indigo-500 dark:border-t-indigo-400" />
                        <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-b-[9px] border-b-indigo-500 dark:border-b-indigo-400" />

                        <div
                            ref={setContainerEl}
                            className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
                        >
                            <div
                                className={`flex w-max gap-4 will-change-transform ${metrics ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    transform: `translate3d(${translateX}px, 0, 0)`,
                                    transition: position.duration ? `transform ${position.duration}ms ${position.easing}` : 'none',
                                }}
                                onTransitionEnd={handleTransitionEnd}
                            >
                                {strip.map((series, i) => (
                                    <div
                                        key={`${i}-${series.id}`}
                                        data-reel-item
                                        className={`w-32 sm:w-40 shrink-0 transition-opacity duration-300 ${
                                            landedIndex !== null && landedIndex !== i ? 'opacity-40' : ''
                                        }`}
                                    >
                                        <MediaCard
                                            size="sm"
                                            imageUrl={series.imageUrl}
                                            title={series.title}
                                            highlighted={landedIndex === i}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pb-8">
                        <Button
                            size="lg"
                            variant="primary"
                            icon={FiShuffle}
                            onClick={spin}
                            disabled={isSpinning || !metrics}
                            className="min-w-40"
                        >
                            {isSpinning ? 'Spinning…' : winner ? 'Spin again' : 'Spin'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Result */}
            {liveWinner && !isSpinning && (
                <Card className="animate-pop-in">
                    <div className="flex flex-col sm:flex-row gap-5">
                        <Poster
                            src={liveWinner.imageUrl}
                            alt={liveWinner.title}
                            className="w-28 sm:w-36 aspect-[2/3] rounded-xl shrink-0 self-start"
                        />

                        <div className="flex-1 min-w-0 flex flex-col gap-4">
                            <div>
                                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Tonight&apos;s pick</p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                    {liveWinner.title}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                                    <StatusBadge status={liveWinner.status} variant="subtle" />
                                    {provider && <StreamingBadge providerName={provider} variant="soft" />}
                                    <span>
                                        {liveWinner.seasons} {liveWinner.seasons === 1 ? 'season' : 'seasons'} · {total} eps
                                    </span>
                                    {liveWinner.rating > 0 && <RatingStars rating={liveWinner.rating} readOnly />}
                                </div>
                            </div>

                            <ProgressBar
                                className="max-w-md"
                                watchedEpisodes={watched}
                                totalEpisodes={total}
                                label={upNextLabel}
                            />

                            <div className="flex flex-wrap gap-2 sm:mt-auto">
                                <Button variant="primary" icon={FiList} onClick={() => onOpenTracker && onOpenTracker(liveWinner)}>
                                    Open episodes
                                </Button>
                                {canStartWatching && (
                                    <Button icon={FiPlay} loading={isUpdating} onClick={startWatching}>
                                        Start watching
                                    </Button>
                                )}
                                <Button variant="ghost" icon={FiRotateCw} onClick={spin}>
                                    Spin again
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Session history */}
            {earlierPicks.length > 0 && (
                <section className="space-y-3">
                    <SectionHeader title="Earlier picks" description="From this session. Click one to see it again." />
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {earlierPicks.map(p => (
                            <MediaCard
                                key={p.id}
                                size="sm"
                                imageUrl={p.imageUrl}
                                title={p.title}
                                onPosterClick={() => !isSpinning && setWinner(p)}
                                posterLabel={`Show ${p.title}`}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
