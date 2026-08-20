"use client";

import { useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import SeriesList from '../../components/SeriesList';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function UserProfilePage() {
    const params = useParams();
    const profileId = params.id; // Target user ID from the URL string (/profile/tt123)

    const { user, loading: authLoading } = useAuth();
    const isOwner = user?.uid === profileId;

    if (authLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500 selection:text-white">
            {/* Top Navigation Bar */}
            <Navbar 
                activeTab={isOwner ? "collection" : null} 
                subtitle={isOwner ? "My Collection" : "Shared Collection View"} 
            />

            {/* Main Application Content */}
            <main className="container mx-auto px-4 py-8">
                <SeriesList userId={profileId} />
            </main>
        </div>
    );
}