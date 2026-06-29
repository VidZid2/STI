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
                brand: "hsl(var(--brand))",
                "brand-foreground": "hsl(var(--brand-foreground))",
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
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
            maxWidth: {
                container: "80rem",
            },
            boxShadow: {
                glow: "0 -16px 128px 0 rgba(96, 165, 250, 0.5) inset, 0 -16px 32px 0 rgba(37, 99, 235, 0.5) inset",
            },
    		keyframes: {
                "fade-in-up": {
                  "0%": { 
                    opacity: "0",
                    transform: "translateY(10px)"
                  },
                  "100%": {
                    opacity: "1",
                    transform: "translateY(0)"
                  }
                },
                "fade-in": {
                  "0%": {
                    opacity: "0"
                  },
                  "100%": {
                    opacity: "1"
                  }
                },
                "scale-in": {
                  "0%": {
                    opacity: "0",
                    transform: "scale(0.95)"
                  },
                  "100%": {
                    opacity: "1",
                    transform: "scale(1)"
                  }
                },
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
    			},
    			shake: {
    				'0%, 100%': { transform: 'translateX(0)' },
    				'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
    				'20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
    			}
    		},
    		animation: {
                "fade-in-up": "fade-in-up 0.5s ease-out forwards",
                "fade-in": "fade-in 0.5s ease-out forwards",
                "scale-in": "scale-in 0.5s ease-out forwards",
    			'skeleton-shimmer': 'skeleton-shimmer 1.8s ease-in-out infinite',
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'shake': 'shake 0.4s ease-in-out'
    		}
    	}
    },
    plugins: [],
}
