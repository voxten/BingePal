"use client";

import { useState, useEffect } from 'react';
import { FiTv } from 'react-icons/fi';

// Image with a neutral placeholder. Tries `src`, then `fallbackSrc`, then shows the placeholder.
export default function Poster({ src, fallbackSrc, alt = '', className = '' }) {
    const sources = [src, fallbackSrc].filter(Boolean);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [src, fallbackSrc]);

    const current = sources[index];

    if (!current) {
        return (
            <div className={`flex items-center justify-center bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 ${className}`}>
                <FiTv className="w-1/4 h-1/4 max-w-8 max-h-8" />
            </div>
        );
    }

    return (
        <img
            src={current}
            alt={alt}
            loading="lazy"
            onError={() => setIndex((i) => i + 1)}
            className={`object-cover ${className}`}
        />
    );
}
