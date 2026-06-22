/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // <-- MAKE SURE THIS LINE EXISTS!
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}