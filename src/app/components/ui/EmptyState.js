export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
    return (
        <div className={`flex flex-col items-center text-center px-6 py-14 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 ${className}`}>
            {Icon && (
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {title}
            </h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {action}
                </div>
            )}
        </div>
    );
}
