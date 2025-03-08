"use client"

import { useEffect, useState, useRef } from "react"
import type { Socket } from "socket.io-client"
import io from "socket.io-client"
import EmojiPicker from "emoji-picker-react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Home, Headphones, Smile, X, Menu, User, LogOut } from "lucide-react"
import dynamic from "next/dynamic"

interface Message {
  id: number
  message: string
  from: "admin" | "user"
  timestamp: Date
}

const Navbar = dynamic(() => import('../components/Navbar'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-16 bg-gray-800 fixed top-0 left-0 z-50" />
  ),
})

const UserChat = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
<<<<<<< HEAD
    const socketConnection: Socket = io('https://www.skybeats.site'); // Replace with your backend Socket.io URL
    setSocket(socketConnection);
=======
    try {
      const socketConnection: Socket = io("http://localhost:3300")
      setSocket(socketConnection)
>>>>>>> 97fc021 (test commit after ui animation)

      socketConnection.emit("identify", "user")

      socketConnection.on("privateMessageFromAdmin", (data: { message: string }) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 1,
            message: data.message,
            from: "admin",
            timestamp: new Date(),
          },
        ])
      })

      return () => {
        socketConnection.disconnect()
      }
    } catch (error) {
      console.error("Socket connection error:", error)
    }
  }, [])

  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji)
  }

  const sendMessage = () => {
    if (message.trim()) {
      socket?.emit("privateMessageToAdmin", { message })
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          message,
          from: "user",
          timestamp: new Date(),
        },
      ])
      setMessage("")
      setShowEmojiPicker(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="dark">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col justify-center items-center h-screen bg-gray-900"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mb-6">
                <Headphones className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <motion.p
              className="text-white font-extrabold font-sans text-xl mb-6"
              animate={{
                opacity: [0.5, 1, 0.5],
                transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
              }}
            >
              Loading Customer Support Please Wait...
            </motion.p>

            <motion.div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-900 text-white"
          >
            {/* Optimized Navbar Container */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Navbar />
            </motion.div>

            <div className="flex w-full h-[calc(100vh-64px)] bg-gray-900 rounded-lg mt-20">
              {/* Sidebar */}
              <motion.div
                className="w-1/4 bg-gray-800 shadow-lg p-4"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-4 mb-8 p-2 bg-gray-700/50 rounded-lg">
                  <motion.div
                    className="w-12 h-12 rounded-full border-2 border-purple-500 bg-gray-700 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <User className="w-6 h-6 text-purple-300" />
                  </motion.div>
                  <h2 className="font-bold text-lg">Mark Norway</h2>
                </div>

                <nav>
                  <ul className="space-y-3">
                    <motion.li
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center p-3 rounded-lg bg-gradient-to-r from-purple-800/50 to-blue-800/50 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md"
                    >
                      <Home className="w-5 h-5 mr-3" />
                      <span className="font-bold">Home</span>
                    </motion.li>

                    <motion.li
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center p-3 rounded-lg bg-gradient-to-r from-purple-800/30 to-blue-800/30 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md"
                    >
                      <Headphones className="w-5 h-5 mr-3" />
                      <span className="font-bold">Chat Bot</span>
                    </motion.li>
                  </ul>
                </nav>
              </motion.div>

              {/* Chat Section */}
              <div className="flex-grow flex">
                {/* Chat List */}
                <motion.div
                  className="w-1/3 bg-gray-800 border-r border-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-purple-300">Chats</h3>
                  </div>
                  <ul className="space-y-2 p-4">
                    <motion.li
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                      whileHover={{ x: 5 }}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full border border-purple-500 bg-gray-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-300" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">Client</h4>
                        <p className="text-sm text-gray-400">This is a short message...</p>
                      </div>
                    </motion.li>
                  </ul>
                </motion.div>

                {/* Chat Window */}
                <motion.div
                  className="w-2/3 bg-gray-900 flex flex-col relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Chat with Admin</h2>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Online</span>
                  </div>

                  <div className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", damping: 15 }}
                          className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`relative max-w-xs ${msg.from === "user" ? "order-1" : "order-2"}`}>
                            <div
                              className={`p-3 rounded-2xl shadow-lg ${
                                msg.from === "user"
                                  ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-br-none"
                                  : "bg-gray-800 text-white rounded-bl-none"
                              }`}
                            >
                              <p className="font-medium">{msg.message}</p>
                              <span className="text-xs opacity-70 block text-right mt-1">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-gray-800 p-4">
                    <div className="relative flex items-center bg-gray-800 rounded-lg p-1">
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            className="absolute bottom-full mb-2 left-0 z-10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                          >
                            <div className="relative">
                              <button
                                className="absolute top-2 right-2 p-1 bg-gray-700 rounded-full text-white z-10"
                                onClick={() => setShowEmojiPicker(false)}
                              >
                                <X size={16} />
                              </button>
                              <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        className="p-2 rounded-md text-gray-300 hover:text-white"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                      >
                        <Smile size={20} />
                      </motion.button>

                      <input
                        type="text"
                        placeholder="Type a message"
                        value={message}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            sendMessage()
                          }
                        }}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-grow p-2 bg-transparent text-white font-medium focus:outline-none"
                      />

                      <motion.button
                        onClick={sendMessage}
                        className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={!message.trim()}
                      >
                        <Send size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserChat