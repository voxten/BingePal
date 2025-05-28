"use client";

import { useAuth } from './context/AuthContext';
import SeriesList from './components/SeriesList';
import { FiSun, FiMoon, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

export default function HomePage() {
    const { login, logout, user, loading: authLoading } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Check for user's preferred color scheme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        // Apply dark mode class to body
        if (isInitialized) {
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [darkMode, isInitialized]);

    if (!isInitialized || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bingie</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {user ? `Welcome back, ${user.displayName || user.email}!` : 'Your personal TV series tracker'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                        </button>

                        {user ? (
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <FiLogOut className="w-5 h-5" />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={login}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <FiLogIn className="w-5 h-5" />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                {user ? (
                    <SeriesList userId={user.uid} />
                ) : (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                            Track Your Favorite TV Series
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                            Sign in to create your personalized collection and track your progress.
                        </p>
                        <button
                            onClick={login}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors text-lg"
                        >
                            Sign In with Google
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}