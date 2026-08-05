"use client";

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { FiLoader, FiCheck, FiX } from 'react-icons/fi';

const EpisodesModal = ({ series, onClose, isOwner }) => {
    const [episodesBySeason, setEpisodesBySeason] = useState({});
    const [activeSeason, setActiveSeason] = useState('1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Używamy tablicy obejrzanych odcinków
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
                
                // ZMIANA: Przypisujemy prosty numer sekwencyjny od 1 do totalEpisodes (np. 1, 2, 3, 4...)
                const dataWithSimpleIds = rawData.map((ep, index) => ({
                    ...ep,
                    trackerId: index + 1 // To jest nasz prosty ID: 1, 2, 3...
                }));
                
                // Grupowanie odcinków po numerze sezonu
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

        // Sprawdzamy czy ten prosty ID (np. 12) jest już w obejrzanych
        const isWatched = watchedList.includes(episodeTrackerId);
        const newList = isWatched 
            ? watchedList.filter(id => id !== episodeTrackerId) 
            : [...watchedList, episodeTrackerId];
            
        setWatchedList(newList);

        // Zapis do bazy: aktualizujemy listę prostych ID ORAZ łączną liczbę (dla paska postępu)
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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[85vh]">
                
                {/* Header */}
                <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{series.title}</h2>
                        <p className="text-xs font-medium text-slate-500">Track your episodes</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-grow flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-indigo-500">
                            <FiLoader className="w-8 h-8 animate-spin mb-4" />
                            <p className="text-sm font-medium">Loading episodes map...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-grow flex items-center justify-center p-6 text-center text-rose-500">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Season Tabs */}
                            <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-800 p-2 gap-2 bg-white dark:bg-slate-900">
                                {Object.keys(episodesBySeason).map(season => (
                                    <button
                                        key={season}
                                        onClick={() => setActiveSeason(season)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                                            activeSeason === season 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Season {season}
                                    </button>
                                ))}
                            </div>

                            {/* Episodes Grid */}
                            <div className="flex-grow overflow-y-auto p-4 md:p-5 bg-slate-50/50 dark:bg-slate-900">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {episodesBySeason[activeSeason]?.map((ep) => {
                                        // ZMIANA: używamy ep.trackerId (np. 1, 2, 3...) do logiki zaznaczania
                                        const isWatched = watchedList.includes(ep.trackerId);
                                        return (
                                            <button
                                                key={ep.trackerId}
                                                onClick={() => handleToggleEpisode(ep.trackerId)}
                                                disabled={!isOwner}
                                                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 group ${
                                                    isWatched 
                                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' 
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                }`}
                                                title={ep.name}
                                            >
                                                <span className={`text-xs font-bold mb-1 ${isWatched ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    EP {ep.number}
                                                </span>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isWatched ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-600'}`}>
                                                    <FiCheck className="w-3.5 h-3.5" />
                                                </div>
                                            </button>
                                        );
                                    })}
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