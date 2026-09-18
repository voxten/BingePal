"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import AppShell from '../layout/AppShell';
import LoadingSpinner from '../LoadingSpinner';
import UserProfileStats from './UserProfileStats';
import TierAvatar from './TierAvatar';
import TierLadderModal from './TierLadderModal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import useBingeStats from '../../hooks/useBingeStats';
import { getLevelInfo, getTier, saveViewerLevel, readViewerLevel } from '../../services/viewerLevelService';
import {
    FiShare2,
    FiCheck,
    FiAward
} from 'react-icons/fi';

export default function UserProfileView({ profileId }) {
    const { user, loading: authLoading } = useAuth();
    const [copied, setCopied] = useState(false);

    const isOwner = user?.uid === profileId;

    // Fetch userSeries to power binge stats
    const userSeriesQuery = useMemo(() => {
        if (!profileId) return null;
        return query(collection(db, 'userSeries'), where('userId', '==', profileId));
    }, [profileId]);
    const [userSeriesSnap, userLoading] = useCollection(userSeriesQuery);

    // Fetch shared series catalog
    const catalogQuery = useMemo(() => collection(db, 'series'), []);
    const [catalogSnap] = useCollection(catalogQuery);

    const allSeries = useMemo(() => {
        if (!userSeriesSnap?.docs) return [];
        const catalogMap = new Map();
        if (catalogSnap?.docs) {
            catalogSnap.docs.forEach(docSnap => {
                const data = docSnap.data();
                catalogMap.set(docSnap.id, data);
            });
        }

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
    }, [userSeriesSnap, catalogSnap]);

    const handleCopyShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/profile/${profileId}`;
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy share link:', err);
        }
    };

    const isLoading = authLoading || (userLoading && !userSeriesSnap);

    const { stats, loadingEnrichment } = useBingeStats(allSeries);
    const levelInfo = useMemo(() => getLevelInfo(stats.watchTime.totalMinutes), [stats.watchTime.totalMinutes]);
    const tier = getTier(levelInfo.level);
    const statsReady = !isLoading && !loadingEnrichment;

    // Last known level (also used by the navbar), shown until the stats are final
    // so the frame doesn't jump between tiers while TVMaze runtimes load
    const [cachedLevel, setCachedLevel] = useState(null);
    useEffect(() => {
        setCachedLevel(isOwner ? readViewerLevel(profileId) : null);
    }, [isOwner, profileId]);

    const shownTier = statsReady ? tier : cachedLevel?.tier;
    const shownLevel = statsReady ? levelInfo.level : cachedLevel?.level;

    // Remember the owner's level so the navbar can show the tier ring on every page
    useEffect(() => {
        if (!isOwner || !statsReady) return;
        saveViewerLevel(profileId, { level: levelInfo.level, tierKey: tier.key });
    }, [isOwner, statsReady, profileId, levelInfo.level, tier.key]);

    const [isTiersOpen, setIsTiersOpen] = useState(false);

    const displayName = isOwner && user
        ? (user.displayName || user.email?.split('@')[0] || 'My Profile')
        : `User ${profileId ? profileId.slice(0, 6) : ''}`;

    const userPhoto = isOwner && user ? user.photoURL : null;

    return (
        <AppShell activeTab={isOwner ? 'profile' : ''}>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="space-y-8">
                    {/* Profile identity */}
                    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-5 min-w-0">
                            <TierAvatar
                                size="lg"
                                photoURL={userPhoto}
                                name={displayName}
                                tier={shownTier}
                                level={shownLevel}
                                showLevel={shownLevel != null}
                                className="mb-2"
                            />

                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white truncate">
                                    {displayName}
                                </h1>
                                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate tabular-nums">
                                    {shownTier && (
                                        <>
                                            <span className={`font-semibold ${shownTier.accentText}`}>{shownTier.name}</span>
                                            {' · '}
                                        </>
                                    )}
                                    {statsReady && <>{Math.round(levelInfo.hours).toLocaleString()} h watched · </>}
                                    {allSeries.length} series
                                </p>

                                <div className="mt-2.5 max-w-xs">
                                    {statsReady ? (
                                        <ProgressBar
                                            size="sm"
                                            percent={levelInfo.progress}
                                            label={`${levelInfo.hoursToNext.toLocaleString()} h to level ${levelInfo.level + 1}`}
                                        />
                                    ) : (
                                        <div className="space-y-1.5 animate-pulse">
                                            <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                                            <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Button icon={FiAward} onClick={() => setIsTiersOpen(true)} disabled={!statsReady}>
                                Tiers
                            </Button>
                            <Button icon={copied ? FiCheck : FiShare2} onClick={handleCopyShare}>
                                {copied ? 'Link copied' : 'Share profile'}
                            </Button>
                        </div>
                    </Card>

                    <UserProfileStats
                        stats={stats}
                        loadingEnrichment={loadingEnrichment}
                    />

                    <TierLadderModal
                        isOpen={isTiersOpen}
                        onClose={() => setIsTiersOpen(false)}
                        levelInfo={levelInfo}
                    />
                </div>
            )}
        </AppShell>
    );
}
