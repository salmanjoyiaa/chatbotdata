export default function TypingDots() {
return (
<div className="flex items-center gap-2 mb-4">
<div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-3xl border border-slate-200/60 px-4 py-3 inline-flex items-center gap-2 shadow-md">
<span className="sr-only">Bot is typing</span>
<div className="flex gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 animate-bounce [animation-delay:-0.2s]"></span>
<span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 animate-bounce [animation-delay:0s]"></span>
<span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 animate-bounce [animation-delay:0.2s]"></span>
</div>
</div>
</div>
)
}