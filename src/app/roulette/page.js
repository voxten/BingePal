"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useUserSeries from '../hooks/useUserSeries';
import AppShell from '../components/layout/AppShell';
import LoadingSpinner from '../components/LoadingSpinner';
import EpisodesModal from '../components/EpisodesModal';
import RouletteView from '../components/roulette/RouletteView';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import AlertBanner from '../components/ui/AlertBanner';
import Button from '../components/ui/Button';
import { FiShuffle, FiLogIn, FiCompass, FiAlertTriangle } from 'react-icons/fi';

export default function RoulettePage() {
    const { user, login, loading: authLoading } = useAuth();
    const { allSeries, loading, error } = useUserSeries(user?.uid);
    const [trackingSeries, setTrackingSeries] = useState(null);

    const renderContent = () => {
        if (authLoading || (user && loading)) return <LoadingSpinner />;

        if (!user) {
            return (
                <EmptyState
                    icon={FiShuffle}
                    title="Sign in to spin"
                    description="The roulette picks from the series in your collection."
                    action={
                        <Button variant="primary" icon={FiLogIn} onClick={login}>
                            Sign in with Google
                        </Button>
                    }
                />
            );
        }

        if (error) {
            return (
                <AlertBanner
                    tone="danger"
                    icon={FiAlertTriangle}
                    title="Couldn't load your collection"
                    description={error.message}
                />
            );
        }

        if (allSeries.length === 0) {
            return (
                <EmptyState
                    icon={FiShuffle}
                    title="Nothing to spin yet"
                    description="Add a few series to your collection and the roulette will pick one for you."
                    action={
                        <Button variant="primary" href="/explore" icon={FiCompass}>
                            Explore series
                        </Button>
                    }
                />
            );
        }

        return <RouletteView allSeries={allSeries} onOpenTracker={setTrackingSeries} />;
    };

    return (
        <AppShell activeTab="roulette">
            <div className="space-y-6">
                <PageHeader
                    title="Roulette"
                    description="Can't decide what to watch? Let chance pick from your collection."
                />
                {renderContent()}
            </div>

            {trackingSeries && (
                <EpisodesModal
                    series={trackingSeries}
                    isOpen={!!trackingSeries}
                    onClose={() => setTrackingSeries(null)}
                    userId={user?.uid}
                    isOwner
                />
            )}
        </AppShell>
    );
}
