export default function LoadingSpinner({ label = 'Loading…', className = '' }) {
    return (
        <div className={`min-h-[50vh] flex flex-col items-center justify-center gap-3 ${className}`}>
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}
