const Product = require('../models/Product');
const CookedRecipe = require('../models/CookedRecipe');

exports.getStats = async (req, res, next) => {
  try {
    const userId = req.userId;

    const [consumed, wasted, cooked] = await Promise.all([
      Product.count({ where: { user_id: userId, status: 'consumed' } }),
      Product.count({ where: { user_id: userId, status: 'wasted' } }),
      CookedRecipe.count({ where: { user_id: userId } }),
    ]);

    const total = consumed + wasted;
    const savingsPct = total > 0 ? Math.round((consumed / total) * 100) : 0;
    const estimatedSavings = (consumed * 2).toFixed(2);

    res.status(200).json({
      success: true,
      data: { consumed, wasted, total, savingsPct, cooked, estimatedSavings },
    });
  } catch (error) {
    next(error);
  }
};
