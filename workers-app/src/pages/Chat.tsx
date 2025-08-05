import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  MessageCircle, 
  Users, 
  Clock, 
  Paperclip, 
  Smile,
  Image,
  File,
  X,
  Download,
  Play,
  Pause,
  MoreVertical,
  Phone,
  Video,
  Search,
  Mic,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import EmojiPicker from '../components/EmojiPicker';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  senderName: string;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  timestamp: string;
  isRead: boolean;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
}

interface Chat {
  _id: string;
  type: string;
  name: string;
  participants: Array<{
    userId: string;
    role: string;
  }>;
  messages: Message[];
  lastMessage: string;
}

interface CurrentUser {
  _id: string;
  name: string;
  role: string;
}

interface OnlineUser {
  userId: string;
  userName: string;
  userType: string;
}

const Chat: React.FC = () => {
  const { worker } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('workerToken');
    if (!token) return;

    const socketIo = require('socket.io-client');
    const newSocket = socketIo('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      newSocket.emit('authenticate', {
        token,
        userType: 'worker'
      });
    });

    newSocket.on('messageReceived', (message: Message) => {
      setChat(prev => {
        if (!prev) return prev;
        // Replace optimistic message with real message if it's from the same sender and content
        const existingMessageIndex = prev.messages.findIndex(msg => 
          msg._id.startsWith('temp-') && 
          msg.sender._id === message.sender._id && 
          msg.content === message.content
        );
        
        if (existingMessageIndex !== -1) {
          // Replace the optimistic message with the real one
          const updatedMessages = [...prev.messages];
          updatedMessages[existingMessageIndex] = message;
          return {
            ...prev,
            messages: updatedMessages
          };
        } else {
          // Add new message if no matching optimistic message found
          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        }
      });
    });

    newSocket.on('userOnline', (user: OnlineUser) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === user.userId);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
    });

    newSocket.on('userOffline', (user: { userId: string; userName: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
    });

    newSocket.on('userTyping', (user: OnlineUser) => {
      setTypingUsers(prev => {
        if (!prev.includes(user.userName)) {
          return [...prev, user.userName];
        }
        return prev;
      });
    });

    newSocket.on('userStopTyping', (user: { userId: string; userName: string }) => {
      setTypingUsers(prev => prev.filter(name => name !== user.userName));
    });

    newSocket.on('messageRead', (data: { messageId: string; readBy: string }) => {
      setChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg => {
            if (msg._id === data.messageId) {
              return {
                ...msg,
                readBy: [...msg.readBy, { userId: data.readBy, readAt: new Date().toISOString() }]
              };
            }
            return msg;
          })
        };
      });
    });

    newSocket.on('authError', (error: { message: string }) => {
      toast.error(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    fetchChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = async () => {
    try {
      const token = localStorage.getItem('workerToken');
      const response = await axios.get('/api/chat/group', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setChat(response.data.chat);
      setCurrentUser(response.data.currentUser);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chat:', error);
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Create optimistic message
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: worker?._id || 'worker',
          name: worker?.name || 'Worker'
        },
        senderName: worker?.name || 'Worker',
        content: newMessage,
        messageType: 'text',
        timestamp: new Date().toISOString(),
        isRead: false,
        readBy: []
      };

      // Add message to local state immediately (optimistic update)
      setChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, optimisticMessage]
        };
      });

      // Clear input and hide emoji picker
      setNewMessage('');
      setShowEmojiPicker(false);

      // Emit message via socket
      if (socket) {
        socket.emit('newMessage', {
          content: newMessage,
          messageType: 'text'
        });
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);

    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send message';
      toast.error(message);
      
      // Remove optimistic message on error
      setChat(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(msg => !msg._id.startsWith('temp-'))
        };
      });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping');
      }, 1000);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFileUpload(true);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || uploadingFile) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('workerToken');
      const response = await axios.post('/api/chat/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (socket) {
        const messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        socket.emit('newMessage', {
          content: `Sent ${selectedFile.name}`,
          messageType,
          fileUrl: response.data.fileUrl,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type
        });
      }

      setSelectedFile(null);
      setShowFileUpload(false);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to upload file';
      toast.error(message);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const isAudioFile = (mimeType: string) => {
    return mimeType.startsWith('audio/');
  };

  const isVideoFile = (mimeType: string) => {
    return mimeType.startsWith('video/');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.sender._id === currentUser?._id;
  };

  const isMessageRead = (message: Message) => {
    if (isOwnMessage(message)) {
      return message.readBy.length > 0;
    }
    return message.readBy.some(read => read.userId === currentUser?._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* WhatsApp-style Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Team Chat</h1>
                <div className="flex items-center space-x-2 text-white/80 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{onlineUsers.length} online</span>
                  </div>
                  <span>•</span>
                  <span>{chat?.participants.length || 0} members</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 h-[700px] flex flex-col overflow-hidden backdrop-blur-sm">
          {/* Messages Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 via-green-50/30 to-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0fdf4' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          >
            {chat?.messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Team Chat</h3>
                <p className="text-gray-500">Start the conversation with your team!</p>
              </div>
            ) : (
              chat?.messages.map((message, index) => {
                const showDate = index === 0 || 
                  formatDate(chat.messages[index - 1].timestamp) !== formatDate(message.timestamp);
                
                return (
                  <div key={message._id} className="animate-fade-in">
                    {showDate && (
                      <div className="flex justify-center my-6">
                        <div className="bg-white/80 backdrop-blur-sm text-gray-600 text-sm px-6 py-2 rounded-full shadow-sm border border-gray-200/50">
                          {formatDate(message.timestamp)}
                        </div>
                      </div>
                    )}
                    <div className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                      <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                        isOwnMessage(message) 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                          : 'bg-white/90 text-gray-900 border border-gray-200/50'
                      }`}>
                        {!isOwnMessage(message) && (
                          <div className="text-xs font-medium text-gray-500 mb-2">
                            {message.senderName}
                          </div>
                        )}
                        
                        {/* Message Content */}
                        <div className="text-sm">
                          {message.messageType === 'image' && message.fileUrl ? (
                            <div className="space-y-2">
                              <img 
                                src={`http://localhost:5000${message.fileUrl}`} 
                                alt="Shared image" 
                                className="max-w-full rounded-lg shadow-sm hover:scale-105 transition-transform duration-200"
                              />
                              {message.content && <p className="mt-2">{message.content}</p>}
                            </div>
                          ) : message.messageType === 'file' && message.fileUrl ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3 p-3 bg-gray-100/80 rounded-lg hover:bg-gray-200/80 transition-colors">
                                <File className="w-5 h-5 text-gray-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(message.fileSize || 0)}</p>
                                </div>
                                <a 
                                  href={`http://localhost:5000${message.fileUrl}`} 
                                  download
                                  className="p-1 hover:bg-gray-300 rounded transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                              {message.content && <p className="mt-2">{message.content}</p>}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          )}
                        </div>
                        
                        {/* Message Footer */}
                        <div className={`flex items-center justify-end space-x-2 mt-2 ${
                          isOwnMessage(message) ? 'text-green-200' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                          {isOwnMessage(message) && (
                            <span className="text-xs">
                              {isMessageRead(message) ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white/90 backdrop-blur-sm text-gray-600 px-4 py-2 rounded-2xl text-sm shadow-sm border border-gray-200/50">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200/50 p-4 bg-white/95 backdrop-blur-sm">
            {/* File Upload Preview */}
            {showFileUpload && selectedFile && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                      <p className="text-xs text-green-700">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setShowFileUpload(false);
                    }}
                    className="p-1 hover:bg-green-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-green-600" />
                  </button>
                </div>
                <button
                  onClick={uploadFile}
                  disabled={uploadingFile}
                  className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-lg"
                >
                  {uploadingFile ? 'Uploading...' : 'Send File'}
                </button>
              </div>
            )}

            <form onSubmit={sendMessage} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                  disabled={sending}
                />
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-3 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all duration-200"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all duration-200"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className="p-3 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all duration-200"
                >
                  <Camera className="w-5 h-5" />
                </button>
                
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </form>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mp3,.wav"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 