"use client";

import Navbar from '../Navbar';

export default function AppShell({ activeTab, children, className = '' }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar activeTab={activeTab} />
            <main className={`container mx-auto px-4 sm:px-6 py-8 ${className}`}>
                {children}
            </main>
        </div>
    );
}
