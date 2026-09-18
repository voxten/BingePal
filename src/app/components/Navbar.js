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
    FiCompass,
    FiCalendar,
    FiShuffle,
    FiUser
} from 'react-icons/fi';
import Button, { IconButton } from './ui/Button';
import TierAvatar from './profile/TierAvatar';
import { readViewerLevel, VIEWER_LEVEL_EVENT } from '../services/viewerLevelService';

const NAV_ITEMS = [
    { key: 'collection', href: '/', label: 'My Collection', icon: FiLayers },
    { key: 'explore', href: '/explore', label: 'Explore', icon: FiCompass },
    { key: 'schedule', href: '/schedule', label: 'Schedule', icon: FiCalendar },
    { key: 'roulette', href: '/roulette', label: 'Roulette', icon: FiShuffle },
];

const MENU_ITEM = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer';

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

    // Tier ring for the avatar, cached by the profile page
    const [viewerLevel, setViewerLevel] = useState(null);
    useEffect(() => {
        if (!user?.uid) {
            setViewerLevel(null);
            return;
        }
        const refresh = () => setViewerLevel(readViewerLevel(user.uid));
        refresh();
        window.addEventListener(VIEWER_LEVEL_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener(VIEWER_LEVEL_EVENT, refresh);
            window.removeEventListener('storage', refresh);
        };
    }, [user?.uid]);

    const displayName = user ? (user.displayName || user.email?.split('@')[0]) : '';
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Brand & primary navigation */}
                <div className="flex items-center gap-8 h-full">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center p-1.5">
                            <Image
                                src="https://cms8ydvfu8qmbdmt.public.blob.vercel-storage.com/logo.webp"
                                alt="BingePal Logo"
                                width={20}
                                height={20}
                                className="object-contain"
                                loader={({ src }) => src}
                                priority
                            />
                        </div>
                        <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                            BingePal
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-5 lg:gap-6 h-full">
                        {NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
                            const isActive = activeTab === key;
                            return (
                                <Link
                                    key={key}
                                    href={href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`relative h-full flex items-center gap-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'text-slate-900 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                                    <span>{label}</span>
                                    {isActive && (
                                        <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Theme & account controls */}
                <div className="hidden md:flex items-center gap-2">
                    <IconButton
                        icon={darkMode ? FiSun : FiMoon}
                        label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        onClick={() => setDarkMode(!darkMode)}
                    />

                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    {user ? (
                        <>
                            <Link
                                href="/profile"
                                className={`flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-xl text-sm font-medium transition-colors ${
                                    activeTab === 'profile'
                                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                }`}
                                title={viewerLevel
                                    ? `Level ${viewerLevel.level} · ${viewerLevel.tier.name}`
                                    : 'Profile & stats'}
                            >
                                <TierAvatar
                                    size="sm"
                                    photoURL={user.photoURL}
                                    name={displayName}
                                    tier={viewerLevel?.tier}
                                />
                                <span className="max-w-[120px] truncate hidden lg:inline">
                                    {displayName}
                                </span>
                                {viewerLevel && (
                                    <span className="hidden lg:inline text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                                        Lv {viewerLevel.level}
                                    </span>
                                )}
                            </Link>

                            <IconButton icon={FiLogOut} label="Sign out" onClick={logout} />
                        </>
                    ) : (
                        <Button variant="primary" icon={FiLogIn} onClick={login}>
                            Sign in
                        </Button>
                    )}
                </div>

                {/* Mobile menu */}
                <div className="md:hidden relative">
                    <IconButton
                        icon={isMobileMenuOpen ? FiX : FiMenu}
                        label="Toggle menu"
                        variant="secondary"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />

                    {isMobileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-slate-950/20 dark:bg-slate-950/50 animate-fade-in"
                                onClick={closeMenu}
                            />

                            <div className="absolute right-0 mt-2 w-60 z-50 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-pop-in origin-top-right">
                                {NAV_ITEMS.map(({ key, href, label, icon: Icon }) => {
                                    const isActive = activeTab === key;
                                    return (
                                        <Link
                                            key={key}
                                            href={href}
                                            onClick={closeMenu}
                                            className={`${MENU_ITEM} ${
                                                isActive
                                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{label}</span>
                                        </Link>
                                    );
                                })}

                                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1.5" />

                                <button
                                    onClick={() => {
                                        setDarkMode(!darkMode);
                                        closeMenu();
                                    }}
                                    className={`${MENU_ITEM} text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800`}
                                >
                                    {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                                    <span>{darkMode ? 'Light theme' : 'Dark theme'}</span>
                                </button>

                                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1.5" />

                                {user ? (
                                    <>
                                        <Link
                                            href="/profile"
                                            onClick={closeMenu}
                                            className={`${MENU_ITEM} ${
                                                activeTab === 'profile'
                                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <FiUser className="w-4 h-4" />
                                            <span className="truncate">Profile</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                logout();
                                                closeMenu();
                                            }}
                                            className={`${MENU_ITEM} text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`}
                                        >
                                            <FiLogOut className="w-4 h-4" />
                                            <span>Sign out</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            login();
                                            closeMenu();
                                        }}
                                        className={`${MENU_ITEM} text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10`}
                                    >
                                        <FiLogIn className="w-4 h-4" />
                                        <span>Sign in</span>
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
