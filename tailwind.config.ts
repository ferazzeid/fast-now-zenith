import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['Inter', 'ui-monospace', 'SFMono-Regular', 'monospace'],
			},
			fontSize: {
				'ui-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }], // 14px - Navigation, UI elements
				'ui-xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],     // 12px - Small UI elements
				'label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }], // 14px - Form labels
				'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],       // 16px - Regular text
				'heading': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 18px - Card titles
				'page-title': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }], // 24px - Page headers
			},
			spacing: {
				'safe': 'env(safe-area-inset-bottom)',
				'safe-top': 'env(safe-area-inset-top)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			colors: {
				border: 'hsl(var(--border))',
				'border-subtle': 'hsl(var(--border-subtle))',
				'border-normal': 'hsl(var(--border-normal))',
				'border-emphasis': 'hsl(var(--border-emphasis))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
				},
				ceramic: {
					light: 'hsl(var(--ceramic-light))',
					base: 'hsl(var(--ceramic-base))',
					warm: 'hsl(var(--ceramic-warm))',
					shadow: 'hsl(var(--ceramic-shadow))',
					deep: 'hsl(var(--ceramic-deep))',
					plate: 'hsl(var(--ceramic-plate))',
					rim: 'hsl(var(--ceramic-rim))'
				},
				progress: {
					active: 'hsl(var(--progress-active))',
					bg: 'hsl(var(--progress-bg))'
				},
				warm: {
					text: 'hsl(var(--warm-text))'
				},
				shadow: {
					soft: 'hsl(var(--soft-shadow))'
				},
				frame: {
					background: 'hsl(var(--frame-background))'
				},
				ai: {
					DEFAULT: 'hsl(var(--ai))',
					foreground: 'hsl(var(--ai-foreground))'
				},
				'chat-ai': {
					DEFAULT: 'hsl(var(--chat-ai))'
				},
				'chat-user': {
					DEFAULT: 'hsl(var(--chat-user))'
				},
				metaverse: {
					bg: 'hsl(var(--metaverse-bg))',
					border: 'hsl(var(--metaverse-border))',
					magenta: 'hsl(var(--metaverse-magenta))',
					green: 'hsl(var(--metaverse-green))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
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
				'slideInUp': {
					'0%': {
						transform: 'translateY(20px) scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0) scale(1)',
						opacity: '1'
					}
				},
				'fadeOut': {
					'0%': { opacity: '1', transform: 'scale(1)' },
					'100%': { opacity: '0', transform: 'scale(0.95)' }
				},
				'float-up': {
					'0%': { 
						transform: 'translateY(100vh) scale(0.8)',
						opacity: '0'
					},
					'10%': {
						opacity: '1'
					},
					'90%': {
						opacity: '1'
					},
					'100%': { 
						transform: 'translateY(-20vh) scale(1.1)',
						opacity: '0'
					}
				},
				'float-down': {
					'0%': { 
						transform: 'translateY(-20vh) scale(0.8)',
						opacity: '0'
					},
					'10%': {
						opacity: '1'
					},
					'90%': {
						opacity: '1'
					},
					'100%': { 
						transform: 'translateY(100vh) scale(1.1)',
						opacity: '0'
					}
				},
				'success-flash': {
					'0%': { 
						backgroundColor: 'hsl(var(--primary) / 0.1)',
						transform: 'scale(1)'
					},
					'50%': { 
						backgroundColor: 'hsl(var(--primary) / 0.3)',
						transform: 'scale(1.02)'
					},
					'100%': { 
						backgroundColor: 'hsl(var(--muted) / 0.2)',
						transform: 'scale(1)'
					}
				},
				'button-success': {
					'0%': { 
						transform: 'scale(1)',
						backgroundColor: 'hsl(var(--primary))'
					},
					'50%': { 
						transform: 'scale(1.1)',
						backgroundColor: 'hsl(var(--primary) / 0.8)'
					},
					'100%': { 
						transform: 'scale(1)',
						backgroundColor: 'hsl(var(--primary))'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'chat-bubble-in': 'slideInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'chat-bubble-out': 'fadeOut 0.3s ease-out',
				'float-up': 'float-up 4s ease-out forwards',
				'float-down': 'float-down 4s ease-out forwards',
				'success-flash': 'success-flash 0.6s ease-out',
				'button-success': 'button-success 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/line-clamp")],
} satisfies Config;