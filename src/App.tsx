import { useState, useRef, useEffect } from 'react'
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  model: string
  timestamp: number
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDark, setIsDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chats from cookies on mount
  useEffect(() => {
    const savedChats = document.cookie
      .split('; ')
      .find(row => row.startsWith('chats='))
    
    if (savedChats) {
      const chatsData = JSON.parse(decodeURIComponent(savedChats.split('=')[1]))
      setChats(chatsData)
    }
  }, [])

  // Save chats to cookies whenever they change
  useEffect(() => {
    document.cookie = `chats=${encodeURIComponent(JSON.stringify(chats))}; path=/; max-age=31536000`
  }, [chats])

  // Add dark mode class to body
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Fetch available models on component mount
  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags')
      const data = await response.json()
      const modelNames = data.models.map((model: any) => model.name)
      setModels(modelNames)
      setSelectedModel(modelNames[0] || '')
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: selectedModel,
      timestamp: Date.now()
    }
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    setMessages([])
  }

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
      setSelectedModel(chat.model)
    }
    setIsNavOpen(false)
  }

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedModel) return

    // Create new chat if none is selected
    if (!currentChatId) {
      createNewChat()
    }

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Update chat history
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: newMessages, title: input.slice(0, 30) } 
        : chat
    ))

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: input,
          stream: true,
        }),
      })

      const reader = response.body?.getReader()
      let assistantMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.trim() === '') continue
            const data = JSON.parse(line)
            assistantMessage += data.response
            setMessages(prev => {
              const newMessages = [...prev]
              if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                newMessages[newMessages.length - 1].content = assistantMessage
              } else {
                newMessages.push({ role: 'assistant', content: assistantMessage })
              }
              return newMessages
            })
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Side Navigation */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform 
        ${isNavOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out
        border-r border-gray-200 dark:border-gray-700 md:relative md:translate-x-0`}>
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
              transition-colors duration-200"
          >
            New Chat
          </button>
          
          <div className="mt-4 space-y-2">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`p-2 rounded-lg cursor-pointer flex justify-between items-center
                  ${chat.id === currentChatId 
                    ? 'bg-blue-100 dark:bg-blue-900' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <span className="truncate">{chat.title || 'New Chat'}</span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="absolute top-4 left-4 z-10 md:hidden">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 
              dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Model selector */}
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="p-2 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm
                dark:focus:ring-blue-400"
            >
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto my-4 p-4 space-y-4 scrollbar-w-2 
            scrollbar-track-blue-lighter scrollbar-thumb-blue scrollbar-thumb-rounded">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2.5 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center
                    ${message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {message.role === 'user' ? 'U' : 'AI'}
                  </div>
                </div>

                <div className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`relative max-w-xl px-4 py-2 rounded-lg shadow-sm
                    ${message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`absolute bottom-0 ${
                      message.role === 'user' 
                        ? 'right-0 transform translate-y-1/2' 
                        : 'left-0 transform translate-y-1/2'
                    }`}>
                      <div className={`w-2 h-2 transform rotate-45 ${
                        message.role === 'user'
                          ? 'bg-blue-500'
                          : 'bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700'
                      }`} />
                    </div>
                    
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 
                    flex items-center justify-center text-gray-600 dark:text-gray-300">
                    AI
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                  rounded-lg px-4 py-2 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-white dark:bg-gray-800 
            border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base 
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500
                dark:disabled:text-gray-400"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-base 
                hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-900 transition-colors duration-200"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
