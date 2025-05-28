import './globals.css';
import { AuthProvider } from './context/AuthContext';

export const metadata = {
    title: 'BingePal',
    description: 'Your personal TV series tracker',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body>
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}
