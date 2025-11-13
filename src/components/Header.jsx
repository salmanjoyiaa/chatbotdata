export default function Header() {
return (
<header className="sticky top-0 z-10 backdrop-blur bg-white/60 border-b border-slate-200/60">
<div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
<img src="/logo.svg" alt="Property AI Chatbot" className="h-7 w-7" />
<div>
<h1 className="text-slate-800 font-semibold leading-none">Property AI Chatbot</h1>
<p className="text-xs text-slate-500">Elegant • Fast • Helpful</p>
</div>
</div>
</header>
)
}