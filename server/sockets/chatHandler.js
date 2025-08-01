import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Store active users and their socket connections
const activeUsers = new Map();
const userRooms = new Map();

export const handleSocketConnection = (socket, io) => {
  console.log('New client connected:', socket.id);

  // Authentication for socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('name role isActive');
      
      if (!user || !user.isActive) {
        socket.emit('auth_error', 'Invalid user');
        return socket.disconnect();
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;

      // Add user to active users
      activeUsers.set(socket.userId, {
        socketId: socket.id,
        name: user.name,
        role: user.role,
        joinedAt: new Date()
      });

      socket.emit('authenticated', { 
        message: 'Authentication successful',
        user: { id: user._id, name: user.name, role: user.role }
      });

      console.log(`User ${user.name} (${user.role}) authenticated`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth_error', 'Authentication failed');
      socket.disconnect();
    }
  });

  // Join a peer group room
  socket.on('joinGroup', (groupId) => {
    if (!socket.userId) {
      return socket.emit('error', 'Authentication required');
    }

    // Leave previous rooms
    const previousRooms = userRooms.get(socket.userId) || [];
    previousRooms.forEach(room => {
      socket.leave(room);
    });

    // Join new room
    socket.join(groupId);
    userRooms.set(socket.userId, [groupId]);

    // Notify others in the room
    socket.to(groupId).emit('userJoined', {
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole
    });

    // Send current room info
    const roomUsers = Array.from(activeUsers.values())
      .filter(user => {
        const userSocket = io.sockets.sockets.get(user.socketId);
        return userSocket && userSocket.rooms.has(groupId);
      });

    socket.emit('roomInfo', {
      groupId,
      users: roomUsers
    });

    console.log(`User ${socket.userName} joined group ${groupId}`);
  });

  // Handle new messages
  socket.on('sendMessage', (data) => {
    if (!socket.userId) {
      return socket.emit('error', 'Authentication required');
    }

    const { groupId, message } = data;

    if (!groupId || !message || !message.trim()) {
      return socket.emit('error', 'Invalid message data');
    }

    // Create message object
    const messageData = {
      _id: generateMessageId(),
      user: {
        id: socket.userId,
        name: socket.userName,
        role: socket.userRole
      },
      message: message.trim(),
      timestamp: new Date(),
      groupId
    };

    // Broadcast message to all users in the group
    io.to(groupId).emit('message', messageData);

    // Optional: Save message to database
    // await saveMessageToDatabase(messageData);

    console.log(`Message from ${socket.userName} in group ${groupId}: ${message.substring(0, 50)}...`);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (!socket.userId) return;

    const { groupId, isTyping } = data;
    
    socket.to(groupId).emit('typing', {
      userId: socket.userId,
      userName: socket.userName,
      isTyping
    });
  });

  // Handle private messages (for therapy sessions)
  socket.on('privateMessage', (data) => {
    if (!socket.userId) {
      return socket.emit('error', 'Authentication required');
    }

    const { recipientId, message } = data;

    if (!recipientId || !message || !message.trim()) {
      return socket.emit('error', 'Invalid message data');
    }

    const recipient = activeUsers.get(recipientId);
    if (!recipient) {
      return socket.emit('error', 'Recipient not found or offline');
    }

    const messageData = {
      _id: generateMessageId(),
      from: {
        id: socket.userId,
        name: socket.userName,
        role: socket.userRole
      },
      to: {
        id: recipientId,
        name: recipient.name,
        role: recipient.role
      },
      message: message.trim(),
      timestamp: new Date(),
      isPrivate: true
    };

    // Send to recipient
    io.to(recipient.socketId).emit('privateMessage', messageData);
    
    // Send confirmation to sender
    socket.emit('messageDelivered', {
      messageId: messageData._id,
      recipientId
    });

    console.log(`Private message from ${socket.userName} to ${recipient.name}`);
  });

  // Handle therapy session rooms
  socket.on('joinTherapySession', (sessionId) => {
    if (!socket.userId) {
      return socket.emit('error', 'Authentication required');
    }

    // Verify user is part of this therapy session
    // This would normally check the database
    const therapyRoom = `therapy_${sessionId}`;
    socket.join(therapyRoom);

    socket.to(therapyRoom).emit('therapyUserJoined', {
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole
    });

    console.log(`User ${socket.userName} joined therapy session ${sessionId}`);
  });

  // Handle video call signaling for therapy sessions
  socket.on('videoCallSignal', (data) => {
    if (!socket.userId) return;

    const { sessionId, signal, type } = data;
    const therapyRoom = `therapy_${sessionId}`;

    socket.to(therapyRoom).emit('videoCallSignal', {
      from: socket.userId,
      signal,
      type
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

    if (socket.userId) {
      // Remove from active users
      activeUsers.delete(socket.userId);
      userRooms.delete(socket.userId);

      // Notify all rooms about user leaving
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('userLeft', {
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole
          });
        }
      });

      console.log(`User ${socket.userName} disconnected`);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

// Utility function to generate message IDs
function generateMessageId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Optional: Save message to database
async function saveMessageToDatabase(messageData) {
  try {
    // Implement database saving logic here
    // const message = new Message(messageData);
    // await message.save();
  } catch (error) {
    console.error('Error saving message to database:', error);
  }
}

// Utility function to get online users in a room
export const getOnlineUsersInRoom = (io, roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return [];

  const users = [];
  room.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.userId) {
      const user = activeUsers.get(socket.userId);
      if (user) {
        users.push(user);
      }
    }
  });

  return users;
};

// Utility function to send notification to specific user
export const sendNotificationToUser = (io, userId, notification) => {
  const user = activeUsers.get(userId);
  if (user) {
    io.to(user.socketId).emit('notification', notification);
    return true;
  }
  return false;
};

export default {
  handleSocketConnection,
  getOnlineUsersInRoom,
  sendNotificationToUser
};