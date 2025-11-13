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
}
},
boxShadow: {
soft: '0 8px 30px rgba(0,0,0,0.08)'
},
backgroundImage: {
'gradient-soft': 'radial-gradient(1200px 600px at 10% 0%, rgba(93, 173, 236, 0.25) 0%, rgba(255,255,255,0) 60%), radial-gradient(1200px 600px at 90% 0%, rgba(214, 188, 250, 0.25) 0%, rgba(255,255,255,0) 60%)'
}
},
},
plugins: [],
}