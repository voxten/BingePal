"use client";

import { useAuth } from './context/AuthContext';
import SeriesList from './components/SeriesList';
import AppShell from './components/layout/AppShell';
import LoadingSpinner from './components/LoadingSpinner';
import Button from './components/ui/Button';
import { FiLogIn, FiTv } from 'react-icons/fi';

export default function HomePage() {
    const { login, user, loading: authLoading } = useAuth();

    return (
        <AppShell activeTab="collection">
            {authLoading ? (
                <LoadingSpinner />
            ) : user ? (
                <SeriesList userId={user.uid} />
            ) : (
                <div className="max-w-md mx-auto py-20 sm:py-28 text-center">
                    <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">
                        <FiTv className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        Keep track of every episode
                    </h1>
                    <p className="mt-3 text-slate-500 dark:text-slate-400">
                        Log what you&apos;ve watched, rate your series and see when new episodes air.
                    </p>
                    <Button variant="primary" icon={FiLogIn} onClick={login} className="mt-8">
                        Sign in with Google
                    </Button>
                </div>
            )}
        </AppShell>
    );
}
