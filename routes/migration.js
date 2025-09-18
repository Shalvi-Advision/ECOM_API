const express = require('express');
const router = express.Router();

// Placeholder migration routes
router.get('/', (req, res) => {
  res.json({ message: 'migration routes working' });
});

module.exports = router;
