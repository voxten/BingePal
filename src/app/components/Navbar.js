"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { 
    FiSun, 
    FiMoon, 
    FiLogIn, 
    FiLogOut, 
    FiMenu, 
    FiX,
    FiLayers, 
    FiCompass 
} from 'react-icons/fi';

export default function Navbar({ activeTab = 'collection' }) {
    const { login, logout, user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    return (
        <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Left Side: Brand Logo & Minimalist Text Navigation */}
                <div className="flex items-center gap-8">
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 relative rounded-xl overflow-hidden shadow-md shadow-indigo-500/15 bg-gradient-to-tr from-indigo-600 to-violet-600 p-0.5 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1">
                                <Image
                                    src="https://cms8ydvfu8qmbdmt.public.blob.vercel-storage.com/logo.webp"
                                    alt="BingePal Logo"
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                    loader={({ src }) => src}
                                    priority
                                />
                            </div>
                        </div>
                        <span className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                            BingePal
                        </span>
                    </Link>

                    {/* Desktop Minimalist Links (Classic Tab Underline Style) */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/"
                            className={`relative py-1.5 flex items-center gap-2 text-sm font-semibold transition-colors ${
                                activeTab === 'collection'
                                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <FiLayers className="w-4 h-4" />
                            <span>My Collection</span>
                            {activeTab === 'collection' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                            )}
                        </Link>

                        <Link
                            href="/explore"
                            className={`relative py-1.5 flex items-center gap-2 text-sm font-semibold transition-colors ${
                                activeTab === 'explore'
                                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            <FiCompass className="w-4 h-4" />
                            <span>Explore Catalog</span>
                            {activeTab === 'explore' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                            )}
                        </Link>
                    </nav>
                </div>

                {/* Right Side: Theme Switcher & Auth Controls */}
                <div className="hidden md:flex items-center gap-3">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm cursor-pointer"
                        aria-label="Toggle dark/light mode"
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <FiSun size={18} className="text-amber-400" /> : <FiMoon size={18} className="text-indigo-600" />}
                    </button>

                    <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

                    {/* Auth Status & Button */}
                    {user ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-98 cursor-pointer"
                            >
                                <FiLogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-98 shadow-md shadow-indigo-500/10 cursor-pointer"
                        >
                            <FiLogIn size={16} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>

                {/* Mobile Hamburger Button */}
                <div className="md:hidden relative">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                    </button>

                    {/* Mobile Dropdown Panel */}
                    {isMobileMenuOpen && (
                        <>
                            {/* Backdrop overlay */}
                            <div 
                                className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-xs"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl py-2 z-50 border border-slate-200/80 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                                <Link
                                    href="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center px-4 py-2.5 text-sm font-semibold w-full transition-colors ${
                                        activeTab === 'collection'
                                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <FiLayers className="mr-3 text-indigo-500" size={16} />
                                    <span>My Collection</span>
                                </Link>

                                <Link
                                    href="/explore"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center px-4 py-2.5 text-sm font-semibold w-full transition-colors ${
                                        activeTab === 'explore'
                                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <FiCompass className="mr-3 text-indigo-500" size={16} />
                                    <span>Explore Catalog</span>
                                </Link>

                                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1.5 mx-3" />

                                <button
                                    onClick={() => {
                                        setDarkMode(!darkMode);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 w-full text-left transition-colors cursor-pointer"
                                >
                                    {darkMode ? (
                                        <>
                                            <FiSun className="mr-3 text-amber-400" size={16} />
                                            <span>Light Theme</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiMoon className="mr-3 text-indigo-500" size={16} />
                                            <span>Dark Theme</span>
                                        </>
                                    )}
                                </button>

                                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1.5 mx-3" />

                                {user ? (
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full text-left transition-colors cursor-pointer"
                                    >
                                        <FiLogOut className="mr-3" size={16} />
                                        <span>Sign Out</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            login();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 w-full text-left transition-colors cursor-pointer"
                                    >
                                        <FiLogIn className="mr-3" size={16} />
                                        <span>Sign In</span>
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </header>
    );
}
