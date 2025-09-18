const express = require('express');
const router = express.Router();

// Placeholder payments routes
router.get('/', (req, res) => {
  res.json({ message: 'payments routes working' });
});

module.exports = router;
