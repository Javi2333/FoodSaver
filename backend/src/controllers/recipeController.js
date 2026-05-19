const { Op, fn, col, literal } = require('sequelize');
const { body, validationResult } = require('express-validator');
const Recipe = require('../models/Recipe');
const CookedRecipe = require('../models/CookedRecipe');
const RecipeRating = require('../models/RecipeRating');
const RecipeComment = require('../models/RecipeComment');
const User = require('../models/User');

// Asociaciones necesarias para los include de Sequelize
Recipe.belongsTo(User, { as: 'author', foreignKey: 'user_id' });
RecipeComment.belongsTo(User, { as: 'author', foreignKey: 'user_id' });

// Validaciones para crear receta
exports.recipeValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('time_minutes').isInt({ min: 1 }).withMessage('El tiempo debe ser un número positivo'),
  body('difficulty').isIn(['Fácil', 'Media', 'Difícil']).withMessage('Dificultad inválida'),
  body('ingredients').isArray({ min: 1 }).withMessage('Debe tener al menos un ingrediente'),
  body('steps').isArray({ min: 1 }).withMessage('Debe tener al menos un paso'),
];

// Obtener todas las recetas (sistema + propias del usuario)
exports.getAllRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.findAll({
      where: {
        [Op.or]: [{ user_id: null }, { user_id: req.userId }],
      },
      order: [['created_at', 'ASC']],
    });
    res.status(200).json({ success: true, data: { recipes } });
  } catch (error) {
    next(error);
  }
};

// Obtener recetas públicas de otros usuarios (pestaña Comunidad)
exports.getCommunityRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.findAll({
      where: {
        is_public: true,
        user_id: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: req.userId }] },
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Adjuntar avg_rating y comment_count a cada receta
    const recipeIds = recipes.map(r => r.id);

    // Media calculada sobre comentarios con valoración (cada reseña cuenta por separado)
    const ratings = recipeIds.length
      ? await RecipeComment.findAll({
          where: { recipe_id: recipeIds, rating: { [Op.ne]: null } },
          attributes: ['recipe_id', [fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'cnt']],
          group: ['recipe_id'],
          raw: true,
        })
      : [];
    const comments = recipeIds.length
      ? await RecipeComment.findAll({
          where: { recipe_id: recipeIds },
          attributes: ['recipe_id', [fn('COUNT', col('id')), 'cnt']],
          group: ['recipe_id'],
          raw: true,
        })
      : [];

    const ratingMap  = Object.fromEntries(ratings.map(r => [r.recipe_id, { avg: parseFloat(r.avg) || 0, cnt: parseInt(r.cnt) }]));
    const commentMap = Object.fromEntries(comments.map(c => [c.recipe_id, parseInt(c.cnt)]));

    // Última valoración del usuario actual por receta (de sus comentarios)
    const userRatings = recipeIds.length
      ? await RecipeComment.findAll({
          where: { recipe_id: recipeIds, user_id: req.userId, rating: { [Op.ne]: null } },
          attributes: ['recipe_id', 'rating'],
          order: [['created_at', 'DESC']],
          raw: true,
        })
      : [];
    const userRatingMap = {};
    userRatings.forEach(r => {
      if (!userRatingMap[r.recipe_id]) userRatingMap[r.recipe_id] = r.rating;
    });

    const result = recipes.map(r => ({
      ...r.toJSON(),
      avg_rating:    ratingMap[r.id]?.avg ?? 0,
      rating_count:  ratingMap[r.id]?.cnt ?? 0,
      comment_count: commentMap[r.id] ?? 0,
      user_rating:   userRatingMap[r.id] ?? null,
    }));

    res.status(200).json({ success: true, data: { recipes: result } });
  } catch (error) {
    next(error);
  }
};

// Obtener una receta concreta
exports.getRecipe = async (req, res, next) => {
  try {
    // Permite ver recetas propias, del sistema, o públicas de otros
    const recipe = await Recipe.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { user_id: null },
          { user_id: req.userId },
          { is_public: true },
        ],
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    const [ratingData, commentCount, userRatingRow] = await Promise.all([
      // Media calculada sobre los comentarios con valoración (cada reseña cuenta)
      RecipeComment.findOne({
        where: { recipe_id: recipe.id, rating: { [Op.ne]: null } },
        attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'cnt']],
        raw: true,
      }),
      RecipeComment.count({ where: { recipe_id: recipe.id } }),
      // Última valoración del usuario actual en sus comentarios
      RecipeComment.findOne({
        where: { recipe_id: recipe.id, user_id: req.userId, rating: { [Op.ne]: null } },
        attributes: ['rating'],
        order: [['created_at', 'DESC']],
        raw: true,
      }),
    ]);

    const result = {
      ...recipe.toJSON(),
      avg_rating:    parseFloat(ratingData?.avg) || 0,
      rating_count:  parseInt(ratingData?.cnt) || 0,
      comment_count: commentCount,
      user_rating:   userRatingRow?.rating ?? null,
    };

    res.status(200).json({ success: true, data: { recipe: result } });
  } catch (error) {
    next(error);
  }
};

// Crear receta propia
exports.createRecipe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
    }

    const { name, time_minutes, difficulty, calories, image_url, diet, ingredients, keywords, steps, is_public } = req.body;

    const autoKeywords = keywords && keywords.length > 0
      ? keywords
      : ingredients.filter(i => i.key).map(i => i.key);

    const recipe = await Recipe.create({
      name,
      time_minutes,
      difficulty,
      calories: calories || null,
      image_url: image_url || null,
      diet: diet || [],
      ingredients,
      keywords: autoKeywords,
      steps,
      user_id: req.userId,
      is_public: !!is_public,
    });

    res.status(201).json({
      success: true,
      message: 'Receta creada correctamente',
      data: { recipe },
    });
  } catch (error) {
    next(error);
  }
};

// Registrar receta cocinada
exports.cookRecipe = async (req, res, next) => {
  try {
    await CookedRecipe.create({ user_id: req.userId, recipe_id: req.params.id });
    res.status(201).json({ success: true, message: 'Receta registrada como cocinada' });
  } catch (error) {
    next(error);
  }
};

// Editar receta propia
exports.updateRecipe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
    }

    const recipe = await Recipe.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    const { name, time_minutes, difficulty, calories, image_url, diet, ingredients, keywords, steps, is_public } = req.body;

    const autoKeywords = keywords && keywords.length > 0
      ? keywords
      : ingredients.filter(i => i.key).map(i => i.key);

    await recipe.update({
      name, time_minutes, difficulty,
      calories: calories || null,
      image_url: image_url || null,
      diet: diet || [],
      ingredients,
      keywords: autoKeywords,
      steps,
      is_public: is_public !== undefined ? !!is_public : recipe.is_public,
    });

    res.status(200).json({ success: true, message: 'Receta actualizada', data: { recipe } });
  } catch (error) {
    next(error);
  }
};

// Eliminar receta propia
exports.deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }
    await recipe.destroy();
    res.status(200).json({ success: true, message: 'Receta eliminada' });
  } catch (error) {
    next(error);
  }
};

// Puntuar receta (crear o actualizar)
exports.rateRecipe = async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'La puntuación debe ser entre 1 y 5' });
    }

    const recipe = await Recipe.findOne({
      where: { id: req.params.id, is_public: true },
    });
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }
    if (recipe.user_id === req.userId) {
      return res.status(403).json({ success: false, message: 'No puedes puntuar tu propia receta' });
    }

    const [ratingRow, created] = await RecipeRating.findOrCreate({
      where: { recipe_id: req.params.id, user_id: req.userId },
      defaults: { rating },
    });
    if (!created) {
      await ratingRow.update({ rating });
    }

    // Devolver nueva media
    const avgData = await RecipeRating.findOne({
      where: { recipe_id: req.params.id },
      attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'cnt']],
      raw: true,
    });

    res.status(200).json({
      success: true,
      message: created ? 'Puntuación guardada' : 'Puntuación actualizada',
      data: {
        user_rating:  parseInt(rating),
        avg_rating:   parseFloat(avgData?.avg) || 0,
        rating_count: parseInt(avgData?.cnt) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener comentarios de una receta
exports.getComments = async (req, res, next) => {
  try {
    const comments = await RecipeComment.findAll({
      where: { recipe_id: req.params.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['created_at', 'ASC']],
    });

    // Si el usuario es el dueño de la receta, marcar como leídos los comentarios no leídos
    const recipe = await Recipe.findOne({ where: { id: req.params.id }, attributes: ['user_id'] });
    if (recipe && recipe.user_id === req.userId) {
      await RecipeComment.update(
        { read_at: new Date() },
        { where: { recipe_id: req.params.id, user_id: { [Op.ne]: req.userId }, read_at: null } }
      );
    }

    res.status(200).json({ success: true, data: { comments } });
  } catch (error) {
    next(error);
  }
};

// Añadir comentario (con valoración opcional integrada)
exports.addComment = async (req, res, next) => {
  try {
    const { content, rating } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'El comentario no puede estar vacío' });
    }
    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'La puntuación debe ser entre 1 y 5' });
    }

    const recipe = await Recipe.findOne({ where: { id: req.params.id, is_public: true } });
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    const comment = await RecipeComment.create({
      recipe_id: req.params.id,
      user_id:   req.userId,
      content:   content.trim(),
      rating:    rating || null,
    });

    // Si el comentario incluye valoración, calcular la nueva media desde recipe_comments
    let avgData = null;
    if (rating) {
      avgData = await RecipeComment.findOne({
        where: { recipe_id: req.params.id, rating: { [Op.ne]: null } },
        attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'cnt']],
        raw: true,
      });
    }

    const commentWithAuthor = await RecipeComment.findOne({
      where: { id: comment.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    });

    res.status(201).json({
      success: true,
      data: {
        comment: commentWithAuthor,
        ...(avgData ? {
          avg_rating:   parseFloat(avgData.avg) || 0,
          rating_count: parseInt(avgData.cnt) || 0,
        } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener comentarios recibidos en las recetas del usuario (de otros usuarios)
exports.getMyRecipeComments = async (req, res, next) => {
  try {
    const myRecipes = await Recipe.findAll({
      where: { user_id: req.userId },
      attributes: ['id', 'name'],
    });

    const recipeIds = myRecipes.map(r => r.id);
    if (recipeIds.length === 0) {
      return res.status(200).json({ success: true, data: { comments: [] } });
    }

    const recipeMap = Object.fromEntries(myRecipes.map(r => [r.id, r.name]));

    const comments = await RecipeComment.findAll({
      where: {
        recipe_id: recipeIds,
        user_id: { [Op.ne]: req.userId },
        read_at: null,
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const result = comments.map(c => ({
      ...c.toJSON(),
      recipe_title: recipeMap[c.recipe_id],
    }));

    res.status(200).json({ success: true, data: { comments: result } });
  } catch (error) {
    next(error);
  }
};

// Eliminar comentario (solo el autor)
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await RecipeComment.findOne({
      where: { id: req.params.commentId, recipe_id: req.params.id, user_id: req.userId },
    });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
    }
    await comment.destroy();
    res.status(200).json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    next(error);
  }
};
