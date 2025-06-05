const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    nickname: {
      type: String,
      default: 'Anonyme'
    },
    ipAddress: String,
    location: {
      country: String,
      city: String
    },
    identityRevealed: {
      type: Boolean,
      default: false
    },
    realUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  content: {
    type: String,
    required: true
  },
  emotionalFilter: {
    type: String,
    enum: ['amour', 'colère', 'admiration', 'regret', 'joie', 'tristesse', 'neutre'],
    default: 'neutre'
  },
  clues: {
    hint: String,
    emoji: String,
    riddle: {
      question: String,
      answer: String
    }
  },
  revealCondition: {
    type: {
      type: String,
      enum: ['devinette', 'mini-jeu', 'défi', 'paiement', 'aucune'],
      default: 'aucune'
    },
    details: mongoose.Schema.Types.Mixed
  },
  customMask: {
    type: String,
    default: null
  },
  scheduled: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    revealDate: Date
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema); 