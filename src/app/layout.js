import './globals.css';
import { Archivo, Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const archivo = Archivo({
    variable: '--font-archivo',
    subsets: ['latin'],
    axes: ['wdth'],
});

export const metadata = {
    title: 'BingePal',
    description: 'Your personal TV series tracker',
};

// Runs before the page paints, so a saved dark theme is applied without a
// light flash. The Navbar toggle reads this class and keeps it in sync.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }) {
    return (
        // suppressHydrationWarning: the script above adds the 'dark' class on purpose
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable}`} suppressHydrationWarning>
        <head>
            <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body className="antialiased">
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}
