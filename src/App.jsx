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
<div className="min-h-screen flex flex-col">
<Header />


<main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 pb-28">
<div
ref={listRef}
className="mt-6 bg-white/90 backdrop-blur rounded-3xl shadow-soft p-4 sm:p-6 h-[68vh] sm:h-[72vh] overflow-y-auto border border-slate-100"
>
<AnimatePresence initial={false}>
{messages.map((m) => (
<motion.div
key={m.id}
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -6 }}
transition={{ duration: 0.18 }}
className="mb-3"
>
<ChatMessage role={m.role} text={m.text} timestamp={m.timestamp} />
</motion.div>
))}
</AnimatePresence>


{isLoading && (
<div className="mb-3">
<TypingDots />
</div>
)}


{error && (
<div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
{error}
</div>
)}
</div>
</main>


<ChatInput onSend={sendMessage} />
</div>
)
}