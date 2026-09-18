"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import AppShell from '../components/layout/AppShell';
import LoadingSpinner from '../components/LoadingSpinner';
import AiringScheduleView from '../components/profile/AiringScheduleView';
import EpisodesModal from '../components/EpisodesModal';
import PageHeader from '../components/ui/PageHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import Button from '../components/ui/Button';
import { FiCompass } from 'react-icons/fi';

const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'watching', label: 'Watching' },
    { value: 'plan-to-watch', label: 'Plan to watch' },
];

export default function SchedulePage() {
    const { user, loading: authLoading } = useAuth();
    const [trackingSeries, setTrackingSeries] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    // Fetch userSeries if user is logged in
    const userSeriesQuery = useMemo(() => {
        if (!user?.uid) return null;
        return query(collection(db, 'userSeries'), where('userId', '==', user.uid));
    }, [user?.uid]);
    const [userSeriesSnap, userLoading] = useCollection(userSeriesQuery);

    // Fetch global catalog
    const catalogQuery = useMemo(() => collection(db, 'series'), []);
    const [catalogSnap] = useCollection(catalogQuery);

    const allSeries = useMemo(() => {
        const catalogMap = new Map();
        if (catalogSnap?.docs) {
            catalogSnap.docs.forEach(docSnap => {
                const data = docSnap.data();
                catalogMap.set(docSnap.id, data);
            });
        }

        // If user has tracked series, prioritize showing the schedule for their collection
        if (userSeriesSnap?.docs && userSeriesSnap.docs.length > 0) {
            return userSeriesSnap.docs.map(userDoc => {
                const uData = userDoc.data();
                const cData = catalogMap.get(uData.seriesId) || {};

                return {
                    id: userDoc.id,
                    userSeriesId: userDoc.id,
                    seriesId: uData.seriesId,
                    title: cData.title || uData.title || 'Untitled',
                    imageUrl: cData.imageUrl || uData.imageUrl || '',
                    tvmazeId: cData.tvmazeId || uData.tvmazeId || '',
                    totalEpisodes: Number(cData.totalEpisodes ?? uData.totalEpisodes) || 0,
                    seasons: Number(cData.seasons ?? uData.seasons) || 1,
                    status: uData.status || 'plan-to-watch',
                    rating: Number(uData.rating) || 0,
                    watchedEpisodes: Number(uData.watchedEpisodes) || 0,
                    watchedEpisodesList: Array.isArray(uData.watchedEpisodesList) ? uData.watchedEpisodesList : [],
                    userId: uData.userId,
                    data: function() { return this; }
                };
            });
        }

        // Fallback for guests or empty collections: show upcoming schedule from catalog
        if (catalogSnap?.docs && catalogSnap.docs.length > 0) {
            return catalogSnap.docs.map(docSnap => {
                const cData = docSnap.data();
                return {
                    id: docSnap.id,
                    seriesId: docSnap.id,
                    title: cData.title || 'Untitled',
                    imageUrl: cData.imageUrl || '',
                    tvmazeId: cData.tvmazeId || '',
                    totalEpisodes: Number(cData.totalEpisodes) || 0,
                    seasons: Number(cData.seasons) || 1,
                    status: 'plan-to-watch',
                    rating: 0,
                    watchedEpisodes: 0,
                    watchedEpisodesList: [],
                    data: function() { return this; }
                };
            });
        }

        return [];
    }, [userSeriesSnap, catalogSnap]);

    const isLoading = authLoading || (userLoading && !userSeriesSnap);
    const hasCustomCollection = user && userSeriesSnap?.docs && userSeriesSnap.docs.length > 0;

    return (
        <AppShell activeTab="schedule">
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="space-y-8">
                    <PageHeader
                        title="Airing schedule"
                        description={hasCustomCollection
                            ? `Upcoming episodes for the ${allSeries.length} series you track`
                            : 'Upcoming episodes across the whole catalog'}
                        actions={
                            <>
                                {hasCustomCollection && (
                                    <SegmentedControl
                                        aria-label="Filter by status"
                                        options={FILTER_OPTIONS}
                                        value={filterStatus}
                                        onChange={setFilterStatus}
                                    />
                                )}
                                {!hasCustomCollection && (
                                    <Button variant="primary" href="/explore" icon={FiCompass}>
                                        Browse catalog
                                    </Button>
                                )}
                            </>
                        }
                    />

                    <AiringScheduleView
                        allSeries={allSeries}
                        filterStatus={hasCustomCollection ? filterStatus : 'all'}
                        onOpenTracker={(seriesData) => setTrackingSeries(seriesData)}
                    />
                </div>
            )}

            {trackingSeries && (
                <EpisodesModal
                    series={trackingSeries}
                    isOpen={!!trackingSeries}
                    onClose={() => setTrackingSeries(null)}
                    userId={user?.uid}
                    isOwner={!!hasCustomCollection}
                />
            )}
        </AppShell>
    );
}
