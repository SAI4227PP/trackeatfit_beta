const express = require('express');
const router = express.Router();
const Chat = require('../../models/Friends/Chat');
const User = require('../../models/User');
const UserToken = require('../../models/UserToken');
const { verifyToken, JWT_SECRET } = require('../../middleware/authMiddleware');
const notificationService = require('../../services/notificationService');

// Get all chats for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.userId })
      .populate('participants', 'profile.username profile.avatar meta.isOnline meta.lastActive')
      .sort({ lastMessage: -1 })
      .lean();

    const formattedChats = chats.map(chat => ({
      ...chat,
      otherParticipant: chat.participants.find(p => p._id.toString() !== req.userId)
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get single chat by ID
router.get('/:chatId', verifyToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'profile.username profile.avatar meta.isOnline meta.lastActive')
      .populate('messages.sender', 'profile.username profile.avatar')
      .lean();

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.some(p => p._id.toString() === req.userId)) {
      return res.status(403).json({ error: 'Not authorized to view this chat' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Start new chat or get existing
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.userId, otherUserId] }
    })
    .populate('participants', 'profile.username profile.avatar meta.isOnline meta.lastActive');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
      participants: [req.userId, otherUserId]
    });

    await chat.save();
    await chat.populate('participants', 'profile.username profile.avatar meta.isOnline meta.lastActive');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
});

// Send message
router.post('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
    }    // Get sender's info for the notification
    const sender = await User.findById(req.userId).select('profile.username');
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    const message = {
      sender: req.userId,
      content,
      timestamp: new Date(),
      read: false,
      status: 'sent',
      chatId: chat._id
    };

    chat.messages.push(message);
    chat.lastMessage = message.timestamp;
    await chat.save();

    // Emit socket event for new message
    req.app.get('io').to(req.params.chatId).emit('new_message', {
      chatId: chat._id,
      message
    });

    // Send Firebase notification to the other participant
    const otherParticipant = chat.participants.find(
      p => p.toString() !== req.userId
    );
      if (otherParticipant) {
      await notificationService.sendChatNotification(
        otherParticipant,
        sender.profile.username,
        message
      );
    }

    // Emit delivery status update after a short delay to simulate network
    setTimeout(() => {
      message.status = 'delivered';
      req.app.get('io').to(req.params.chatId).emit('message_status', {
        chatId: chat._id,
        messageId: message._id,
        status: 'delivered'
      });
    }, 500);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.patch('/:chatId/read', verifyToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Not authorized to access this chat' });
    }

    // Mark all unread messages from other user as read
    let updatedMessages = false;
    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.userId && !message.read) {
        message.read = true;
        message.status = 'read';
        updatedMessages = true;
      }
    });

    if (updatedMessages) {
      await chat.save();

      // Emit socket events
      req.app.get('io').to(req.params.chatId).emit('messages_read', {
        chatId: chat._id,
        userId: req.userId
      });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Register FCM token
router.post('/register-token', verifyToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await UserToken.findOneAndUpdate(
      { userId: req.userId },
      { 
        userId: req.userId,
        fcmToken,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Token registered successfully' });
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

module.exports = router;