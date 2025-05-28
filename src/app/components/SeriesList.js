"use client";

import { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AddSeriesModal from './AddSeriesModal';
import EditSeriesModal from './EditSeriesModal';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiX } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

const SeriesList = ({ userId }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSeries, setEditingSeries] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        seasons: '',
        minEpisodesWatched: '',
        searchQuery: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Query all series for the user
    const q = query(collection(db, 'series'), where('userId', '==', userId));
    const [series, loading, error] = useCollection(q);

    // Filter series based on active filters
    const filteredSeries = series?.docs.filter(doc => {
        const data = doc.data();
        return (
            (filters.status === '' || data.status === filters.status) &&
            (filters.seasons === '' || data.seasons.toString() === filters.seasons) &&
            (filters.minEpisodesWatched === '' ||
                data.watchedEpisodes >= parseInt(filters.minEpisodesWatched)) &&
            (filters.searchQuery === '' ||
                data.title.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        );
    });

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this series?')) {
            await deleteDoc(doc(db, 'series', id));
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        await updateDoc(doc(db, 'series', id), { status: newStatus });
    };

    const handleWatchedEpisodesChange = async (id, newCount) => {
        await updateDoc(doc(db, 'series', id), { watchedEpisodes: parseInt(newCount) });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'watching': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'dropped': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'plan-to-watch': return 'Plan to Watch';
            case 'watching': return 'Watching';
            case 'completed': return 'Completed';
            case 'on-hold': return 'On Hold';
            case 'dropped': return 'Dropped';
            default: return status;
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            seasons: '',
            minEpisodesWatched: '',
            searchQuery: ''
        });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
                <p>Error loading series: {error.message}</p>
            </div>
        );
    }

    if (series?.empty) {
        return (
            <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your collection is empty
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Add your first series to get started
                </p>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Add Your First Series
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-grow max-w-md">
                    <input
                        type="text"
                        name="searchQuery"
                        value={filters.searchQuery}
                        onChange={handleFilterChange}
                        placeholder="Search series..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <svg
                        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>Add Series</span>
                    </button>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                    >
                        <FiFilter className="w-5 h-5" />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Filter Series</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={resetFilters}
                                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">All Statuses</option>
                                <option value="plan-to-watch">Plan to Watch</option>
                                <option value="watching">Watching</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                                <option value="dropped">Dropped</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Seasons</label>
                            <select
                                name="seasons"
                                value={filters.seasons}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">Any Seasons</option>
                                <option value="1">1 Season</option>
                                <option value="2">2 Seasons</option>
                                <option value="3">3 Seasons</option>
                                <option value="4">4+ Seasons</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Min Watched Episodes</label>
                            <input
                                type="number"
                                name="minEpisodesWatched"
                                value={filters.minEpisodesWatched}
                                onChange={handleFilterChange}
                                min="0"
                                placeholder="Any"
                                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            {filteredSeries && filteredSeries.length !== series?.docs.length && (
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredSeries.length} of {series?.docs.length} series
                </div>
            )}

            {/* Series Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSeries?.map((doc) => {
                    const data = doc.data();
                    const progress = Math.min(
                        Math.round((data.watchedEpisodes / data.totalEpisodes) * 100),
                        100
                    );

                    return (
                        <div
                            key={doc.id}
                            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                        >
                            {/* Series Image */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={data.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'}
                                    alt={data.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-xl font-bold text-white truncate">{data.title}</h3>
                                </div>
                            </div>

                            {/* Series Details */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {data.seasons} season{data.seasons !== 1 ? 's' : ''} • {data.totalEpisodes} episodes
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(data.status)}`}>
                    {getStatusLabel(data.status)}
                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">
                      {data.watchedEpisodes} / {data.totalEpisodes}
                    </span>
                                        <span className="text-gray-700 dark:text-gray-300">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                        <div
                                            className={`h-2 rounded-full ${
                                                progress < 30 ? 'bg-red-500' :
                                                    progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Episode Counter */}
                                <div className="flex items-center mb-4">
                                    <button
                                        onClick={() => {
                                            const newCount = Math.max(data.watchedEpisodes - 1, 0);
                                            handleWatchedEpisodesChange(doc.id, newCount);
                                        }}
                                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-l-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        disabled={data.watchedEpisodes <= 0}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={data.watchedEpisodes}
                                        onChange={(e) => handleWatchedEpisodesChange(doc.id, e.target.value)}
                                        min="0"
                                        max={data.totalEpisodes}
                                        className="w-16 text-center border-t border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <button
                                        onClick={() => {
                                            const newCount = Math.min(data.watchedEpisodes + 1, data.totalEpisodes);
                                            handleWatchedEpisodesChange(doc.id, newCount);
                                        }}
                                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                        disabled={data.watchedEpisodes >= data.totalEpisodes}
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Status Selector */}
                                <select
                                    value={data.status}
                                    onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                                    className="w-full mb-4 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="plan-to-watch">Plan to Watch</option>
                                    <option value="watching">Watching</option>
                                    <option value="completed">Completed</option>
                                    <option value="on-hold">On Hold</option>
                                    <option value="dropped">Dropped</option>
                                </select>

                                {/* Action Buttons */}
                                <div className="flex justify-between">
                                    <button
                                        onClick={() => setEditingSeries({ id: doc.id, ...data })}
                                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        <FiEdit2 className="w-4 h-4" />
                                        <span className="text-sm">Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                        <span className="text-sm">Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty Filter Results */}
            {filteredSeries?.length === 0 && (
                <div className="text-center py-12">
                    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                        No series match your filters
                    </h3>
                    <button
                        onClick={resetFilters}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Modals */}
            <AddSeriesModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                userId={userId}
            />

            {editingSeries && (
                <EditSeriesModal
                    series={editingSeries}
                    onClose={() => setEditingSeries(null)}
                />
            )}
        </>
    );
};

export default SeriesList;