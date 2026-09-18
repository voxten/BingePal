"use client";

import { useAuth } from '../context/AuthContext';
import ExploreCatalog from '../components/ExploreCatalog';
import AppShell from '../components/layout/AppShell';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ExplorePage() {
    const { loading: authLoading } = useAuth();

    return (
        <AppShell activeTab="explore">
            {authLoading ? <LoadingSpinner /> : <ExploreCatalog />}
        </AppShell>
    );
}
