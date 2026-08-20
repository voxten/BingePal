"use client";

export function getProgressColor(progress) {
    if (progress <= 25) return { bar: 'from-rose-500 to-amber-500', text: 'text-rose-500 dark:text-rose-400' };
    if (progress <= 60) return { bar: 'from-amber-500 to-yellow-500', text: 'text-amber-500 dark:text-amber-400' };
    if (progress <= 99) return { bar: 'from-indigo-500 to-violet-500', text: 'text-indigo-600 dark:text-indigo-400' };
    return { bar: 'from-emerald-500 to-teal-400', text: 'text-emerald-600 dark:text-emerald-400' };
}

export default function ProgressBar({
    watchedEpisodes = 0,
    totalEpisodes = 0,
    showLabel = true,
    size = 'md', // 'sm' | 'md' | 'lg'
    className = ''
}) {
    const total = Number(totalEpisodes) || 0;
    const watched = Number(watchedEpisodes) || 0;
    const progress = total > 0 ? Math.min(Math.round((watched / total) * 100), 100) : 0;
    const progressColors = getProgressColor(progress);

    const heightClasses = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-2.5'
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{watched}</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                        {total > 0 ? `${total} eps` : '? eps'}
                    </span>
                    <span className={`font-bold transition-colors ${progressColors.text}`}>
                        {progress}%
                    </span>
                </div>
            )}
            
            <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px] shadow-inner ${heightClasses[size] || 'h-2'}`}>
                <div 
                    className={`h-full rounded-full bg-gradient-to-r ${progressColors.bar} transition-all duration-500 ease-out shadow-xs`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
