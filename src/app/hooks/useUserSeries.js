"use client";

import { useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * A user's tracked series merged with the shared catalog, in the same shape
 * the collection page uses.
 */
export default function useUserSeries(userId) {
    const userSeriesQuery = useMemo(() => {
        if (!userId) return null;
        return query(collection(db, 'userSeries'), where('userId', '==', userId));
    }, [userId]);
    const [userSeriesSnap, userLoading, userError] = useCollection(userSeriesQuery);

    const catalogQuery = useMemo(() => collection(db, 'series'), []);
    const [catalogSnap, catalogLoading, catalogError] = useCollection(catalogQuery);

    const allSeries = useMemo(() => {
        if (!userSeriesSnap?.docs) return [];

        const catalogMap = new Map();
        catalogSnap?.docs.forEach(docSnap => catalogMap.set(docSnap.id, docSnap.data()));

        return userSeriesSnap.docs.map(userDoc => {
            const uData = userDoc.data();
            const cData = catalogMap.get(uData.seriesId) || {};

            return {
                id: userDoc.id,
                userSeriesId: userDoc.id,
                seriesId: uData.seriesId,
                title: cData.title || uData.title || 'Untitled',
                imageUrl: cData.imageUrl || uData.imageUrl || '',
                imdbId: cData.imdbId || uData.imdbId || '',
                tvmazeId: cData.tvmazeId || uData.tvmazeId || '',
                totalEpisodes: Number(cData.totalEpisodes ?? uData.totalEpisodes) || 0,
                seasons: Number(cData.seasons ?? uData.seasons) || 1,
                status: uData.status || 'plan-to-watch',
                rating: Number(uData.rating) || 0,
                watchedEpisodes: Number(uData.watchedEpisodes) || 0,
                watchedEpisodesList: Array.isArray(uData.watchedEpisodesList) ? uData.watchedEpisodesList : [],
                network: cData.network || uData.network || '',
                webChannel: cData.webChannel || uData.webChannel || '',
                streamingService: cData.streamingService || uData.streamingService || '',
                userId: uData.userId,
                data: function() { return this; }
            };
        });
    }, [userSeriesSnap, catalogSnap]);

    return {
        allSeries,
        loading: (userLoading && !userSeriesSnap) || (catalogLoading && !catalogSnap),
        error: userError || catalogError,
    };
}
