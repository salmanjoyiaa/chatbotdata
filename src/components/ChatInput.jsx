import { useState } from 'react'
import { motion } from 'framer-motion'


export default function ChatInput({ onSend }) {
const [value, setValue] = useState('')
const [sending, setSending] = useState(false)


const handleSend = async () => {
const message = value.trim()
if (!message || sending) return
setSending(true)
setValue('')
try {
await onSend(message)
} finally {
setSending(false)
}
}


const handleKeyDown = (e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault()
handleSend()
}
}


return (
<div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-3 pb-4 sm:pb-6 md:pb-8">
<div className="mx-auto w-full max-w-3xl px-3 sm:px-6 lg:px-8">
<motion.div
initial={{ y: 30, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ type: 'spring', stiffness: 200, damping: 24 }}
className="flex items-end gap-2 bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-shadow p-2 sm:p-3 border border-slate-200/80 backdrop-blur-sm"
>
<textarea
className="flex-1 resize-none outline-none p-3 sm:p-4 rounded-xl h-12 max-h-40 text-sm sm:text-base bg-slate-50 hover:bg-slate-100 transition-colors placeholder-slate-400"
placeholder="Ask about properties, pricing, amenities..."
value={value}
onChange={(e) => setValue(e.target.value)}
onKeyDown={handleKeyDown}
/>
<button
onClick={handleSend}
disabled={sending || !value.trim()}
className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 py-3 text-sm font-semibold hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all active:scale-95"
aria-label="Send message"
>
{sending ? (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-5 sm:h-5 animate-spin">
<circle cx="12" cy="12" r="10"/>
</svg>
) : (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
<path d="M2.94 2.94a.75.75 0 0 1 .82-.17l13.5 5.4a.75.75 0 0 1 0 1.38l-13.5 5.4a.75.75 0 0 1-1.03-.87l1.33-4.67a.75.75 0 0 1 .52-.52l7.11-2.1-7.11-2.1a.75.75 0 0 1-.52-.52L2.73 3.1a.75.75 0 0 1 .21-.16z"/>
</svg>
)}
</button>
</motion.div>
</div>
</div>
)
}