"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
    FiLoader, 
    FiCheck, 
    FiX, 
    FiCheckCircle, 
    FiSidebar 
} from 'react-icons/fi';

const EpisodesModal = ({ series, onClose, isOwner }) => {
    const [episodesBySeason, setEpisodesBySeason] = useState({});
    const [activeSeason, setActiveSeason] = useState('1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [watchedList, setWatchedList] = useState(series.watchedEpisodesList || []);

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

        const isWatched = watchedList.includes(episodeTrackerId);
        const newList = isWatched 
            ? watchedList.filter(id => id !== episodeTrackerId) 
            : [...watchedList, episodeTrackerId];
            
        setWatchedList(newList);

        try {
            await updateDoc(doc(db, 'series', series.id), { 
                watchedEpisodesList: newList,
                watchedEpisodes: newList.length,
                status: newList.length === series.totalEpisodes && series.totalEpisodes > 0 ? 'completed' : series.status
            });
        } catch (err) {
            console.error("Error updating watched episodes: ", err);
        }
    };

    const handleToggleSeason = async (seasonNumber) => {
        if (!isOwner) return;
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
            await updateDoc(doc(db, 'series', series.id), {
                watchedEpisodesList: newList,
                watchedEpisodes: newList.length,
                status: newList.length === series.totalEpisodes && series.totalEpisodes > 0 ? 'completed' : series.status
            });
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

                                {/* Episodes Grid (Expands to 4 cols when sidebar is collapsed) */}
                                <div className="flex-grow overflow-y-auto p-3 sm:p-5">
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${
                                        isSidebarOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
                                    }`}>
                                        {currentSeasonEpisodes.map((ep) => {
                                            const isWatched = watchedList.includes(ep.trackerId);
                                            return (
                                                <button
                                                    key={ep.trackerId}
                                                    onClick={() => handleToggleEpisode(ep.trackerId)}
                                                    disabled={!isOwner}
                                                    className={`group flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 ${
                                                        isWatched 
                                                            ? 'border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/30 dark:border-indigo-800/60 shadow-sm' 
                                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${
                                                            isWatched 
                                                                ? 'bg-indigo-600 text-white' 
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                                                        }`}>
                                                            E{ep.number}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className={`text-xs sm:text-sm font-medium truncate ${
                                                                isWatched 
                                                                    ? 'text-slate-900 dark:text-slate-100 font-semibold' 
                                                                    : 'text-slate-700 dark:text-slate-300'
                                                            }`}>
                                                                {ep.name || `Episode ${ep.number}`}
                                                            </p>
                                                            {ep.runtime && (
                                                                <p className="text-[11px] text-slate-400">
                                                                    {ep.runtime} min
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                                        isWatched 
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/30' 
                                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600'
                                                    }`}>
                                                        <FiCheck className="w-3.5 h-3.5" />
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