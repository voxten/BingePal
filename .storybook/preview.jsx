import '../src/app/globals.css';
import { withThemeByClassName } from '@storybook/addon-themes';
import { Archivo, Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'], axes: ['wdth'] });

const fontVariables = `${geistSans.variable} ${geistMono.variable} ${archivo.variable}`;

/** @type { import('@storybook/nextjs-vite').Preview } */
const preview = {
    parameters: {
        layout: 'fullscreen',
        controls: { matchers: { color: /(background|color)$/i } },
        viewport: {
            options: {
                phone: { name: 'Phone (375)', styles: { width: '375px', height: '812px' }, type: 'mobile' },
                tablet: { name: 'Tablet (768)', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
                laptop: { name: 'Laptop (1280)', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
            },
        },
    },
    decorators: [
        withThemeByClassName({
            themes: { light: '', dark: 'dark' },
            defaultTheme: 'light',
        }),
        (Story) => (
            <div className={`${fontVariables} font-sans antialiased min-h-screen bg-background text-foreground`}>
                <Story />
            </div>
        ),
    ],
};

export default preview;
