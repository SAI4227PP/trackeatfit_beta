// dynamicEntityRoute.js
// Example dynamic API endpoint for any entity/action (posts, comments, likes, etc.)

const express = require('express');
const router = express.Router();
const { handleEntityAction, readEntityFromRedis } = require('../utils/redisEntityService');

// POST /api/entity/:entityType/:action
router.post('/:entityType/:action', async (req, res) => {
  const { entityType, action } = req.params;
  const { userId, payload } = req.body;
  if (!userId || !payload) {
    return res.status(400).json({ error: 'userId and payload required' });
  }
  try {
    const { entityId } = await handleEntityAction({ entityType, action, userId, payload });
    // Optionally, return the entity from Redis
    const entity = await readEntityFromRedis(entityType, entityId);
    res.status(200).json({ message: 'Action processed', entityId, entity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
