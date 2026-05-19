const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CookedRecipe = sequelize.define('CookedRecipe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  recipe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'recipes', key: 'id' },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'cooked_recipes',
  timestamps: true,
  createdAt: 'cooked_at',
  updatedAt: false,
});

module.exports = CookedRecipe;
