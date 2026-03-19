/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    pink: '#ef5579',
                    bg: '#fff0f5',
                    dark: '#e23e65'
                }
            },
        },
    },
    plugins: [],
}
