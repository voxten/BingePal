export default function PageHeader({ title, description, actions, className = '' }) {
    return (
        <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
