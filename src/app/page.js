"use client";

import { useAuth } from './context/AuthContext';
import SeriesList from './components/SeriesList';
import { FiSun, FiMoon, FiLogIn, FiLogOut, FiMenu, FiTv } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import Image from 'next/image';

export default function HomePage() {
    const { login, logout, user, loading: authLoading } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Detect system or stored color scheme on mount
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }
        setIsInitialized(true);
    }, []);

    // Apply dark mode class to document root and sync localStorage
    useEffect(() => {
        if (isInitialized) {
            if (darkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [darkMode, isInitialized]);

    if (!isInitialized || authLoading) {
        return <LoadingSpinner />;
    }

    return (
        /* The dynamic ${darkMode ? 'dark' : ''} here ensures components inside always inherit the theme toggle state */
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 selection:bg-indigo-500 selection:text-white ${darkMode ? 'dark' : ''}`}>

            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Brand / Logo Info Section */}
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 relative rounded-xl overflow-hidden shadow-sm bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5">
                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center transition-colors">
                                <Image
                                    src="https://cms8ydvfu8qmbdmt.public.blob.vercel-storage.com/logo.webp"
                                    alt="BingePal Logo"
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                    loader={({ src }) => src}
                                    priority
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                                    BingePal
                                </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider -mt-0.5">
                                {user ? `${user.displayName || user.email.split('@')[0]}` : 'Dashboard'}
                            </p>
                        </div>
                    </div>

                    {/* Desktop Button Interface */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Interactive Theme Switcher */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                            aria-label="Toggle structural theme"
                        >
                            {darkMode ? <FiSun size={18} className="text-amber-400" /> : <FiMoon size={18} className="text-indigo-600" />}
                        </button>

                        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

                        {/* Authentication UI */}
                        {user ? (
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-98"
                            >
                                <FiLogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={login}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-98 shadow-md shadow-indigo-500/10"
                            >
                                <FiLogIn size={16} />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Action Selector */}
                    <div className="md:hidden relative">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            aria-label="Open directory menu"
                        >
                            <FiMenu size={20} />
                        </button>

                        {/* Mobile Dropdown Panel View */}
                        {isMobileMenuOpen && (
                            <div className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl py-1.5 z-50 border border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                    onClick={() => {
                                        setDarkMode(!darkMode);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 w-full text-left transition-colors"
                                >
                                    {darkMode ? (
                                        <>
                                            <FiSun className="mr-3 text-amber-400" size={16} />
                                            Light Theme Mode
                                        </>
                                    ) : (
                                        <>
                                            <FiMoon className="mr-3 text-indigo-500" size={16} />
                                            Dark Theme Mode
                                        </>
                                    )}
                                </button>

                                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1 mx-3" />

                                {user ? (
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full text-left transition-colors"
                                    >
                                        <FiLogOut className="mr-3" size={16} />
                                        Sign Out Account
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            login();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 w-full text-left transition-colors"
                                    >
                                        <FiLogIn className="mr-3" size={16} />
                                        Sign In Account
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

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
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all active:scale-98 shadow-lg shadow-indigo-500/15"
                        >
                            Sign In to Get Started
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}