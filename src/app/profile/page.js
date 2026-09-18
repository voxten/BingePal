"use client";

import { useAuth } from '../context/AuthContext';
import UserProfileView from '../components/profile/UserProfileView';
import AppShell from '../components/layout/AppShell';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { FiUser, FiLogIn } from 'react-icons/fi';

export default function CurrentUserProfilePage() {
    const { user, login, loading } = useAuth();

    if (user && !loading) {
        return <UserProfileView profileId={user.uid} />;
    }

    return (
        <AppShell activeTab="profile">
            {loading ? (
                <LoadingSpinner />
            ) : (
                <EmptyState
                    icon={FiUser}
                    title="Sign in to see your profile"
                    description="Your watch time, stats and shareable profile live here."
                    className="max-w-xl mx-auto mt-8"
                    action={
                        <Button variant="primary" icon={FiLogIn} onClick={login}>
                            Sign in with Google
                        </Button>
                    }
                />
            )}
        </AppShell>
    );
}
