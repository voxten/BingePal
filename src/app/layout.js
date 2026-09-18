import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata = {
    title: 'BingePal',
    description: 'Your personal TV series tracker',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="antialiased">
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}
