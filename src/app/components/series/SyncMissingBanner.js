"use client";

import { FiAlertCircle } from 'react-icons/fi';
import AlertBanner from '../ui/AlertBanner';

export default function SyncMissingBanner({
    missingCount = 0,
    isSyncing = false,
    syncStatus = '',
    onAutoSync
}) {
    if (missingCount <= 0) return null;

    return (
        <AlertBanner
            variant="indigo"
            icon={FiAlertCircle}
            title="Action Required: Missing IDs"
            description={
                <>
                    You have <b>{missingCount}</b> series missing TVMaze/IMDb IDs required for the Episode Tracker.
                </>
            }
            actionLabel="Auto-Fix All Missing"
            onAction={onAutoSync}
            isLoading={isSyncing}
            loadingLabel={syncStatus || 'Syncing...'}
        />
    );
}
