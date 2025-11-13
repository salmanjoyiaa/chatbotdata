export default function Header() {
return (
<header className="sticky top-0 z-10 backdrop-blur-md bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg">
<div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
<path d="M11.97 3.979a.75.75 0 00-1.94 0A8.25 8.25 0 005.25 9H1.5a.75.75 0 000 1.5H3v9a3 3 0 003 3h12a3 3 0 003-3v-9h1.5a.75.75 0 000-1.5h-3.75A8.25 8.25 0 0011.97 3.979zM9 12.75a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm4-1.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6zm4 1.5a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" />
</svg>
</div>
<div>
<h1 className="text-white font-bold text-lg leading-tight">Property AI</h1>
<p className="text-xs text-blue-200 font-medium">Smart Assistant</p>
</div>
</div>
<div className="text-2xl">🏠</div>
</div>
</header>
)
}