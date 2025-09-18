const express = require('express');
const router = express.Router();

// Placeholder mobile_api routes
router.get('/', (req, res) => {
  res.json({ message: 'mobile_api routes working' });
});

module.exports = router;
