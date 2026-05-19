const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/',             recipeController.getAllRecipes);
router.get('/community',    recipeController.getCommunityRecipes);
router.get('/my-comments',  recipeController.getMyRecipeComments);
router.get('/:id',          recipeController.getRecipe);
router.post('/',         recipeController.recipeValidation, recipeController.createRecipe);
router.post('/:id/cook', recipeController.cookRecipe);
router.put('/:id',       recipeController.recipeValidation, recipeController.updateRecipe);
router.delete('/:id',    recipeController.deleteRecipe);

// Social
router.post('/:id/rate',                      recipeController.rateRecipe);
router.get('/:id/comments',                   recipeController.getComments);
router.post('/:id/comments',                  recipeController.addComment);
router.delete('/:id/comments/:commentId',     recipeController.deleteComment);

module.exports = router;
