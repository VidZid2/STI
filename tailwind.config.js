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
    		},
    		keyframes: {
    			'skeleton-shimmer': {
    				'0%': {
    					transform: 'translateX(-100%)'
    				},
    				'100%': {
    					transform: 'translateX(100%)'
    				}
    			},
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'skeleton-shimmer': 'skeleton-shimmer 1.8s ease-in-out infinite',
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
    plugins: [],
}
