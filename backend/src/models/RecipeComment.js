const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecipeComment = sequelize.define('RecipeComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  recipe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'recipes', key: 'id' },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  rating: {
    type: DataTypes.TINYINT,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'recipe_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = RecipeComment;
