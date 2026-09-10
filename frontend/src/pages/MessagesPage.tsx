import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_URL, MessagesApi, UploadApi } from '../services/api'
import { Avatar } from '../components/Avatar'
import { useAuth, useUi } from '../store/auth'
import { Protected } from '../components/Layout'
import type { ChatMessage, Conversation } from '../types'
import { formatTime } from '../utils/format'
import { ImagePlus, Send } from 'lucide-react'
import { io } from 'socket.io-client'

const emojis = ['😀', '👍', '❤️', '🔥', '🏠', '🚗', '✅', '🙏']

export default function MessagesPage() {
  const { id } = useParams()
  const [list, setList] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [current, setCurrent] = useState<Conversation | null>(null)
  const [text, setText] = useState('')
  const user = useAuth((s) => s.user)
  const toast = useUi((s) => s.toast)
  const nav = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)
  const token = useAuth((s) => s.token)

  const loadList = useCallback(async () => {
    const { data } = await MessagesApi.list()
    setList((data as { items: Conversation[] }).items)
  }, [])

  const loadThread = useCallback(async (cid: number) => {
    const { data } = await MessagesApi.thread(cid)
    const payload = data as { item: Conversation; messages: ChatMessage[] }
    setCurrent(payload.item)
    setMessages(payload.messages)
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (id) loadThread(Number(id))
  }, [id, loadThread])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages.length])

  useEffect(() => {
    if (!token) return
    const socket = io(API_URL || '/', { auth: { token } })
    socket.on('message', (payload: { conversationId: number; message: ChatMessage }) => {
      if (Number(id) === payload.conversationId) {
        setMessages((m) => [...m, payload.message])
      }
      loadList()
    })
    return () => {
      socket.disconnect()
    }
  }, [token, id, loadList])

  async function send(extra?: { imageUrl?: string; text?: string }) {
    if (!id) return
    const payload = { text: extra?.text ?? text, imageUrl: extra?.imageUrl }
    if (!payload.text && !payload.imageUrl) return
    try {
      const { data } = await MessagesApi.send(Number(id), payload)
      setMessages((m) => [...m, (data as { item: ChatMessage }).item])
      setText('')
      loadList()
    } catch (e) {
      toast((e as Error).message, 'err')
    }
  }

  return (
    <Protected>
      <div className="grid overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] md:grid-cols-[320px_1fr]" style={{ minHeight: 560 }}>
        <aside className={`border-r border-line ${id ? 'hidden md:block' : ''}`}>
          <div className="border-b border-line p-4 font-extrabold">Сообщения</div>
          <div className="max-h-[70vh] overflow-y-auto">
            {list.length === 0 && <p className="p-6 text-sm text-muted">Пока нет диалогов. Напишите продавцу с карточки объявления.</p>}
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => nav(`/messages/${c.id}`)}
                className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-bg ${Number(id) === c.id ? 'bg-bg' : ''}`}
              >
                <Avatar src={c.other.avatar} name={c.other.name} className="h-12 w-12 text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">{c.other.name}</span>
                    {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-white">{c.unread}</span>}
                  </div>
                  <p className="truncate text-sm text-muted">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <section className={`flex flex-col ${!id ? 'hidden md:flex' : ''}`}>
          {!current ? (
            <div className="grid flex-1 place-items-center text-muted">Выберите диалог</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line p-4">
                <Link to="/messages" className="md:hidden text-primary font-bold">←</Link>
                <Avatar src={current.other.avatar} name={current.other.name} className="h-10 w-10 text-sm" />
                <div>
                  <div className="font-bold">{current.other.name}</div>
                  <div className="text-xs text-muted">{current.other.lastSeen ? 'был(а) недавно' : 'онлайн'}</div>
                </div>
                {current.listing && (
                  <Link to={`/listings/${current.listing.id}`} className="ml-auto truncate text-sm font-semibold text-primary">
                    {current.listing.title}
                  </Link>
                )}
              </div>
              <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto bg-bg p-4">
                {messages.map((m) => {
                  const mine = m.senderId === user?.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-white'}`}>
                        {m.imageUrl && <img src={m.imageUrl} className="mb-1 max-h-48 rounded-xl" alt="" />}
                        {m.text}
                        <div className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-line p-3">
                <div className="mb-2 flex gap-1 overflow-x-auto no-scrollbar">
                  {emojis.map((e) => (
                    <button key={e} onClick={() => setText((t) => t + e)} className="text-lg">
                      {e}
                    </button>
                  ))}
                </div>
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    send()
                  }}
                >
                  <label className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-bg">
                    <ImagePlus size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files
                        if (!f?.length) return
                        const files = await UploadApi.files(f)
                        send({ imageUrl: files[0].url })
                      }}
                    />
                  </label>
                  <input className="h-11 flex-1 rounded-full bg-bg px-4 outline-none" placeholder="Сообщение" value={text} onChange={(e) => setText(e.target.value)} />
                  <button type="submit" className="grid h-11 w-11 place-items-center rounded-full bg-primary text-white">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </Protected>
  )
}
