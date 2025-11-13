import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import TypingDots from './components/TypingDots'
import useChat from './hooks/useChat'
import useAutoScroll from './hooks/useAutoScroll'


export default function App() {
const { messages, sendMessage, isLoading, error } = useChat()
const listRef = useRef(null)
useAutoScroll(listRef, [messages, isLoading])


useEffect(() => {
// On first load, greet the user if there are no messages
if (!messages.length) {
sendMessage('', {
systemGreet: true,
})
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])


return (
<div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
<Header />

<main className="flex-1 mx-auto w-full max-w-4xl px-3 sm:px-6 lg:px-8 pb-32 sm:pb-40 md:pb-44">
<div
ref={listRef}
className="mt-4 sm:mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-4 sm:p-8 h-[65vh] sm:h-[70vh] overflow-y-auto border border-slate-200/50 scroll-smooth"
>
<AnimatePresence initial={false}>
{messages.length === 0 && !isLoading && (
<motion.div
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
className="text-center py-12"
>
<div className="text-5xl mb-3">🏠</div>
<h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Property AI</h2>
<p className="text-slate-500">Ask me about properties, amenities, pricing, and more!</p>
</motion.div>
)}
{messages.map((m) => (
<motion.div
key={m.id}
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -6 }}
transition={{ duration: 0.2 }}
>
<ChatMessage role={m.role} text={m.text} timestamp={m.timestamp} />
</motion.div>
))}
</AnimatePresence>

{isLoading && (
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
>
<TypingDots />
</motion.div>
)}

{error && (
<motion.div
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200/60 rounded-xl p-4 shadow-sm"
>
<div className="flex items-start gap-2">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
</svg>
<span>{error}</span>
</div>
</motion.div>
)}
</div>
</main>

<ChatInput onSend={sendMessage} />
</div>
)
}