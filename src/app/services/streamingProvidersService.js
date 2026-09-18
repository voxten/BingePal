/**
 * Maps TVMaze webChannel / network names to recognizable streaming providers.
 * Brand identity is carried by the dot color only; the badge itself stays neutral.
 */

const KNOWN_PROVIDERS = {
    'netflix': { name: 'Netflix', dot: 'bg-red-500' },
    'hbo max': { name: 'Max', dot: 'bg-blue-500' },
    'hbo': { name: 'HBO', dot: 'bg-purple-500' },
    'max': { name: 'Max', dot: 'bg-blue-500' },
    'apple tv+': { name: 'Apple TV+', dot: 'bg-slate-300' },
    'apple tv': { name: 'Apple TV+', dot: 'bg-slate-300' },
    'amazon prime video': { name: 'Prime Video', dot: 'bg-sky-400' },
    'prime video': { name: 'Prime Video', dot: 'bg-sky-400' },
    'amazon': { name: 'Prime Video', dot: 'bg-sky-400' },
    'disney+': { name: 'Disney+', dot: 'bg-indigo-400' },
    'hulu': { name: 'Hulu', dot: 'bg-emerald-400' },
    'peacock': { name: 'Peacock', dot: 'bg-teal-400' },
    'paramount+': { name: 'Paramount+', dot: 'bg-blue-400' },
    'amc': { name: 'AMC', dot: 'bg-amber-400' },
    'fx': { name: 'FX', dot: 'bg-amber-500' },
    'skyshowtime': { name: 'SkyShowtime', dot: 'bg-violet-400' },
    'showtime': { name: 'Showtime', dot: 'bg-rose-500' },
    'bbc one': { name: 'BBC One', dot: 'bg-red-400' },
    'bbc two': { name: 'BBC Two', dot: 'bg-teal-400' },
    'the cw': { name: 'The CW', dot: 'bg-emerald-400' }
};

/**
 * Resolves streaming provider metadata from TVMaze show data or strings
 */
export function getStreamingProvider(showData) {
    if (!showData) return null;

    const rawName = (
        showData.webChannel?.name ||
        showData.network?.name ||
        showData.streamingService ||
        (typeof showData === 'string' ? showData : '')
    ).trim();

    if (!rawName) return null;

    const key = rawName.toLowerCase();
    for (const [providerKey, config] of Object.entries(KNOWN_PROVIDERS)) {
        if (key === providerKey || key.includes(providerKey)) {
            return config;
        }
    }

    // Fallback for custom or unrecognized networks
    return { name: rawName, dot: 'bg-slate-400' };
}
