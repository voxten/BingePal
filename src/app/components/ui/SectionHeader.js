import Badge from './Badge';

export default function SectionHeader({ title, count, description, actions, as: Tag = 'h2', className = '' }) {
    return (
        <div className={`flex items-end justify-between gap-3 ${className}`}>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <Tag className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                        {title}
                    </Tag>
                    {count != null && <Badge>{count}</Badge>}
                </div>
                {description && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-1.5 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
