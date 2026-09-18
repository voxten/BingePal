"use client";

import Poster from '../ui/Poster';

const ASPECTS = {
    poster: 'aspect-[2/3]',
    wide: 'aspect-[16/10] sm:aspect-[4/3]',
    video: 'aspect-video',
};

/**
 * Shared shell for every series card: poster with badge slots and an overlaid title,
 * plus an optional body. The root deliberately has no overflow-hidden so popovers
 * rendered in the body (e.g. the status menu) can escape the card.
 */
export default function MediaCard({
    id,
    imageUrl,
    fallbackImageUrl,
    title,
    meta,
    aspect = 'poster',
    size = 'md',
    topLeft,
    topRight,
    posterOverlay,
    onPosterClick,
    posterLabel,
    onTitleClick,
    highlighted = false,
    className = '',
    children,
}) {
    const isSmall = size === 'sm';

    return (
        <div
            id={id}
            className={`group relative flex flex-col bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-200 ${
                highlighted
                    ? 'border-indigo-500 ring-4 ring-indigo-500/25 scale-[1.02] z-20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
            } ${className}`}
        >
            <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 ${children ? 'rounded-t-2xl' : 'rounded-2xl'} ${ASPECTS[aspect] || ASPECTS.poster}`}>
                <Poster
                    src={imageUrl}
                    fallbackSrc={fallbackImageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

                {onPosterClick && (
                    <button
                        type="button"
                        onClick={onPosterClick}
                        aria-label={posterLabel || title}
                        title={posterLabel}
                        className="absolute inset-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                    />
                )}

                {posterOverlay}

                {(topLeft || topRight) && (
                    <div className={`absolute flex items-start justify-between gap-1.5 pointer-events-none ${isSmall ? 'top-1.5 left-1.5 right-1.5' : 'top-2.5 left-2.5 right-2.5'}`}>
                        <div className="flex items-center gap-1 min-w-0 pointer-events-auto">{topLeft}</div>
                        <div className="flex items-center gap-1 shrink-0 pointer-events-auto">{topRight}</div>
                    </div>
                )}

                <div className={`absolute text-white pointer-events-none ${isSmall ? 'bottom-2 left-2 right-2' : 'bottom-3 left-3 right-3'}`}>
                    <h3
                        className={`font-semibold leading-snug truncate ${isSmall ? 'text-xs' : 'text-[15px]'} ${
                            onTitleClick ? 'pointer-events-auto cursor-pointer hover:underline underline-offset-2' : ''
                        }`}
                        title={title}
                        onClick={onTitleClick}
                    >
                        {title}
                    </h3>
                    {meta && (
                        <div className={`mt-0.5 flex items-center gap-2 text-white/70 ${isSmall ? 'text-[11px]' : 'text-xs'}`}>
                            {meta}
                        </div>
                    )}
                </div>
            </div>

            {children && (
                <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
                    {children}
                </div>
            )}
        </div>
    );
}
