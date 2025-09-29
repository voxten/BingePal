"use client";

import { useAuth } from './context/AuthContext';
import SeriesList from './components/SeriesList';
import { FiSun, FiMoon, FiLogIn, FiLogOut, FiMenu } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import Image from 'next/image';

export default function HomePage() {
    const { login, logout, user, loading: authLoading } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Detect system color scheme
    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        setIsInitialized(true);
    }, []);

    // Apply dark mode class
    useEffect(() => {
        if (isInitialized) {
            document.documentElement.classList.toggle('dark', darkMode);
        }
    }, [darkMode, isInitialized]);

    if (!isInitialized || authLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    {/* Logo and title (unchanged) */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 relative">
                            <Image
                                src="https://cms8ydvfu8qmbdmt.public.blob.vercel-storage.com/logo.webp"
                                alt="BingePal Logo"
                                width={100}
                                height={100}
                                className="object-contain"
                                loader={({ src }) => src}
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BingePal</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {user ? `Hi, ${user.displayName || user.email.split('@')[0]}` : 'Your series tracker'}
                            </p>
                        </div>
                    </div>

                    {/* DESKTOP BUTTONS (hidden on mobile) */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Toggle theme"
                        >
                            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                        </button>

                        {/* Auth Button */}
                        {user ? (
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <FiLogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={login}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                            >
                                <FiLogIn size={18} />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>

                    {/* MOBILE MENU TOGGLE (visible only on mobile) */}
                    <div className="md:hidden relative">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Menu"
                        >
                            <FiMenu size={24} />
                        </button>

                        {/* MOBILE MENU DROPDOWN */}
                        {isMobileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                                {/* Theme Toggle Item */}
                                <button
                                    onClick={() => {
                                        setDarkMode(!darkMode);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                >
                                    {darkMode ? (
                                        <>
                                            <FiSun className="mr-3" />
                                            Light Mode
                                        </>
                                    ) : (
                                        <>
                                            <FiMoon className="mr-3" />
                                            Dark Mode
                                        </>
                                    )}
                                </button>

                                {/* Auth Item */}
                                {user ? (
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                    >
                                        <FiLogOut className="mr-3" />
                                        Sign Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            login();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                    >
                                        <FiLogIn className="mr-3" />
                                        Sign In
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Main content (unchanged) */}
                {user ? (
                    <SeriesList userId={user.uid} />
                ) : (
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            Track Your TV Series
                        </h2>
                        <button
                            onClick={login}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
                        >
                            Sign In to Get Started
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}