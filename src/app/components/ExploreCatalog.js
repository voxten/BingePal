"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AddSeriesModal from './AddSeriesModal';
import { FiCompass } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import Toast from './ui/Toast';
import DiscoverCard from './series/DiscoverCard';
import ExploreToolbar from './explore/ExploreToolbar';
import ExploreOnlineResults from './explore/ExploreOnlineResults';

export default function ExploreCatalog() {
    const { user } = useAuth();
    const searchInputRef = useRef(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [cardLayout, setCardLayout] = useState('vertical');
    const [sortBy, setSortBy] = useState('title');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Status picker state per card
    const [addingSeriesId, setAddingSeriesId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('plan-to-watch');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastState, setToastState] = useState({ message: '', variant: 'success' });

    // TVMaze external live search
    const [isExternalSearching, setIsExternalSearching] = useState(false);
    const [externalResults, setExternalResults] = useState([]);
    const [searchOnlineEnabled, setSearchOnlineEnabled] = useState(true);

    // 1. Subscribe to Global Catalog 'series'
    const catalogQuery = useMemo(() => collection(db, 'series'), []);
    const [catalogSnap, catalogLoading, catalogError] = useCollection(catalogQuery);

    // 2. Subscribe to current user's tracked series 'userSeries'
    const userSeriesQuery = useMemo(() => {
        if (!user?.uid) return null;
        return query(collection(db, 'userSeries'), where('userId', '==', user.uid));
    }, [user?.uid]);
    const [userSeriesSnap, userLoading] = useCollection(userSeriesQuery);

    // Build set of already tracked series IDs for the user
    const userTrackedIds = useMemo(() => {
        const set = new Set();
        if (userSeriesSnap?.docs) {
            userSeriesSnap.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.seriesId) set.add(data.seriesId);
                if (data.tvmazeId) set.add(`tv_${data.tvmazeId}`);
                if (data.imdbId) set.add(`imdb_${data.imdbId}`);
            });
        }
        return set;
    }, [userSeriesSnap]);

    // Untracked series in local catalog (NEVER show shows user already has!)
    const untrackedCatalog = useMemo(() => {
        if (!catalogSnap?.docs) return [];
        return catalogSnap.docs
            .map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }))
            .filter(item => {
                if (userTrackedIds.has(item.id)) return false;
                if (item.tvmazeId && userTrackedIds.has(`tv_${item.tvmazeId}`)) return false;
                if (item.imdbId && userTrackedIds.has(`imdb_${item.imdbId}`)) return false;
                return true;
            });
    }, [catalogSnap, userTrackedIds]);

    // Filter and sort local untracked catalog
    const filteredCatalog = useMemo(() => {
        return untrackedCatalog
            .filter(item => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase().trim();
                const titleMatch = (item.title || '').toLowerCase().includes(q);
                const imdbMatch = (item.imdbId || '').toLowerCase().includes(q);
                const tvmazeMatch = (item.tvmazeId || '').toString().includes(q);
                return titleMatch || imdbMatch || tvmazeMatch;
            })
            .sort((a, b) => {
                if (sortBy === 'title') {
                    return (a.title || '').localeCompare(b.title || '');
                }
                if (sortBy === 'episodes') {
                    return (b.totalEpisodes || 0) - (a.totalEpisodes || 0);
                }
                if (sortBy === 'seasons') {
                    return (b.seasons || 1) - (a.seasons || 1);
                }
                if (sortBy === 'recent') {
                    return (b.updatedAt || 0) - (a.updatedAt || 0);
                }
                return 0;
            });
    }, [untrackedCatalog, searchQuery, sortBy]);

    // Automatic debounced TVMaze search when typing
    useEffect(() => {
        if (!searchOnlineEnabled || !searchQuery.trim() || searchQuery.trim().length < 2) {
            setExternalResults([]);
            setIsExternalSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsExternalSearching(true);
            try {
                const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(searchQuery.trim())}`);
                if (!res.ok) throw new Error('TVMaze API error');
                const data = await res.json();

                const existingCatalogTvIds = new Set(untrackedCatalog.map(s => s.tvmazeId?.toString()));

                const newShows = data
                    .map(item => item.show)
                    .filter(show => {
                        const tvId = show.id.toString();
                        if (existingCatalogTvIds.has(tvId)) return false;
                        if (userTrackedIds.has(`tv_${tvId}`)) return false;
                        return true;
                    });

                setExternalResults(newShows);
            } catch (err) {
                console.warn('TVMaze live search error:', err);
                setExternalResults([]);
            } finally {
                setIsExternalSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery, searchOnlineEnabled, untrackedCatalog, userTrackedIds]);

    // Add local catalog series to user's list
    const handleAddCatalogSeriesToUser = async (seriesItem, status = 'plan-to-watch') => {
        if (!user) {
            setToastState({ message: 'Please sign in to add series to your watchlist.', variant: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            const userSeriesDocId = `${user.uid}_${seriesItem.id}`;
            const userSeriesData = {
                userId: user.uid,
                seriesId: seriesItem.id,
                status: status,
                rating: 0,
                watchedEpisodes: 0,
                watchedEpisodesList: [],
                updatedAt: Date.now()
            };

            await setDoc(doc(db, 'userSeries', userSeriesDocId), userSeriesData, { merge: true });
            
            setAddingSeriesId(null);
            setToastState({ message: `Added "${seriesItem.title}" to your list!`, variant: 'success' });
        } catch (err) {
            console.error('Error adding series to watchlist:', err);
            setToastState({ message: 'Failed to add series. Please try again.', variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Import external show from TVMaze into 'series' + 'userSeries'
    const handleImportFromTVMaze = async (show, status = 'plan-to-watch') => {
        setIsSubmitting(true);
        try {
            let totalEps = 0;
            let seasonsCount = 1;
            try {
                const epRes = await fetch(`https://api.tvmaze.com/shows/${show.id}/episodes`);
                if (epRes.ok) {
                    const epData = await epRes.json();
                    totalEps = epData.length;
                    seasonsCount = epData.length > 0 ? Math.max(...epData.map(e => e.season || 1)) : 1;
                }
            } catch (epErr) {
                console.warn('Could not fetch episode count from TVMaze:', epErr);
            }

            const canonicalId = `tv_${show.id}`;
            const catalogData = {
                title: show.name || 'Untitled Show',
                imageUrl: show.image?.original || show.image?.medium || '',
                imdbId: show.externals?.imdb || '',
                tvmazeId: show.id.toString(),
                totalEpisodes: totalEps,
                seasons: seasonsCount,
                updatedAt: Date.now()
            };

            // 1. Save to shared 'series' catalog
            await setDoc(doc(db, 'series', canonicalId), catalogData, { merge: true });

            // 2. Save to user's personal 'userSeries'
            if (user?.uid) {
                const userSeriesDocId = `${user.uid}_${canonicalId}`;
                const userSeriesData = {
                    userId: user.uid,
                    seriesId: canonicalId,
                    status: status,
                    rating: 0,
                    watchedEpisodes: 0,
                    watchedEpisodesList: [],
                    updatedAt: Date.now()
                };
                await setDoc(doc(db, 'userSeries', userSeriesDocId), userSeriesData, { merge: true });
            }

            setExternalResults(prev => prev.filter(s => s.id !== show.id));
            setAddingSeriesId(null);
            setToastState({ message: `Imported and added "${show.name}" to your collection!`, variant: 'success' });
        } catch (err) {
            console.error('Error importing show from TVMaze:', err);
            setToastState({ message: 'Failed to import show. Please try again.', variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isInitialLoading = catalogLoading || (user && userLoading);

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Reusable Toast Notification */}
            <Toast
                message={toastState.message}
                variant={toastState.variant}
                onClose={() => setToastState({ message: '', variant: 'success' })}
            />

            {/* Modular Explore Toolbar */}
            <ExploreToolbar
                searchInputRef={searchInputRef}
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onClearSearch={() => { setSearchQuery(''); setExternalResults([]); }}
                isExternalSearching={isExternalSearching}
                searchOnlineEnabled={searchOnlineEnabled}
                onToggleOnlineSearch={() => setSearchOnlineEnabled(!searchOnlineEnabled)}
                cardLayout={cardLayout}
                onSetCardLayout={setCardLayout}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onOpenAddModal={() => setIsAddModalOpen(true)}
            />

            {/* Results Count Header */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
                <div>
                    Discovering <span className="font-bold text-slate-800 dark:text-slate-200">{filteredCatalog.length + externalResults.length}</span> new series
                </div>
                {user && (
                    <div className="text-[11px] text-slate-400">
                        (Showing only series not in your collection)
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            {isInitialLoading ? (
                <div className="py-20">
                    <LoadingSpinner />
                </div>
            ) : catalogError ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-2xl text-sm font-medium">
                    Error loading series catalog: {catalogError.message}
                </div>
            ) : (
                <div className="space-y-8">
                    
                    {/* 1. Catalog Series Grid (Untracked shows in BingePal) */}
                    <div>
                        {filteredCatalog.length === 0 && externalResults.length === 0 ? (
                            <div className="text-center py-20 px-4 bg-white dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                                    <FiCompass className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                                    {searchQuery ? `No series found matching "${searchQuery}"` : "You've added all available catalog series!"}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                    {searchQuery 
                                        ? "Try a different search term or add a custom series manually." 
                                        : "Search above to find any show online via TVMaze or click 'Add Custom' to add any new title."}
                                </p>
                            </div>
                        ) : (
                            <div className={
                                cardLayout === 'vertical'
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
                                    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
                            }>
                                {filteredCatalog.map((item) => (
                                    <DiscoverCard
                                        key={item.id}
                                        item={item}
                                        type="catalog"
                                        cardLayout={cardLayout}
                                        isAdding={addingSeriesId === item.id}
                                        selectedStatus={selectedStatus}
                                        isSubmitting={isSubmitting}
                                        onStartAdding={() => {
                                            setAddingSeriesId(item.id);
                                            setSelectedStatus('plan-to-watch');
                                        }}
                                        onCancelAdding={() => setAddingSeriesId(null)}
                                        onSelectStatus={setSelectedStatus}
                                        onConfirmAdd={() => handleAddCatalogSeriesToUser(item, selectedStatus)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. TVMaze Online Results Grid (when searching online) */}
                    <ExploreOnlineResults
                        results={externalResults}
                        cardLayout={cardLayout}
                        addingSeriesId={addingSeriesId}
                        selectedStatus={selectedStatus}
                        isSubmitting={isSubmitting}
                        onStartAdding={(id) => {
                            setAddingSeriesId(id);
                            setSelectedStatus('plan-to-watch');
                        }}
                        onCancelAdding={() => setAddingSeriesId(null)}
                        onSelectStatus={setSelectedStatus}
                        onImport={handleImportFromTVMaze}
                    />

                </div>
            )}

            {/* Add Custom Series Modal */}
            <AddSeriesModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                userId={user?.uid}
            />
        </div>
    );
}
