"use client";

import { useParams } from 'next/navigation';
import UserProfileView from '../../components/profile/UserProfileView';

export default function UserProfilePage() {
    const params = useParams();
    const profileId = params.id;

    return <UserProfileView profileId={profileId} />;
}