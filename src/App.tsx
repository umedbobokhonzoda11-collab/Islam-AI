/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  User as UserIcon, 
  RotateCcw, 
  Plus, 
  Mic, 
  AudioLines, 
  Sparkles,
  ArrowUp,
  BookOpen,
  Search,
  X,
  History,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getChatResponse, Message } from './lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { createChat, saveMessage, getChats, getMessages, Chat } from './lib/chats';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { isApiKeyMissing } from './lib/gemini';
import { AlertCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isHistoryOpen) {
      loadChats();
    }
  }, [user, isHistoryOpen]);

  const loadChats = async () => {
    if (!user) return;
    const userChats = await getChats(user.uid);
    setChats(userChats || []);
  };

  const selectChat = async (chat: Chat) => {
    setIsLoading(true);
    setActiveChatId(chat.id);
    const history = await getMessages(chat.id);
    if (history) {
      setMessages(history.map(m => ({ role: m.role, text: m.text })));
    }
    setIsHistoryOpen(false);
    setIsLoading(false);
  };

  useEffect(() => {
    // Only scroll to bottom when the user sends a new message
    if (scrollRef.current && messages.length > 0 && messages[messages.length - 1].role === 'user') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tg-TJ'; // Attempt Tajik, fallback to auto

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const toggleSpeaking = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Файли "${file.name}" интихоб шуд. (Дар ин нусха танҳо намоиш дода мешавад)`);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', text: currentInput };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      let chatId = activeChatId;
      
      // Only process Firestore if user is authenticated
      if (user) {
        if (!chatId) {
          chatId = await createChat(user.uid, currentInput) || null;
          setActiveChatId(chatId);
        }

        if (chatId) {
          await saveMessage(chatId, 'user', currentInput);
        }
      }

      const responseText = await getChatResponse(newMessages);
      const modelMessage: Message = { role: 'model', text: responseText };
      setMessages([...newMessages, modelMessage]);

      if (user && chatId) {
        await saveMessage(chatId, 'model', responseText);
      }
    } catch (error) {
      console.error(error);
      // Optional: Add a user-visible error message here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
  };

  return (
    <div className="flex h-[100dvh] bg-[#fdfbf7] overflow-hidden text-[13px] relative font-sans">
      {/* Sophisticated Islamic Layout Enhancements */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-white/60 via-transparent to-transparent pointer-events-none z-0"></div>
      
      {/* Ornate Islamic Star Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l5 15 15 5-15 5-5 15-5-15-15-5 15-5z' fill='%231a1a1a'/%3E%3Ccircle cx='30' cy='30' r='2' fill='%231a1a1a'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      ></div>
      
      {/* Sidebar for History */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-[280px] sm:w-[320px] bg-white border-r border-stone-200 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <span className="font-bold text-stone-800 flex items-center gap-2 text-sm">
                  <History className="w-4 h-4" />
                  Таърихи чатҳо
                </span>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-stone-200/50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-xs italic">
                    Ҳанӯз чате нест
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl transition-all group relative border border-transparent active:scale-[0.98]",
                        activeChatId === chat.id ? "bg-stone-100 border-stone-200 shadow-sm" : "hover:bg-stone-50"
                      )}
                    >
                      <div className="text-[14px] font-medium text-stone-700 truncate pr-4">
                        {chat.title}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5" />
                        {chat.updatedAt?.toDate().toLocaleDateString('tg-TJ')}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {user ? (
                <div className="p-4 border-t border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-900 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        user.email?.[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-stone-800 truncate">{user.displayName || user.email}</p>
                    </div>
                    <button onClick={() => signOut(auth)} className="p-2 text-stone-400 hover:text-rose-500 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-stone-100 bg-stone-50/50">
                  <button 
                    onClick={() => signInWithGoogle()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all text-sm font-medium shadow-md"
                  >
                    <UserIcon className="w-4 h-4" />
                    Ворид шудан
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 py-1 sticky top-0 w-full bg-white/90 backdrop-blur-lg z-30 border-b border-stone-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-1 hover:bg-stone-100 active:bg-stone-200 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-stone-700" />
            </button>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-stone-900 tracking-tight leading-none">Islam.ai</span>
              <span className="text-[9px] text-stone-500 font-medium">Танҳо аз сарчашмаҳои боэътимод</span>
            </div>
          </div>
          <button 
            onClick={startNewChat} 
            className="p-1.5 hover:bg-stone-100 active:bg-stone-200 rounded-lg transition-colors md:px-3 md:py-1 md:bg-stone-50 md:border md:border-stone-200 md:flex md:items-center md:gap-2"
          >
            <Plus className="w-4 h-4 text-stone-700" />
            <span className="hidden md:inline text-[11px] font-semibold text-stone-700">Чати нав</span>
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {isApiKeyMissing && (
            <div className="mx-4 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-bold text-rose-900">API Key ёфт нашуд</h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Барои он ки AI кор кунад, шумо бояд калиди Gemini API-ро илова кунед. 
                  Агар дар <b>Vercel</b> бошед, ба танзимот дароед ва <code>VITE_GEMINI_API_KEY</code>-ро илова кунед.
                </p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 mt-1 decoration-1 underline-offset-2 hover:underline"
                >
                  Гирифтани API Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
          <div 
            ref={scrollRef}
            className="h-full overflow-y-auto px-4 pb-32 md:px-6 max-w-3xl mx-auto w-full pt-4 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 px-6 text-center relative z-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-stone-900 rounded-[2rem] flex items-center justify-center shadow-2xl mb-4 rotate-3"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-stone-800 leading-tight max-w-md tracking-tight">
                    Ассалому алайкум
                  </h2>
                  <p className="text-stone-500 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
                    Ба шумо чӣ тавр кӯмак карда метавонам? Пурсишҳои худро дар бораи дин нависед.
                  </p>
                </div>

                {!user && (
                  <button 
                    onClick={() => signInWithGoogle()}
                    className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all text-sm font-bold shadow-xl hover:shadow-2xl active:scale-95"
                  >
                    <UserIcon className="w-5 h-5" />
                    Ворид шудан ба система
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8 py-3">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex w-full",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[95%] sm:max-w-[85%] relative",
                        msg.role === 'user' 
                          ? "bg-stone-900 text-white px-5 py-3 rounded-2xl rounded-tr-none text-[14px] shadow-lg" 
                          : "text-stone-800 w-full"
                      )}>
                        {msg.role === 'model' ? (
                          <div className="flex gap-4">
                            <div className="hidden sm:flex w-8 h-8 rounded-full bg-stone-100 items-center justify-center mt-1 flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-stone-800" />
                            </div>
                            <div className="markdown-body prose prose-stone prose-sm max-w-none text-[14.5px] leading-relaxed flex-1">
                              <ReactMarkdown
                                components={{
                                  blockquote: ({ node, ...props }) => (
                                    <div className="my-4 border-l-4 border-stone-800 bg-stone-50/80 py-3 px-4 rounded-r-xl italic text-blue-800 shadow-sm relative overflow-hidden text-[12px] leading-relaxed">
                                      <div className="absolute top-0 right-0 p-1 opacity-5">
                                        <BookOpen className="w-6 h-6" />
                                      </div>
                                      <div className="font-arabic text-[16px] leading-loose not-italic" dir="auto">
                                        {props.children}
                                      </div>
                                    </div>
                                  ),
                                  strong: ({ node, ...props }) => (
                                    <strong {...props} className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded shadow-sm" />
                                  ),
                                  a: ({ node, ...props }) => {
                                    return <a {...props} className="text-blue-600 hover:underline font-bold decoration-2 underline-offset-2" target="_blank" rel="noreferrer" />;
                                  }
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isLoading && (
                  <div className="flex items-center gap-4 py-2">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="absolute inset-0 border-3 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                      <Sparkles className="w-5 h-5 text-stone-300" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[14px] font-bold text-stone-800 animate-pulse block">Islam.ai фикр дорад...</span>
                      <span className="text-[11px] text-stone-400 block italic">Ҷустуҷӯ дар манбаъҳои саҳеҳ</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Floating Input Bar */}
        <div className="fixed bottom-0 left-0 w-full px-4 pb-2 bg-white/95 backdrop-blur-xl border-t border-stone-100 pt-1 z-40">
          <div className="max-w-3xl mx-auto flex flex-col gap-1">
            <div className="flex items-center gap-2 bg-stone-100 rounded-full p-1 shadow-inner border border-stone-200/50 transition-all focus-within:bg-white focus-within:shadow-xl focus-within:border-stone-300">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="ml-1 p-1.5 hover:bg-stone-200/50 rounded-full text-stone-500 transition-colors flex-shrink-0"
                title="Илова кардани файл"
              >
                <Plus className="w-4 h-4" />
              </button>


              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Савол диҳед..."
                className="flex-1 bg-transparent py-1 px-4 border-none focus:ring-0 outline-none text-[13px] sm:text-[14px] text-stone-800 placeholder-stone-400"
              />

              <div className="flex items-center gap-1.5 pr-1">
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 active:scale-90 transition-all disabled:opacity-20 shadow-lg"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[9px] text-stone-400 text-center font-medium">
              Islam.ai метавонад баъзан хато кунад. Лутфан бо аҳли илм низ машварат кунед.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
