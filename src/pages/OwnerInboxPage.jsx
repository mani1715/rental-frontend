import React, { useState, useEffect } from 'react';
import { MessageCircle, Inbox, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = '';

const OwnerInboxPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user, token } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const convId = selectedConversation.id || selectedConversation._id;
      loadMessages(convId);
      if (socket && connected) {
        socket.emit('joinConversation', convId);
      }
    }

    return () => {
      if (socket && selectedConversation) {
        socket.emit('leaveConversation', selectedConversation.id || selectedConversation._id);
      }
    };
  }, [selectedConversation, socket, connected]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleReceiveMessage = (message) => {
      const currentConvId = selectedConversation.id || selectedConversation._id;
      if (message.conversationId === currentConvId) {
        setMessages((prev) => [...prev, message]);
        markAsRead(currentConvId);
      }
      // Update conversations list
      loadConversations();
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Loaded conversations:', response.data);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/messages/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.messages || []);
      markAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      await axios.put(
        `${API_URL}/api/conversations/${conversationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (socket && connected) {
        socket.emit('markAsRead', { conversationId });
      }
      // Refresh conversations to update unread count
      loadConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const messageText = newMessage.trim();
    const convId = selectedConversation.id || selectedConversation._id;

    try {
      if (socket && connected) {
        socket.emit('sendMessage', {
          conversationId: convId,
          text: messageText
        });
      } else {
        const response = await axios.post(
          `${API_URL}/api/messages/${convId}`,
          { text: messageText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.message]);
        }
      }
      setNewMessage('');
      loadConversations(); // Refresh to update lastMessage
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation) return null;
    if (user?.id === conversation.ownerId || user?._id === conversation.ownerId) {
      return { id: conversation.customerId, name: conversation.customerName };
    }
    return { id: conversation.ownerId, name: conversation.ownerName };
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/owner/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Inbox className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
                {totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <div className="w-1/3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-slate-400 p-8">
                  <MessageCircle className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-center">No conversations yet</p>
                  <p className="text-sm text-center">Messages from customers will appear here</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherUser = getOtherParticipant(conv);
                  const convId = conv.id || conv._id;
                  const isSelected = selectedConversation && (selectedConversation.id || selectedConversation._id) === convId;
                  return (
                    <div
                      key={convId}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b border-gray-200 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600 dark:border-l-blue-400' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {otherUser?.name || 'User'}
                            </h3>
                            {conv.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                            {conv.listingId?.title || 'Listing'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400 truncate mt-1">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {conv.lastMessageAt || conv.updatedAt || conv.createdAt 
                            ? format(new Date(conv.lastMessageAt || conv.updatedAt || conv.createdAt), 'MMM d')
                            : 'New'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat View */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col transition-colors">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-blue-600 dark:bg-slate-800 text-white">
                  <h2 className="font-semibold text-lg">
                    {getOtherParticipant(selectedConversation)?.name || 'User'}
                  </h2>
                  <p className="text-sm text-blue-100">
                    {selectedConversation.listingId?.title || 'Listing'}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-950/50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-400">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderId === user?.id || message.senderId === user?._id;
                      return (
                        <div
                          key={message.id || message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${isOwn
                              ? 'bg-blue-600 dark:bg-blue-700 text-white'
                              : 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
                              }`}
                          >
                            <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                              {message.text || message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${isOwn ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-slate-400'
                                }`}
                            >
                              {format(new Date(message.createdAt), 'p')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerInboxPage;
