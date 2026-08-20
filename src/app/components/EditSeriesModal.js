"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FiX, FiDownload, FiLoader, FiAlertCircle, FiStar } from 'react-icons/fi';

const EditSeriesModal = ({ series, onClose }) => {
    const [imdbInput, setImdbInput] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        seasons: 1,
        totalEpisodes: 1,
        watchedEpisodes: 0,
        status: 'plan-to-watch',
        rating: 0,
        imdbId: '',
        tvmazeId: ''
    });

    useEffect(() => {
        if (series) {
            setFormData({
                title: series.title || '',
                imageUrl: series.imageUrl || '',
                seasons: series.seasons || 1,
                totalEpisodes: series.totalEpisodes || 1,
                watchedEpisodes: series.watchedEpisodes || 0,
                status: series.status || 'plan-to-watch',
                rating: series.rating || 0,
                imdbId: series.imdbId || '',
                tvmazeId: series.tvmazeId || ''
            });
            setImdbInput(series.imdbId || '');
        }
    }, [series]);

    const handleFetchImdbData = async () => {
        if (!imdbInput.trim()) return;

        setIsFetching(true);
        setFetchError('');

        try {
            const match = imdbInput.trim().match(/tt\d+/);
            if (!match) {
                throw new Error('Invalid IMDb ID or URL format');
            }
            const imdbId = match[0];

            const lookupResponse = await fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`, {
                headers: { 'Accept': 'application/json' }
            });

            if (!lookupResponse.ok) {
                if (lookupResponse.status === 404) {
                    throw new Error('Series not found in databases.');
                }
                throw new Error('Metadata server rejected request.');
            }

            const showData = await lookupResponse.json();
            const showId = showData.id;

            const episodesResponse = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
            let seasonsCount = 1;
            let totalEpisodes = 0;

            if (episodesResponse.ok) {
                const episodes = await episodesResponse.json();
                totalEpisodes = episodes.length;

                const seasonNumbers = episodes.map(ep => ep.season).filter(Boolean);
                if (seasonNumbers.length > 0) {
                    seasonsCount = Math.max(...seasonNumbers);
                }
            }

            setFormData(prev => {
                const safeWatchedEpisodes = prev.watchedEpisodes > totalEpisodes ? totalEpisodes : prev.watchedEpisodes;

                return {
                    ...prev,
                    title: showData.name || prev.title,
                    imageUrl: showData.image?.original || showData.image?.medium || prev.imageUrl,
                    seasons: parseInt(seasonsCount) || prev.seasons,
                    totalEpisodes: parseInt(totalEpisodes) || prev.totalEpisodes,
                    watchedEpisodes: safeWatchedEpisodes,
                    imdbId: imdbId,
                    tvmazeId: showId
                };
            });

        } catch (err) {
            setFetchError(err.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const seriesDocId = series.seriesId || series.id;
            const userSeriesDocId = series.userSeriesId || series.id;

            // 1. Update shared catalog document in 'series'
            const catalogData = {
                title: formData.title,
                imageUrl: formData.imageUrl,
                seasons: formData.seasons,
                totalEpisodes: formData.totalEpisodes,
                imdbId: formData.imdbId || '',
                tvmazeId: formData.tvmazeId ? formData.tvmazeId.toString() : '',
                updatedAt: Date.now()
            };
            if (seriesDocId) {
                await setDoc(doc(db, 'series', seriesDocId), catalogData, { merge: true });
            }

            // 2. Update user's tracking state in 'userSeries'
            const userSeriesData = {
                status: formData.status,
                rating: formData.rating,
                watchedEpisodes: formData.watchedEpisodes,
                updatedAt: Date.now()
            };
            if (userSeriesDocId) {
                await updateDoc(doc(db, 'userSeries', userSeriesDocId), userSeriesData);
            }

            onClose();
        } catch (error) {
            console.error('Error updating document: ', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'seasons' || name === 'totalEpisodes' || name === 'watchedEpisodes'
                ? parseInt(value) || 0
                : value
        }));
    };

    if (!series) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Series</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-5 flex-grow">
                    
                    {/* IMDb Sync Section */}
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                        <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                            Update Metadata via IMDb
                        </label>
                        <p className="text-xs text-indigo-500/80 dark:text-indigo-300/70 mb-3">
                            Fetch will update poster, title, and episode counts. Your progress and rating will be kept safe.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="IMDb Link or ID (e.g. tt0903747)"
                                value={imdbInput}
                                onChange={(e) => setImdbInput(e.target.value)}
                                disabled={isFetching}
                                className="flex-grow px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                            />
                            <button
                                type="button"
                                onClick={handleFetchImdbData}
                                disabled={isFetching || !imdbInput}
                                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-98"
                            >
                                {isFetching ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiDownload className="w-3.5 h-3.5" />}
                                <span>{isFetching ? 'Fetching...' : 'Fetch'}</span>
                            </button>
                        </div>
                        {fetchError && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                                <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{fetchError}</span>
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Series Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Poster Image URL</label>
                            <div className="flex gap-3 items-center">
                                {formData.imageUrl && (
                                    <img src={formData.imageUrl} alt="Preview" className="w-12 h-16 object-cover rounded-lg border dark:border-slate-700 bg-slate-100 shrink-0" />
                                )}
                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    className="flex-grow w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Seasons</label>
                                <input
                                    type="number"
                                    name="seasons"
                                    value={formData.seasons}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Total Episodes</label>
                                <input
                                    type="number"
                                    name="totalEpisodes"
                                    value={formData.totalEpisodes}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Watched Episodes</label>
                                <input
                                    type="number"
                                    name="watchedEpisodes"
                                    value={formData.watchedEpisodes}
                                    onChange={handleChange}
                                    min="0"
                                    max={formData.totalEpisodes}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="plan-to-watch">Plan to Watch</option>
                                    <option value="watching">Watching</option>
                                    <option value="completed">Completed</option>
                                    <option value="on-hold">On Hold</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                        className="focus:outline-none transition-transform active:scale-125 p-1"
                                    >
                                        <FiStar className={`w-6 h-6 ${star <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-medium dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-form"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSeriesModal;