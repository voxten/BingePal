"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { recordWatchedEpisode } from '../services/recentWatchedService';
import {
    FiLoader,
    FiCheck,
    FiCheckCircle,
    FiSidebar,
    FiAlertCircle
} from 'react-icons/fi';
import StreamingBadge from './ui/StreamingBadge';
import Modal from './ui/Modal';
import Button, { IconButton } from './ui/Button';
import Badge from './ui/Badge';
import Poster from './ui/Poster';
import ProgressBar from './ui/ProgressBar';

const formatAirDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
};

const SEASON_ITEM_ACTIVE = 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20';
const SEASON_ITEM_IDLE = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100';

const EpisodesModal = ({ series, onClose, isOwner }) => {
    const { user } = useAuth();
    const [episodesBySeason, setEpisodesBySeason] = useState({});
    const [activeSeason, setActiveSeason] = useState(series?.initialSeason ? String(series.initialSeason) : '1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [watchedList, setWatchedList] = useState(series.watchedEpisodesList || []);

    const currentUserId = user?.uid || series.userId;

    useEffect(() => {
        const fetchEpisodes = async () => {
            if (!series.tvmazeId) {
                setError('To use the episode tracker, the series must have a TVMaze ID (Import it via IMDb link again).');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`https://api.tvmaze.com/shows/${series.tvmazeId}/episodes`);
                if (!res.ok) throw new Error('Failed to fetch episodes');
                
                const rawData = await res.json();
                
                const dataWithSimpleIds = rawData.map((ep, index) => ({
                    ...ep,
                    trackerId: index + 1
                }));
                
                const grouped = dataWithSimpleIds.reduce((acc, ep) => {
                    if (!acc[ep.season]) acc[ep.season] = [];
                    acc[ep.season].push(ep);
                    return acc;
                }, {});

                setEpisodesBySeason(grouped);
                if (Object.keys(grouped).length > 0) {
                    const requestedSeason = series?.initialSeason ? String(series.initialSeason) : null;
                    if (requestedSeason && grouped[requestedSeason]) {
                        setActiveSeason(requestedSeason);
                    } else if (!grouped[activeSeason]) {
                        setActiveSeason(Object.keys(grouped)[0]);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEpisodes();
    }, [series.tvmazeId]);

    const handleToggleEpisode = async (episodeTrackerId) => {
        if (!isOwner) return;

        const userSeriesId = series.userSeriesId || series.id;
        const isWatched = watchedList.includes(episodeTrackerId);
        const newList = isWatched 
            ? watchedList.filter(id => id !== episodeTrackerId) 
            : [...watchedList, episodeTrackerId];
            
        setWatchedList(newList);

        try {
            await updateDoc(doc(db, 'userSeries', userSeriesId), { 
                watchedEpisodesList: newList,
                watchedEpisodes: newList.length,
                status: newList.length === series.totalEpisodes && series.totalEpisodes > 0 ? 'completed' : series.status
            });

            // If we just marked this episode as watched, log to Recently Watched
            if (!isWatched) {
                const allEps = Object.values(episodesBySeason).flat();
                const targetEp = allEps.find(ep => ep.trackerId === episodeTrackerId);
                if (targetEp) {
                    recordWatchedEpisode({
                        userId: currentUserId,
                        userSeriesId: userSeriesId,
                        seriesId: series.seriesId || series.id,
                        seriesTitle: series.title,
                        imageUrl: targetEp.image?.original || targetEp.image?.medium || series.imageUrl,
                        episodeNumber: episodeTrackerId,
                        seasonNumber: targetEp.season,
                        episodeInSeason: targetEp.number,
                        episodeTitle: targetEp.name,
                        runtime: targetEp.runtime || null,
                        airdate: targetEp.airdate || null,
                        seasonEpisodesCount: episodesBySeason[targetEp.season]?.length || null,
                        tvmazeId: series.tvmazeId,
                        totalEpisodes: series.totalEpisodes,
                        watchedEpisodes: newList.length
                    });
                }
            }
        } catch (err) {
            console.error("Error updating watched episodes: ", err);
        }
    };

    const handleToggleSeason = async (seasonNumber) => {
        if (!isOwner) return;
        const userSeriesId = series.userSeriesId || series.id;
        const seasonEps = episodesBySeason[seasonNumber] || [];
        const seasonIds = seasonEps.map(ep => ep.trackerId);
        const allSeasonWatched = seasonIds.every(id => watchedList.includes(id));

        let newList;
        if (allSeasonWatched) {
            newList = watchedList.filter(id => !seasonIds.includes(id));
        } else {
            newList = Array.from(new Set([...watchedList, ...seasonIds]));
        }

        setWatchedList(newList);
        try {
            await updateDoc(doc(db, 'userSeries', userSeriesId), {
                watchedEpisodesList: newList,
                watchedEpisodes: newList.length,
                status: newList.length === series.totalEpisodes && series.totalEpisodes > 0 ? 'completed' : series.status
            });

            // If we marked whole season as watched, log the final episode of that season
            if (!allSeasonWatched && seasonEps.length > 0) {
                const lastEp = seasonEps[seasonEps.length - 1];
                recordWatchedEpisode({
                    userId: currentUserId,
                    userSeriesId: userSeriesId,
                    seriesId: series.seriesId || series.id,
                    seriesTitle: series.title,
                    imageUrl: lastEp.image?.original || lastEp.image?.medium || series.imageUrl,
                    episodeNumber: lastEp.trackerId,
                    seasonNumber: lastEp.season,
                    episodeInSeason: lastEp.number,
                    episodeTitle: lastEp.name,
                    runtime: lastEp.runtime || null,
                    airdate: lastEp.airdate || null,
                    seasonEpisodesCount: seasonEps.length || null,
                    tvmazeId: series.tvmazeId,
                    totalEpisodes: series.totalEpisodes,
                    watchedEpisodes: newList.length
                });
            }
        } catch (err) {
            console.error("Error toggling entire season: ", err);
        }
    };

    const totalEpisodesCount = useMemo(() => {
        return Object.values(episodesBySeason).reduce((sum, eps) => sum + eps.length, 0);
    }, [episodesBySeason]);

    const overallProgressPercent = totalEpisodesCount > 0 
        ? Math.round((watchedList.length / totalEpisodesCount) * 100) 
        : 0;

    const seasons = Object.keys(episodesBySeason);
    const currentSeasonEpisodes = episodesBySeason[activeSeason] || [];
    const currentSeasonWatchedCount = currentSeasonEpisodes.filter(ep => watchedList.includes(ep.trackerId)).length;
    const isCurrentSeasonComplete = currentSeasonEpisodes.length > 0 && currentSeasonWatchedCount === currentSeasonEpisodes.length;

    const seasonCounts = (season) => {
        const seasonEps = episodesBySeason[season] || [];
        const watched = seasonEps.filter(ep => watchedList.includes(ep.trackerId)).length;
        return { watched, total: seasonEps.length, isComplete: seasonEps.length > 0 && watched === seasonEps.length };
    };

    return (
        <Modal
            onClose={onClose}
            size="xl"
            scrollBody={false}
            bodyClassName="flex flex-col md:flex-row"
            panelClassName="h-[92vh] sm:h-[85vh]"
            headerStart={
                <span className="hidden md:block -ml-1.5">
                    <IconButton
                        icon={FiSidebar}
                        label="Toggle seasons panel"
                        size="sm"
                        pressed={isSidebarOpen}
                        onClick={() => setIsSidebarOpen(prev => !prev)}
                    />
                </span>
            }
            title={
                <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{series.title}</span>
                    <StreamingBadge showData={series} variant="soft" />
                </span>
            }
            description={
                <span className="tabular-nums">
                    {watchedList.length} of {totalEpisodesCount || series.totalEpisodes || 0} watched · {overallProgressPercent}%
                </span>
            }
            headerBottom={<ProgressBar percent={overallProgressPercent} showLabel={false} size="sm" />}
        >
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                    <FiLoader className="w-6 h-6 animate-spin" />
                    <p className="text-sm">Loading episodes…</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <FiAlertCircle className="w-6 h-6 text-rose-500" />
                    <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">{error}</p>
                </div>
            ) : (
                <>
                    {/* Mobile season selector */}
                    <div className="md:hidden flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 shrink-0 no-scrollbar">
                        {seasons.map(season => {
                            const { isComplete } = seasonCounts(season);
                            const isActive = activeSeason === season;

                            return (
                                <button
                                    key={season}
                                    onClick={() => setActiveSeason(season)}
                                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                        isActive ? SEASON_ITEM_ACTIVE : SEASON_ITEM_IDLE
                                    }`}
                                >
                                    <span>Season {season}</span>
                                    {isComplete && <FiCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Desktop seasons sidebar */}
                    <div className={`hidden md:flex flex-col shrink-0 overflow-hidden border-r border-slate-200 dark:border-slate-800 transition-all ease-in-out ${
                        isSidebarOpen
                            ? 'w-56 opacity-100 p-3'
                            : 'w-0 opacity-0 p-0 border-r-0 pointer-events-none'
                    }`}>
                        <span className="px-2.5 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Seasons
                        </span>

                        <div className="space-y-0.5 overflow-y-auto flex-grow">
                            {seasons.map(season => {
                                const { watched, total, isComplete } = seasonCounts(season);
                                const isActive = activeSeason === season;

                                return (
                                    <button
                                        key={season}
                                        onClick={() => setActiveSeason(season)}
                                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                                            isActive ? `${SEASON_ITEM_ACTIVE} font-medium` : SEASON_ITEM_IDLE
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <span>Season {season}</span>
                                            {isComplete && <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                        </span>
                                        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                            {watched}/{total}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Episodes panel */}
                    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Season {activeSeason}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                    {currentSeasonWatchedCount} of {currentSeasonEpisodes.length} watched
                                </p>
                            </div>

                            {isOwner && (
                                <Button
                                    size="sm"
                                    icon={isCurrentSeasonComplete ? undefined : FiCheck}
                                    onClick={() => handleToggleSeason(activeSeason)}
                                >
                                    {isCurrentSeasonComplete ? 'Unmark season' : 'Mark season watched'}
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                            <div className={`grid grid-cols-1 sm:grid-cols-2 ${
                                isSidebarOpen ? 'xl:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'
                            } gap-3`}>
                                {currentSeasonEpisodes.map((ep) => {
                                    const isWatched = watchedList.includes(ep.trackerId);
                                    const airDateFormatted = formatAirDate(ep.airdate);

                                    return (
                                        <button
                                            key={ep.trackerId}
                                            onClick={() => handleToggleEpisode(ep.trackerId)}
                                            disabled={!isOwner}
                                            aria-pressed={isWatched}
                                            className={`group flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                                                isOwner ? 'cursor-pointer' : 'cursor-default'
                                            } ${
                                                isWatched
                                                    ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/30 dark:bg-indigo-500/5'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                                                <Poster
                                                    src={ep.image?.medium || ep.image?.original}
                                                    fallbackSrc={series.imageUrl}
                                                    alt={ep.name || `Episode ${ep.number}`}
                                                    className={`absolute inset-0 w-full h-full ${isWatched ? 'opacity-60' : ''}`}
                                                />

                                                <div className="absolute top-1 left-1">
                                                    <Badge variant="overlay">E{ep.number}</Badge>
                                                </div>

                                                {isWatched ? (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-white/30">
                                                            <FiCheck className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                ) : isOwner ? (
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="w-7 h-7 rounded-full bg-black/55 backdrop-blur-md text-white/90 flex items-center justify-center ring-1 ring-white/20">
                                                            <FiCheck className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-medium truncate ${
                                                    isWatched
                                                        ? 'text-slate-500 dark:text-slate-400'
                                                        : 'text-slate-900 dark:text-slate-100'
                                                }`}>
                                                    {ep.name || `Episode ${ep.number}`}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                                                    {[ep.runtime && `${ep.runtime} min`, airDateFormatted].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default EpisodesModal;
