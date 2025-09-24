const express = require('express');
const { body, validationResult } = require('express-validator');
const { Comment, User } = require('../models');

const router = express.Router();

// Get comments for a target (state, transition, or project)
router.get('/:targetType/:targetId', async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
    const comments = await Comment.findAll({
      where: { targetType, targetId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment
router.post('/', [
  body('content').trim().isLength({ min: 1 }),
  body('targetType').isIn(['state', 'transition', 'project']),
  body('targetId').isUUID(),
  body('projectId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, targetType, targetId, projectId, parentCommentId, mentions } = req.body;

    const comment = await Comment.create({
      content,
      targetType,
      targetId,
      projectId,
      parentCommentId,
      mentions: mentions || [],
      authorId: req.user.id
    });

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

module.exports = router;