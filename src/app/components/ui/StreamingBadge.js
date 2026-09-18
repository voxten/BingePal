"use client";

import { getStreamingProvider } from '../../services/streamingProvidersService';
import Badge from './Badge';

// variant: 'overlay' (on posters) | 'soft' (on surfaces)
export default function StreamingBadge({ showData, providerName, variant = 'overlay', size = 'sm', className = '' }) {
    const provider = getStreamingProvider(showData || providerName);
    if (!provider) return null;

    return (
        <Badge
            variant={variant}
            size={size}
            dot={provider.dot}
            title={`Streaming on ${provider.name}`}
            className={`max-w-[120px] ${className}`}
        >
            {provider.name}
        </Badge>
    );
}
