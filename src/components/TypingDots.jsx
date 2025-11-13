export default function TypingDots() {
return (
<div className="flex items-center gap-2">
<div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 inline-flex items-center gap-2">
<span className="sr-only">Bot is typing</span>
<div className="flex gap-1">
<span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]"></span>
<span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
<span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
</div>
</div>
</div>
)
}