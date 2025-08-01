import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Users, Send, Heart, MessageCircle, Shield, Star } from 'lucide-react';

interface Message {
  _id: string;
  user: {
    name: string;
    role: string;
  };
  message: string;
  timestamp: Date;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  isPrivate: boolean;
}

const PeerGroups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        setIsTyping(isTyping);
      });

      socket.on('onlineUsers', (users: string[]) => {
        setOnlineUsers(users);
      });

      return () => {
        socket.off('message');
        socket.off('typing');
        socket.off('onlineUsers');
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroups = async () => {
    // Mock data for demonstration
    const mockGroups: Group[] = [
      {
        _id: '1',
        name: 'Patient Support Circle',
        description: 'A safe space for patients to share experiences and support each other',
        memberCount: 45,
        category: 'patient',
        isPrivate: false
      },
      {
        _id: '2',
        name: 'Caregiver Community',
        description: 'Support network for family members and caregivers',
        memberCount: 32,
        category: 'caregiver',
        isPrivate: false
      },
      {
        _id: '3',
        name: 'Healthcare Professionals',
        description: 'Professional discussion and knowledge sharing',
        memberCount: 18,
        category: 'therapist',
        isPrivate: true
      },
      {
        _id: '4',
        name: 'Grief & Loss Support',
        description: 'Compassionate support for those dealing with loss',
        memberCount: 28,
        category: 'general',
        isPrivate: false
      }
    ];
    setGroups(mockGroups);
  };

  const joinGroup = (group: Group) => {
    setSelectedGroup(group);
    if (socket) {
      socket.emit('joinGroup', group._id);
    }
    
    // Mock messages for demonstration
    const mockMessages: Message[] = [
      {
        _id: '1',
        user: { name: 'Sarah M.', role: 'patient' },
        message: 'Thank you all for being such a supportive community. Your words mean so much to me.',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        _id: '2',
        user: { name: 'Michael T.', role: 'caregiver' },
        message: "Sarah, we're all here for you. This journey is challenging, but you're not alone.",
        timestamp: new Date(Date.now() - 3000000)
      },
      {
        _id: '3',
        user: { name: 'Dr. Wilson', role: 'therapist' },
        message: 'Remember that seeking support is a sign of strength, not weakness. Keep taking care of yourselves.',
        timestamp: new Date(Date.now() - 1800000)
      }
    ];
    setMessages(mockMessages);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedGroup || !socket) return;

    const messageData = {
      groupId: selectedGroup._id,
      message: newMessage,
      user: {
        name: user?.name,
        role: user?.role
      }
    };

    socket.emit('sendMessage', messageData);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'text-teal-600';
      case 'caregiver': return 'text-blue-600';
      case 'therapist': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'patient': return <Heart className="h-3 w-3" />;
      case 'caregiver': return <Shield className="h-3 w-3" />;
      case 'therapist': return <Star className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Peer Support Groups</h1>
          <p className="text-gray-600 text-lg">
            Connect with others who understand your journey. Share experiences, find support, and build meaningful connections.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
          {/* Groups List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
              <h2 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Support Groups
              </h2>
              <div className="mt-2 flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
            
            <div className="overflow-y-auto h-full">
              {groups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => joinGroup(group)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                    selectedGroup?._id === group._id ? 'bg-teal-50 border-r-4 border-r-teal-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{group.name}</h3>
                    {group.isPrivate && <Shield className="h-4 w-4 text-gray-400" />}
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Users className="h-3 w-3 mr-1" />
                    {group.memberCount} members
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col">
            {selectedGroup ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedGroup.name}</h3>
                      <p className="text-sm text-gray-600">{selectedGroup.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {onlineUsers.length} online
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message._id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center">
                          {getRoleBadge(message.user.role)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{message.user.name}</span>
                          <span className={`text-xs capitalize ${getRoleColor(message.user.role)}`}>
                            {message.user.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{message.message}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">Someone is typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message... (Press Enter to send)"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      rows={1}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-teal-600 text-white p-3 rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Support Group</h3>
                  <p className="text-gray-500">Choose a group from the sidebar to start connecting with others</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerGroups;