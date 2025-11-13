import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatMessage({ role = 'bot', text = '', timestamp }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <motion.div
        layout
        className={`relative bubble ${isUser ? 'user bg-primary-500 text-white' : 'bot bg-white text-slate-800'} rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border ${isUser ? 'border-primary-600/20' : 'border-slate-200'}`}
      >
        {/* Markdown-rendered message */}
        <div className="prose prose-sm prose-slate max-w-none
                        prose-p:my-1 prose-strong:font-semibold
                        prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:p-3
                        prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-slate-100
                        prose-a:underline hover:prose-a:no-underline">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            // Keep it safe: don't allow raw HTML from messages
            skipHtml
            components={{
              p: ({ node, ...props }) => <p className="whitespace-pre-wrap leading-relaxed" {...props} />,
              a: ({ node, ...props }) => (
                <a target="_blank" rel="noopener noreferrer" {...props} />
              ),
            }}
          >
            {text || ''}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <div className={`mt-1 text-[10px] ${isUser ? 'text-white/80' : 'text-slate-400'}`}>
            {timestamp}
          </div>
        )}
      </motion.div>
    </div>
  )
}
