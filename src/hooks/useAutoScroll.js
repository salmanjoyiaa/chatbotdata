import { useEffect } from 'react'


export default function useAutoScroll(ref, deps = []) {
useEffect(() => {
const el = ref.current
if (!el) return
el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
// eslint-disable-next-line react-hooks/exhaustive-deps
}, deps)
}