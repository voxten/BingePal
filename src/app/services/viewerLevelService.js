/**
 * Viewer levels and tiers, driven by total watch time.
 *
 * XP is hours watched. The curve is hoursForLevel(L) = 2 * (L - 1)^1.6 with no level cap:
 * level 10 ≈ 67 h, level 50 ≈ 1 000 h, level 100 ≈ 3 100 h, level 160 ≈ 6 700 h.
 */

const CURVE_BASE = 2;
const CURVE_EXPONENT = 1.6;

export function hoursForLevel(level) {
    if (level <= 1) return 0;
    return CURVE_BASE * Math.pow(level - 1, CURVE_EXPONENT);
}

export function getLevelInfo(totalMinutes = 0) {
    const hours = Math.max(0, (Number(totalMinutes) || 0) / 60);

    let level = Math.floor(Math.pow(hours / CURVE_BASE, 1 / CURVE_EXPONENT)) + 1;
    // Guard against floating point drift at the level boundaries
    while (hoursForLevel(level + 1) <= hours) level++;
    while (level > 1 && hoursForLevel(level) > hours) level--;

    const levelStartHours = hoursForLevel(level);
    const nextLevelHours = hoursForLevel(level + 1);
    const progress = ((hours - levelStartHours) / (nextLevelHours - levelStartHours)) * 100;

    return {
        level,
        hours,
        levelStartHours,
        nextLevelHours,
        progress: Math.min(100, Math.max(0, progress)),
        hoursToNext: Math.max(0, Math.ceil(nextLevelHours - hours)),
    };
}

// Ring and accent classes are full static strings so Tailwind can pick them up.
export const VIEWER_TIERS = [
    {
        key: 'pilot-episode',
        minLevel: 1,
        name: 'Pilot Episode',
        description: 'Just getting started.',
        accentText: 'text-slate-500 dark:text-slate-400',
        ring: 'bg-slate-300 dark:bg-slate-600',
    },
    {
        key: 'channel-surfer',
        minLevel: 5,
        name: 'Channel Surfer',
        description: 'Sampling a bit of everything.',
        accentText: 'text-emerald-600 dark:text-emerald-400',
        ring: 'bg-emerald-500',
    },
    {
        key: 'weekend-binger',
        minLevel: 10,
        name: 'Weekend Binger',
        description: 'Saturdays are for whole seasons.',
        accentText: 'text-sky-600 dark:text-sky-400',
        ring: 'bg-sky-500',
    },
    {
        key: 'season-finisher',
        minLevel: 20,
        name: 'Season Finisher',
        description: 'Sees every story through to the end.',
        accentText: 'text-indigo-600 dark:text-indigo-400',
        ring: 'bg-indigo-500',
    },
    {
        key: 'series-devotee',
        minLevel: 35,
        name: 'Series Devotee',
        description: 'Knows the "previously on" by heart.',
        accentText: 'text-violet-600 dark:text-violet-400',
        ring: 'bg-violet-500',
    },
    {
        key: 'marathon-runner',
        minLevel: 50,
        name: 'Marathon Runner',
        description: 'Six episodes in a row is a warm-up.',
        accentText: 'text-fuchsia-600 dark:text-fuchsia-400',
        ring: 'bg-gradient-to-tr from-violet-500 to-fuchsia-500',
    },
    {
        key: 'couch-veteran',
        minLevel: 70,
        name: 'Couch Veteran',
        description: 'The couch has your shape by now.',
        accentText: 'text-amber-600 dark:text-amber-400',
        ring: 'bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-500',
        glow: true,
    },
    {
        key: 'showrunner',
        minLevel: 90,
        name: 'Showrunner',
        description: 'Could pitch the next season yourself.',
        accentText: 'text-rose-600 dark:text-rose-400',
        ring: 'bg-gradient-to-tr from-rose-600 via-orange-400 to-amber-300',
        glow: true,
    },
    {
        key: 'screen-legend',
        minLevel: 120,
        name: 'Screen Legend',
        description: 'Months of screen time, and counting.',
        accentText: 'bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent',
        ring: 'bg-[conic-gradient(#6366f1,#d946ef,#f59e0b,#6366f1)]',
        glow: true,
        animated: true,
    },
    {
        key: 'living-archive',
        minLevel: 160,
        name: 'Living Archive',
        description: 'Has watched more TV than most networks air.',
        accentText: 'bg-gradient-to-r from-rose-500 via-amber-400 to-indigo-500 bg-clip-text text-transparent',
        ring: 'bg-[conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#6366f1,#d946ef,#ef4444)]',
        glow: true,
        animated: true,
        pulse: true,
    },
];

export function getTier(level = 1) {
    let tier = VIEWER_TIERS[0];
    for (const t of VIEWER_TIERS) {
        if (level >= t.minLevel) tier = t;
    }
    return tier;
}

export function getNextTier(level = 1) {
    return VIEWER_TIERS.find(t => t.minLevel > level) || null;
}

export function getTierByKey(key) {
    return VIEWER_TIERS.find(t => t.key === key) || null;
}

// --- Cache so the navbar can show the tier ring without recomputing stats on every page ---

export const VIEWER_LEVEL_EVENT = 'bingepal:viewer-level';
const storageKey = (uid) => `bingepal:viewer-level:${uid}`;

export function saveViewerLevel(uid, { level, tierKey }) {
    if (!uid) return;
    try {
        const value = JSON.stringify({ level, tierKey });
        if (localStorage.getItem(storageKey(uid)) === value) return;
        localStorage.setItem(storageKey(uid), value);
        window.dispatchEvent(new CustomEvent(VIEWER_LEVEL_EVENT, { detail: { uid } }));
    } catch {
        // Storage unavailable (private mode, blocked): the navbar just shows a plain avatar
    }
}

export function readViewerLevel(uid) {
    if (!uid) return null;
    try {
        const raw = localStorage.getItem(storageKey(uid));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const tier = getTierByKey(parsed.tierKey);
        if (!tier || !parsed.level) return null;
        return { level: parsed.level, tier };
    } catch {
        return null;
    }
}
