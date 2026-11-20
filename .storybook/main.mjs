/** @type { import('@storybook/nextjs-vite').StorybookConfig } */
const config = {
    stories: ['../src/**/*.stories.@(js|jsx)'],
    addons: ['@storybook/addon-themes'],
    framework: {
        name: '@storybook/nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
    // The app keeps JSX in .js files (Next.js style); tell Vite's dependency scanner about it
    viteFinal: async (viteConfig) => {
        viteConfig.optimizeDeps = viteConfig.optimizeDeps || {};
        viteConfig.optimizeDeps.esbuildOptions = {
            ...viteConfig.optimizeDeps.esbuildOptions,
            loader: { ...viteConfig.optimizeDeps.esbuildOptions?.loader, '.js': 'jsx' },
        };
        return viteConfig;
    },
};

export default config;
