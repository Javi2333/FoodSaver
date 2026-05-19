const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Product = sequelize.define('Product', {
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
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['Lácteos', 'Carnes', 'Pescados', 'Frutas', 'Legumbres', 'Salsas', 'Verduras', 'Tubérculos', 'Embutidos', 'Congelados', 'Bebidas', 'Otros']]
    }
  },
  expiration_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'unidades',
    validate: {
      isIn: [['kg', 'g', 'L', 'ml', 'unidades']]
    }
  },
  location: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['nevera', 'congelador', 'despensa', null]]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  min_quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('active', 'consumed', 'wasted'),
    allowNull: false,
    defaultValue: 'active'
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
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Definir relación: Un usuario tiene muchos productos
User.hasMany(Product, { foreignKey: 'user_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Product;
