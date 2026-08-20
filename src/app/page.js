"use client";

import { useAuth } from './context/AuthContext';
import SeriesList from './components/SeriesList';
import Navbar from './components/Navbar';
import { FiTv } from 'react-icons/fi';
import LoadingSpinner from './components/LoadingSpinner';

export default function HomePage() {
    const { login, user, loading: authLoading } = useAuth();

    if (authLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500 selection:text-white">
            {/* Top Navigation Bar */}
            <Navbar 
                activeTab="collection" 
                subtitle={user ? (user.displayName || user.email.split('@')[0]) : 'Dashboard'} 
            />

            {/* Main Application Canvas */}
            <main className="container mx-auto px-4 py-8">
                {user ? (
                    <SeriesList userId={user.uid} />
                ) : (
                    <div className="text-center py-24 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-100 dark:border-indigo-900/50">
                            <FiTv size={32} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
                            Track Your TV Series
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                            Stop forgetting which episode you stopped at. Organize your watchlist, log custom scores, and map out upcoming seasons seamlessly.
                        </p>
                        <button
                            onClick={login}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all active:scale-98 shadow-lg shadow-indigo-500/15 cursor-pointer"
                        >
                            Sign In to Get Started
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}