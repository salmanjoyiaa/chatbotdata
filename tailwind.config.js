/** @type {import('tailwindcss').Config} */
export default {
content: [
'./index.html',
'./src/**/*.{js,jsx}'
],
theme: {
extend: {
colors: {
primary: {
50: '#f1f7ff',
100: '#e3effe',
200: '#c0dbfd',
300: '#9ec7fc',
400: '#5a9ff9',
500: '#1d72f3',
600: '#165ac1',
700: '#11479a',
800: '#0d3777',
900: '#0a2a5b'
},
slate: {
50: '#f9fafb',
100: '#f3f4f6',
200: '#e5e7eb',
300: '#d1d5db',
400: '#9ca3af',
500: '#6b7280',
600: '#4b5563',
700: '#374151',
800: '#1f2937',
900: '#111827'
}
},
boxShadow: {
sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
md: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
lg: '0 10px 30px 0 rgba(0, 0, 0, 0.15)',
xl: '0 20px 40px 0 rgba(0, 0, 0, 0.2)',
soft: '0 8px 30px rgba(0, 0, 0, 0.08)',
sm_modern: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
md_modern: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
lg_modern: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
inset_light: 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)'
},
backgroundImage: {
'gradient-soft': 'radial-gradient(1200px 600px at 10% 0%, rgba(93, 173, 236, 0.15) 0%, rgba(255,255,255,0) 60%), radial-gradient(1200px 600px at 90% 0%, rgba(214, 188, 250, 0.15) 0%, rgba(255,255,255,0) 60%)',
'gradient-modern': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #1d72f3 100%)'
},
animation: {
bounce: 'bounce 1s infinite',
spin: 'spin 1s linear infinite',
pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
fadeIn: 'fadeIn 0.3s ease-in',
slideIn: 'slideIn 0.3s ease-out',
slideUp: 'slideUp 0.3s ease-out'
},
keyframes: {
fadeIn: {
from: { opacity: '0' },
to: { opacity: '1' }
},
slideIn: {
from: { opacity: '0', transform: 'translateX(-10px)' },
to: { opacity: '1', transform: 'translateX(0)' }
},
slideUp: {
from: { opacity: '0', transform: 'translateY(10px)' },
to: { opacity: '1', transform: 'translateY(0)' }
}
}
},
},
plugins: [],
}