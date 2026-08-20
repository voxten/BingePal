"use client";

import { useAuth } from '../context/AuthContext';
import ExploreCatalog from '../components/ExploreCatalog';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ExplorePage() {
    const { loading: authLoading } = useAuth();

    if (authLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500 selection:text-white">
            {/* Top Navigation Bar */}
            <Navbar activeTab="explore" subtitle="Catalog" />

            {/* Main Content Area */}
            <main className="container mx-auto px-4 py-8">
                <ExploreCatalog />
            </main>
        </div>
    );
}
