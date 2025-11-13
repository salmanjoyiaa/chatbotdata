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
<div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-4 pb-5">
<div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
<motion.div
initial={{ y: 30, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ type: 'spring', stiffness: 200, damping: 24 }}
className="flex items-end gap-2 bg-white rounded-2xl shadow-soft p-2 border border-slate-100"
>
<textarea
className="flex-1 resize-none outline-none p-3 rounded-xl h-12 max-h-40 text-sm bg-white"
placeholder="Ask about units, Wi‑Fi, check‑in, parking, etc."
value={value}
onChange={(e) => setValue(e.target.value)}
onKeyDown={handleKeyDown}
/>
<button
onClick={handleSend}
disabled={sending || !value.trim()}
className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
aria-label="Send"
>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
<path d="M2.94 2.94a.75.75 0 0 1 .82-.17l13.5 5.4a.75.75 0 0 1 0 1.38l-13.5 5.4a.75.75 0 0 1-1.03-.87l1.33-4.67a.75.75 0 0 1 .52-.52l7.11-2.1-7.11-2.1a.75.75 0 0 1-.52-.52L2.73 3.1a.75.75 0 0 1 .21-.16z"/>
</svg>
Send
</button>
</motion.div>
</div>
</div>
)
}