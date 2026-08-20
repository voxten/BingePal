"use client";

import { FiDatabase } from 'react-icons/fi';
import AlertBanner from '../ui/AlertBanner';

export default function MigrationBanner({
    isMigrating = false,
    onRunMigration
}) {
    return (
        <AlertBanner
            variant="gradient"
            icon={FiDatabase}
            title="Database Architecture Upgrade Ready"
            description={
                <>
                    Upgrade your series to the new separated <b>series (catalog)</b> and <b>userSeries (tracking)</b> database schema.
                </>
            }
            actionLabel="Run 1-Click Migration"
            onAction={onRunMigration}
            isLoading={isMigrating}
            loadingLabel="Migrating..."
        />
    );
}
