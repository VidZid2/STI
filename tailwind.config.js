/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./@/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                canvas: 'var(--bg-canvas)',
                surface: 'var(--bg-surface)',
                'surface-alt': 'var(--bg-surface-alt)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'border-subtle': 'var(--border-subtle)',
                'border-strong': 'var(--border-strong)',
                accent: 'var(--accent-primary)',
                'accent-bg': 'var(--accent-bg)',
            }
        },
    },
    plugins: [],
}
