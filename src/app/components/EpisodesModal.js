"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { recordWatchedEpisode } from '../services/recentWatchedService';
import { 
    FiLoader, 
    FiCheck, 
    FiX, 
    FiCheckCircle, 
    FiSidebar,
    FiTv,
    FiClock
} from 'react-icons/fi';

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

const EpisodesModal = ({ series, onClose, isOwner }) => {
    const { user } = useAuth();
    const [episodesBySeason, setEpisodesBySeason] = useState({});
    const [activeSeason, setActiveSeason] = useState('1');
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
                    setActiveSeason(Object.keys(grouped)[0]);
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
                        imageUrl: targetEp.image?.medium || targetEp.image?.original || series.imageUrl,
                        episodeNumber: episodeTrackerId,
                        seasonNumber: targetEp.season,
                        episodeInSeason: targetEp.number,
                        episodeTitle: targetEp.name,
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
                    imageUrl: lastEp.image?.medium || lastEp.image?.original || series.imageUrl,
                    episodeNumber: lastEp.trackerId,
                    seasonNumber: lastEp.season,
                    episodeInSeason: lastEp.number,
                    episodeTitle: lastEp.name,
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

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden flex flex-col h-[90vh] sm:h-[85vh]">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {/* The single icon in the left corner controlling collapse/extend */}
                            <button
                                onClick={() => setIsSidebarOpen(prev => !prev)}
                                aria-label="Toggle Seasons Panel"
                                title="Toggle Seasons Panel"
                                className={`hidden md:flex p-2 rounded-xl transition-colors ${
                                    isSidebarOpen 
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' 
                                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <FiSidebar className="w-5 h-5" />
                            </button>

                            <div className="pr-4">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 truncate max-w-[220px] sm:max-w-md">
                                    {series.title}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                        {watchedList.length} of {totalEpisodesCount || series.totalEpisodes || 0} watched
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                    <span className="text-xs text-slate-500 font-medium">
                                        {overallProgressPercent}% complete
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={onClose} 
                            aria-label="Close modal"
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-indigo-600 h-full transition-all ease-out rounded-full"
                            style={{ width: `${overallProgressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Body Area */}
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
                    {loading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-indigo-500 gap-3">
                            <FiLoader className="w-8 h-8 animate-spin" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading episodes map...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-grow flex items-center justify-center p-6 text-center text-rose-500">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Season Bar (Pill Selector) */}
                            <div className="md:hidden flex items-center gap-1.5 p-2.5 overflow-x-auto border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 no-scrollbar">
                                {seasons.map(season => {
                                    const seasonEps = episodesBySeason[season] || [];
                                    const watched = seasonEps.filter(ep => watchedList.includes(ep.trackerId)).length;
                                    const isComplete = seasonEps.length > 0 && watched === seasonEps.length;
                                    const isActive = activeSeason === season;

                                    return (
                                        <button
                                            key={season}
                                            onClick={() => setActiveSeason(season)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                                isActive 
                                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25' 
                                                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60'
                                            }`}
                                        >
                                            <span>Season {season}</span>
                                            {isComplete && <FiCheck className="w-3 h-3 text-emerald-400" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Extractable Desktop Seasons Sidebar */}
                            <div className={`hidden md:flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-all ease-in-out shrink-0 overflow-hidden ${
                                isSidebarOpen 
                                    ? 'w-60 opacity-100 p-3' 
                                    : 'w-0 opacity-0 p-0 border-none pointer-events-none'
                            }`}>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1 mb-1">
                                    Seasons
                                </span>

                                <div className="space-y-1 overflow-y-auto flex-grow">
                                    {seasons.map(season => {
                                        const seasonEps = episodesBySeason[season] || [];
                                        const watched = seasonEps.filter(ep => watchedList.includes(ep.trackerId)).length;
                                        const isComplete = seasonEps.length > 0 && watched === seasonEps.length;
                                        const isActive = activeSeason === season;

                                        return (
                                            <button
                                                key={season}
                                                onClick={() => setActiveSeason(season)}
                                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                                                    isActive 
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <span>Season {season}</span>
                                                    {isComplete && (
                                                        <FiCheckCircle className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                                                    )}
                                                </div>
                                                <span className={`text-[11px] font-medium ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                    {watched}/{seasonEps.length}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Episodes Content Panel */}
                            <div className="flex-grow flex flex-col overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
                                
                                {/* Season Toolbar */}
                                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Season {activeSeason}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {currentSeasonWatchedCount} of {currentSeasonEpisodes.length} episodes watched
                                        </p>
                                    </div>

                                    {isOwner && (
                                        <button
                                            onClick={() => handleToggleSeason(activeSeason)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                                isCurrentSeasonComplete
                                                    ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    : 'border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                            }`}
                                        >
                                            {isCurrentSeasonComplete ? 'Unmark Season' : 'Mark Season Watched'}
                                        </button>
                                    )}
                                </div>

                                {/* Episodes Grid */}
                                <div className="flex-grow overflow-y-auto p-3 sm:p-5">
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${
                                        isSidebarOpen ? 'xl:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'
                                    } gap-3`}>
                                        {currentSeasonEpisodes.map((ep) => {
                                            const isWatched = watchedList.includes(ep.trackerId);
                                            const epImage = ep.image?.medium || ep.image?.original || series.imageUrl;
                                            const airDateFormatted = formatAirDate(ep.airdate);

                                            return (
                                                <button
                                                    key={ep.trackerId}
                                                    onClick={() => handleToggleEpisode(ep.trackerId)}
                                                    disabled={!isOwner}
                                                    className={`group relative flex items-center p-2.5 sm:p-3 rounded-2xl border text-left transition-all duration-200 gap-3.5 ${
                                                        isWatched 
                                                            ? 'border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/30 dark:border-indigo-800/60 shadow-sm' 
                                                            : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md'
                                                    }`}
                                                >
                                                    {/* 16:9 Episode Thumbnail with Badge & Checkmark Overlay */}
                                                    <div className="relative w-24 sm:w-28 h-14 sm:h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200/60 dark:border-slate-800/80 shadow-xs">
                                                        {epImage ? (
                                                            <img
                                                                src={epImage}
                                                                alt={ep.name || `Episode ${ep.number}`}
                                                                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                                                    isWatched ? 'opacity-70 contrast-105' : 'opacity-90 group-hover:opacity-100'
                                                                }`}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-slate-900 flex items-center justify-center text-slate-500">
                                                                <FiTv className="w-5 h-5 opacity-40" />
                                                            </div>
                                                        )}

                                                        {/* Episode number badge overlay on thumbnail */}
                                                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white font-mono leading-none border border-white/10 shadow-xs">
                                                            E{ep.number}
                                                        </div>

                                                        {/* Single Unified Checkmark: Visible when watched, subtle hint on hover when not watched */}
                                                        {isWatched ? (
                                                            <div className="absolute inset-0 bg-indigo-950/50 backdrop-blur-[1px] flex items-center justify-center">
                                                                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 border border-white/20">
                                                                    <FiCheck className="w-4 h-4 stroke-[3]" />
                                                                </div>
                                                            </div>
                                                        ) : isOwner ? (
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-xs text-white/90 flex items-center justify-center border border-white/20">
                                                                    <FiCheck className="w-4 h-4 stroke-[2]" />
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    {/* Episode Text Meta */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-xs sm:text-sm font-bold truncate ${
                                                            isWatched 
                                                                ? 'text-indigo-950 dark:text-indigo-200' 
                                                                : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'
                                                        }`}>
                                                            {ep.name || `Episode ${ep.number}`}
                                                        </p>
                                                        
                                                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                                                            {ep.runtime && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <FiClock className="w-3 h-3 text-slate-400" />
                                                                    {ep.runtime} min
                                                                </span>
                                                            )}
                                                            {ep.runtime && airDateFormatted && (
                                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                            )}
                                                            {airDateFormatted && (
                                                                <span>{airDateFormatted}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EpisodesModal;