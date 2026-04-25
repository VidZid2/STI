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
                dashboard: {
                    bg: 'var(--bg-primary)',
                    surface: 'var(--bg-secondary)',
                    tertiary: 'var(--bg-tertiary)',
                    elevated: 'var(--bg-elevated)',
                    hover: 'var(--bg-hover)',
                    border: 'var(--border-light)',
                    'border-medium': 'var(--border-medium)',
                    text: 'var(--text-primary)',
                    'text-secondary': 'var(--text-secondary)',
                    muted: 'var(--text-muted)'
                }
            }
        },
    },
    plugins: [],
}
