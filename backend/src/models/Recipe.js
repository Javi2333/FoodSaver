const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Recipe = sequelize.define('Recipe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  time_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('Fácil', 'Media', 'Difícil'),
    allowNull: false,
  },
  calories: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // JSON arrays almacenados en columnas JSON
  diet: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  // [{text: string, key: string|null}]
  ingredients: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  // [string] palabras clave para matching con despensa
  keywords: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  // [string] pasos de preparación
  steps: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  // null = receta del sistema, user_id = receta propia del usuario
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'recipes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Recipe;
