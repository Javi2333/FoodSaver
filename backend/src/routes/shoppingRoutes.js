const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  itemValidation,
  getAllItems,
  addItems,
  toggleItem,
  deleteItem,
  clearChecked
} = require('../controllers/shoppingController');

router.use(authMiddleware);

router.get('/',                  getAllItems);
router.post('/',                 itemValidation, addItems);
router.patch('/:id/toggle',      toggleItem);
router.delete('/checked',        clearChecked);
router.delete('/:id',            deleteItem);

module.exports = router;
