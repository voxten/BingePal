const PADDINGS = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
};

export default function Card({ as: Tag = 'div', padding = 'md', className = '', children, ...rest }) {
    return (
        <Tag
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl ${PADDINGS[padding] ?? PADDINGS.md} ${className}`}
            {...rest}
        >
            {children}
        </Tag>
    );
}

export function StatCard({ label, value, unit, sub, icon: Icon, children, className = '' }) {
    return (
        <Card padding="sm" className={`flex flex-col gap-3 ${className}`}>
            <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
                <span className="text-xs font-medium">{label}</span>
                {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            </div>
            <div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
                        {value}
                    </span>
                    {unit && <span className="text-xs text-slate-500 dark:text-slate-400">{unit}</span>}
                </div>
                {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
                {children}
            </div>
        </Card>
    );
}
