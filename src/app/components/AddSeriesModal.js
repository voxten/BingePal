"use client";

import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { FiDownload, FiLoader, FiAlertCircle } from 'react-icons/fi';

const AddSeriesModal = ({ isOpen, onClose, userId }) => {
    const [imdbInput, setImdbInput] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState('');

    // Primary form states
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        seasons: 1,
        totalEpisodes: 0,
        watchedEpisodes: 0,
        status: 'plan-to-watch',
        rating: 0
    });

    const handleFetchImdbData = async () => {
        if (!imdbInput.trim()) return;

        setIsFetching(true);
        setFetchError('');

        try {
            const res = await fetch(`/api/fetch-series?query=${encodeURIComponent(imdbInput.trim())}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong fetching info.');
            }

            // Autofill the modal input state elements
            setFormData(prev => ({
                ...prev,
                title: data.title,
                imageUrl: data.imageUrl,
                seasons: parseInt(data.seasons) || 1,
                totalEpisodes: parseInt(data.totalEpisodes) || 0
            }));

            setImdbInput(''); // Clear the import bar on success
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setIsFetching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add New Series</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">✕</button>
                </div>

                <div className="p-5 overflow-y-auto space-y-5 flex-grow">
                    {/* IMDb Import Section */}
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                        <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                            Autofill via IMDb Link / ID
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Paste https://www.imdb.com/title/tt... or just ID"
                                value={imdbInput}
                                onChange={(e) => setImdbInput(e.target.value)}
                                disabled={isFetching}
                                className="flex-grow px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
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

                    {/* Standard Form Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Series Title (English)</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Total Seasons</label>
                                <input
                                    type="number"
                                    value={formData.seasons}
                                    onChange={(e) => setFormData({...formData, seasons: parseInt(e.target.value) || 0})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Total Episodes</label>
                                <input
                                    type="number"
                                    value={formData.totalEpisodes}
                                    onChange={(e) => setFormData({...formData, totalEpisodes: parseInt(e.target.value) || 0})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Poster Image URL</label>
                            <div className="flex gap-3 items-center">
                                {formData.imageUrl && (
                                    <img src={formData.imageUrl} alt="Preview" className="w-12 h-16 object-cover rounded-lg border dark:border-slate-700 bg-slate-100" />
                                )}
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                                    className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-medium dark:border-slate-700 dark:text-slate-300">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            await addDoc(collection(db, 'series'), { ...formData, userId });
                            onClose();
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium"
                    >
                        Save Series
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSeriesModal;