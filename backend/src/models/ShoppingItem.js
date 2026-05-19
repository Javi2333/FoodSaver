const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const ShoppingItem = sequelize.define('ShoppingItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 150]
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'unidades'
  },
  checked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'shopping_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.hasMany(ShoppingItem, { foreignKey: 'user_id', as: 'shoppingItems' });
ShoppingItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = ShoppingItem;
