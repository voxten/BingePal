"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Public profile card (name + photo) so other people's profiles can show who
// they belong to. Needs a Firestore rule: users/{uid} readable by anyone,
// writable only by that uid. Failing here must never break sign-in.
function savePublicProfile(user) {
    setDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        updatedAt: Date.now(),
    }, { merge: true }).catch((error) => {
        console.warn('Could not save public profile:', error.code || error);
    });
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            if (user) savePublicProfile(user);
        });

        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}