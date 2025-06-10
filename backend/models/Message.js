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
    nameDiscovered: {
      type: Boolean,
      default: false
    },
    realUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    partialInfo: {
      firstLetter: String,
      blurredImage: String,
      approximateLocation: String
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
  discoveredHints: [{
    type: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: 'Indice'
    }
  }],
  revealCondition: {
    type: {
      type: String,
      enum: ['devinette', 'mini-jeu', 'défi', 'paiement', 'clé', 'aucune'],
      default: 'aucune'
    },
    details: mongoose.Schema.Types.Mixed,
    completed: {
      type: Boolean,
      default: false
    }
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
  aiAnalysis: {
    emotionalIntent: String,
    summary: String,
    suggestionForReply: String
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