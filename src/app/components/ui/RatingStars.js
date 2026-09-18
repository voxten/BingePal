"use client";

import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

export default function RatingStars({
    rating = 0,
    maxRating = 5,
    onChange,
    readOnly = false,
    size = 'sm', // 'sm' | 'md' | 'lg'
    className = ''
}) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const starSize = sizeClasses[size] || sizeClasses.sm;
    const currentRating = Number(rating) || 0;

    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {[...Array(maxRating)].map((_, i) => {
                const starValue = i + 1;
                const isFilled = (hoverRating || currentRating) >= starValue;

                return (
                    <button
                        key={starValue}
                        type="button"
                        disabled={readOnly || !onChange}
                        onMouseEnter={() => !readOnly && setHoverRating(starValue)}
                        onMouseLeave={() => !readOnly && setHoverRating(0)}
                        onClick={() => {
                            if (!readOnly && onChange) {
                                // Toggle to 0 if clicking the same rating
                                onChange(currentRating === starValue ? 0 : starValue);
                            }
                        }}
                        className={`p-0.5 rounded transition-transform duration-150 ${
                            readOnly || !onChange
                                ? 'cursor-default'
                                : 'cursor-pointer hover:scale-110 active:scale-95'
                        }`}
                        aria-label={`Rate ${starValue} of ${maxRating} stars`}
                    >
                        <FiStar
                            className={`${starSize} transition-colors ${
                                isFilled
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
