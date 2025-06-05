const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/messages/send
// @desc    Send an anonymous message
// @access  Public
router.post('/send', async (req, res) => {
  try {
    const { 
      recipientLink, 
      content, 
      nickname,
      hint,
      emoji,
      riddle,
      emotionalFilter,
      revealCondition,
      scheduledDate,
      customMask,
      realUserId
    } = req.body;

    // Validation de base du contenu
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ msg: 'Le message doit contenir au moins 5 caractères' });
    }

    // Trouver le destinataire par son lien unique
    const recipient = await User.findOne({ uniqueLink: recipientLink });
    if (!recipient) {
      return res.status(404).json({ msg: 'Destinataire non trouvé' });
    }

    // Vérifier que l'emotionalFilter est valide
    const validEmotionalFilters = ['amour', 'colère', 'admiration', 'regret', 'joie', 'tristesse', 'neutre'];
    const selectedEmotionalFilter = emotionalFilter && validEmotionalFilters.includes(emotionalFilter) 
      ? emotionalFilter 
      : 'neutre';

    // Créer le message
    const newMessage = new Message({
      recipient: recipient._id,
      content,
      sender: {
        nickname: nickname || 'Anonyme',
        ipAddress: req.ip,
        location: {
          country: req.body.country || 'Inconnu',
          city: req.body.city || 'Inconnue'
        },
        realUser: realUserId || null
      },
      emotionalFilter: selectedEmotionalFilter,
      clues: {
        hint: hint || null,
        emoji: emoji || null,
        riddle: riddle && riddle.question && riddle.answer ? {
          question: riddle.question,
          answer: riddle.answer
        } : null
      },
      customMask: customMask || null
    });

    // Ajouter la condition de révélation si définie
    if (revealCondition && revealCondition.type) {
      const validRevealTypes = ['devinette', 'mini-jeu', 'défi', 'paiement', 'aucune'];
      if (validRevealTypes.includes(revealCondition.type)) {
        newMessage.revealCondition = {
          type: revealCondition.type,
          details: revealCondition.details || {}
        };
      }
    }

    // Ajouter la planification si définie
    if (scheduledDate) {
      try {
        const revealDate = new Date(scheduledDate);
        if (revealDate > new Date()) {
          newMessage.scheduled = {
            isScheduled: true,
            revealDate
          };
        }
      } catch (error) {
        console.error("Erreur de format de date:", error);
      }
    }

    // Enregistrer les données pour le débogage
    console.log("Message créé:", {
      recipientId: recipient._id,
      content: content.substring(0, 20) + "...",
      nickname: nickname || 'Anonyme',
      emotionalFilter: selectedEmotionalFilter,
      emoji: emoji || 'Non défini',
      hint: hint || 'Non défini'
    });

    // Sauvegarder le message
    await newMessage.save();

    res.json({
      messageId: newMessage._id,
      success: true,
      details: {
        emotionalFilter: selectedEmotionalFilter,
        hasEmoji: !!emoji,
        hasHint: !!hint,
        hasRiddle: !!(riddle && riddle.question && riddle.answer)
      }
    });
  } catch (err) {
    console.error("Erreur d'envoi de message:", err.message);
    res.status(500).json({ 
      msg: 'Erreur serveur', 
      error: err.message 
    });
  }
});

// @route   GET /api/messages/received
// @desc    Get all messages received by authenticated user
// @access  Private
router.get('/received', auth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      recipient: req.user.id,
      $or: [
        { 'scheduled.isScheduled': false },
        { 'scheduled.revealDate': { $lte: new Date() } }
      ]
    })
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PATCH /api/messages/:id/read
// @desc    Mark a message as read
// @access  Private
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ msg: 'Message non trouvé' });
    }

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/messages/:id/reveal
// @desc    Reveal sender identity if conditions met
// @access  Private
router.post('/:id/reveal', auth, async (req, res) => {
  try {
    const { method, answer } = req.body;
    const message = await Message.findOne({ _id: req.params.id, recipient: req.user.id });

    if (!message) {
      return res.status(404).json({ msg: 'Message non trouvé' });
    }

    const user = await User.findById(req.user.id);

    let canReveal = false;
    let usedKey = false;

    // Vérification selon la méthode
    if (method === 'key' && user.revealKeys > 0) {
      canReveal = true;
      usedKey = true;
    } else if (method === 'riddle' && message.clues.riddle) {
      canReveal = answer.toLowerCase() === message.clues.riddle.answer.toLowerCase();
    } else if (method === 'challenge' && message.revealCondition.type === 'défi') {
      // Logique pour vérifier si le défi est complété
      canReveal = req.body.challengeCompleted === true;
    }

    if (!canReveal) {
      return res.status(403).json({ 
        msg: 'Conditions non remplies pour révéler l\'identité' 
      });
    }

    // Mise à jour du message et de l'utilisateur
    message.sender.identityRevealed = true;
    await message.save();

    if (usedKey) {
      user.revealKeys -= 1;
      await user.save();
    }

    // Ajouter aux messages révélés
    if (!user.revealedSenders.includes(message._id)) {
      user.revealedSenders.push(message._id);
      await user.save();
    }

    res.json({
      sender: {
        nickname: message.sender.nickname,
        location: message.sender.location
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PATCH /api/messages/:id/public
// @desc    Make a message public
// @access  Private
router.patch('/:id/public', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isPublic: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ msg: 'Message non trouvé' });
    }

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/messages/public
// @desc    Get public messages
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const publicMessages = await Message.find({ isPublic: true })
      .sort({ likes: -1, createdAt: -1 })
      .limit(20)
      .populate('recipient', 'uniqueLink');

    res.json(publicMessages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/messages/:id/like
// @desc    Like a public message
// @access  Public
router.post('/:id/like', async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, isPublic: true },
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ msg: 'Message non trouvé ou non public' });
    }

    res.json({ likes: message.likes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; 