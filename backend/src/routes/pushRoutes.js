const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getPublicKey, subscribe, unsubscribe } = require('../controllers/pushController');

router.get('/vapid-public-key', getPublicKey);
router.use(authMiddleware);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

module.exports = router;
