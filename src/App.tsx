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
import { createChat, saveMessage, getChats, getMessages, deleteChat, Chat } from './lib/chats';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { isApiKeyMissing } from './lib/gemini';
import { AlertCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const savedBg = localStorage.getItem('islam_ai_bg');
    if (savedBg) {
      setBackground(savedBg);
    }
  }, []);

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

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm('Мехоҳед ин чатро нест кунед?')) {
      await deleteChat(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        startNewChat();
      }
    }
  };

  useEffect(() => {
    // Scroll logic: show the start of the response if it's from the model
    if (scrollRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'model' && !isLoading) {
        // Find the last element in the message list and scroll into view roughly
        const container = scrollRef.current;
        const lastMsgHeaderHeight = 100; // Small buffer
        container.scrollTo({
          top: container.scrollHeight - 800, // Adjust to show top of long model response
          behavior: 'smooth'
        });
      } else {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Файли "${file.name}" интихоб шуд. (Дар ин нусха танҳо намоиш дода мешавад)`);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBackground(base64String);
        localStorage.setItem('islam_ai_bg', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBackground = () => {
    setBackground(null);
    localStorage.removeItem('islam_ai_bg');
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
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden text-[13px] relative font-sans">
      {/* Background layer */}
      {background && (
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: `url('${background}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'saturate(1.2) contrast(1.05)',
          }}
        />
      )}
      {/* Subtle overlay only if background exists */}
      {background && <div className="absolute inset-0 bg-white/10 pointer-events-none z-0"></div>}
      
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
                <div className="flex items-center gap-1">
                  <input 
                    type="file" 
                    ref={bgInputRef} 
                    accept="image/*"
                    onChange={handleBgUpload} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => bgInputRef.current?.click()}
                    className="p-1.5 hover:bg-stone-200 rounded-lg text-emerald-600 transition-all flex items-center justify-center border border-emerald-100 bg-emerald-50"
                    title="Ивази фон"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {background && (
                    <button 
                      onClick={resetBackground}
                      className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 transition-all"
                      title="Тоза кардани фон"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-stone-200/50 rounded-full transition-colors">
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-xs italic">
                    Ҳанӯз чате нест
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div key={chat.id} className="relative group">
                      <button
                        onClick={() => selectChat(chat)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-xl transition-all border border-transparent active:scale-[0.98] pr-10",
                          activeChatId === chat.id ? "bg-stone-100 border-stone-200 shadow-sm" : "hover:bg-stone-50"
                        )}
                      >
                        <div className="text-[14px] font-medium text-stone-700 truncate">
                          {chat.title}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                          <RotateCcw className="w-2.5 h-2.5" />
                          {chat.updatedAt?.toDate().toLocaleDateString('tg-TJ')}
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                        title="Нест кардан"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white z-30 border-b border-stone-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-1.5 hover:bg-stone-100 active:bg-stone-200 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-stone-700" />
            </button>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold text-stone-900 tracking-tight leading-none">Islam.ai</span>
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
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {isApiKeyMissing && (
            <div className="mx-4 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 z-10">
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
            className="flex-1 overflow-y-auto scroll-smooth pb-8 touch-pan-y overscroll-contain"
          >
            <div className="px-4 md:px-6 max-w-3xl mx-auto w-full pt-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 px-6 text-center relative z-10">
                  <div className="space-y-4">
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
                            ? "bg-white text-stone-900 px-5 py-3 rounded-2xl rounded-tr-none text-[14px] shadow-lg font-medium" 
                            : msg.text.startsWith('⚠️')
                              ? "bg-rose-500/90 backdrop-blur-md text-white px-5 py-4 rounded-2xl text-[14px] shadow-sm w-full"
                              : "text-stone-900 w-full py-4"
                        )}>
                          {msg.role === 'model' ? (
                            <div className="flex gap-4">
                              <div className="hidden sm:flex w-8 h-8 rounded-full bg-stone-100 items-center justify-center mt-1 flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-stone-800" />
                              </div>
                              <div className="markdown-body prose prose-stone prose-sm max-w-none text-[14.5px] leading-relaxed flex-1">
                                <ReactMarkdown
                                  components={{
                                    p: ({ node, ...props }) => {
                                      // Helper to extract text from children for language detection
                                      const extractText = (children: any): string => {
                                        if (typeof children === 'string') return children;
                                        if (Array.isArray(children)) return children.map(extractText).join('');
                                        if (children?.props?.children) return extractText(children.props.children);
                                        return '';
                                      };

                                      const textContent = extractText(props.children);
                                      const isArabic = /[\u0600-\u06FF]/.test(textContent);
                                      
                                      return (
                                        <p 
                                          {...props} 
                                          dir="auto" 
                                          className={cn(
                                            "mb-3 last:mb-0 leading-relaxed",
                                            isArabic 
                                              ? "font-arabic text-[21px] leading-loose text-right" 
                                              : "text-left text-[14.5px]"
                                          )}
                                        />
                                      );
                                    },
                                    blockquote: ({ node, ...props }) => (
                                      <div className="my-4 border border-stone-200 bg-stone-50/50 py-3 px-4 rounded-xl italic text-blue-900 shadow-sm relative overflow-hidden text-[12px] leading-relaxed">
                                        <div className="absolute top-0 right-0 p-1 opacity-5">
                                          <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="not-italic">
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
          </div>

          {/* Floating Input Bar - Lowered */}
          <div className="flex-shrink-0 w-full px-4 pb-2 pt-1 z-40 bg-gradient-to-t from-black/5 to-transparent">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-1.5 bg-white rounded-full p-1 shadow-xl border border-stone-200 transition-all focus-within:border-stone-400 focus-within:shadow-2xl">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-1 p-1.5 hover:bg-stone-100 rounded-full text-stone-500 transition-colors flex-shrink-0"
                  title="Илова кардани файл"
                >
                  <Plus className="w-4.5 h-4.5" />
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
                  className="flex-1 bg-transparent py-1 px-3 border-none focus:ring-0 outline-none text-[14px] sm:text-[14.5px] text-stone-800 placeholder-stone-400"
                />

                <div className="flex items-center gap-1 pr-0.5">
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="w-8 h-8 flex items-center justify-center bg-stone-900 text-white rounded-full hover:bg-stone-800 active:scale-95 transition-all disabled:opacity-20 shadow-md"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
