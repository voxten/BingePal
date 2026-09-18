"use client";

export function getProgressColor(progress) {
    if (progress >= 100) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
    return { bar: 'bg-indigo-500', text: 'text-slate-500 dark:text-slate-400' };
}

export default function ProgressBar({
    watchedEpisodes = 0,
    totalEpisodes = 0,
    percent,
    showLabel = true,
    label,
    size = 'md', // 'sm' | 'md'
    className = ''
}) {
    const total = Number(totalEpisodes) || 0;
    const watched = Number(watchedEpisodes) || 0;
    const progress = percent != null
        ? Math.min(Math.max(Math.round(percent), 0), 100)
        : total > 0 ? Math.min(Math.round((watched / total) * 100), 100) : 0;
    const progressColors = getProgressColor(progress);

    return (
        <div className={`space-y-1.5 ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center gap-2 text-xs tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400 truncate">
                        {label ?? (
                            <>
                                <span className="font-medium text-slate-900 dark:text-slate-100">{watched}</span>
                                {' / '}
                                {total > 0 ? `${total} eps` : '? eps'}
                            </>
                        )}
                    </span>
                    <span className={`font-medium shrink-0 ${progressColors.text}`}>
                        {progress}%
                    </span>
                </div>
            )}

            <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${size === 'sm' ? 'h-1' : 'h-1.5'}`}>
                <div
                    className={`h-full rounded-full ${progressColors.bar} transition-all duration-500 ease-out`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
