const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Product = require('../models/Product');

// Validaciones para producto
exports.productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre del producto es obligatorio')
    .isLength({ min: 1, max: 150 }).withMessage('El nombre debe tener entre 1 y 150 caracteres'),
  body('category')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isIn(['Lácteos', 'Carnes', 'Pescados', 'Frutas', 'Legumbres', 'Salsas', 'Verduras', 'Tubérculos', 'Embutidos', 'Congelados', 'Bebidas', 'Otros'])
    .withMessage('Categoría inválida'),
  body('expiration_date')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Debe ser una fecha válida'),
  body('quantity')
    .notEmpty().withMessage('La cantidad es obligatoria')
    .isFloat({ min: 0.01 }).withMessage('La cantidad debe ser mayor a 0'),
  body('unit')
    .notEmpty().withMessage('La unidad es obligatoria')
    .isIn(['kg', 'g', 'L', 'ml', 'unidades']).withMessage('Unidad inválida'),
  body('location')
    .optional()
    .isIn(['nevera', 'congelador', 'despensa']).withMessage('Ubicación inválida')
];

// Obtener todos los productos del usuario
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { user_id: req.userId, status: 'active' },
      order: [['expiration_date', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: { products }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener productos próximos a caducar (3 días o menos)
exports.getExpiringProducts = async (req, res, next) => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const products = await Product.findAll({
      where: {
        user_id: req.userId,
        status: 'active',
        expiration_date: {
          [Op.between]: [today.toISOString().split('T')[0], threeDaysFromNow.toISOString().split('T')[0]]
        }
      },
      order: [['expiration_date', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: { products }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un producto específico
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { 
        id,
        user_id: req.userId // Verificar que el producto pertenece al usuario
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// Crear nuevo producto
exports.createProduct = async (req, res, next) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { name, category, expiration_date, quantity, unit, location, notes, min_quantity } = req.body;

    const product = await Product.create({
      name,
      category,
      expiration_date: expiration_date || null,
      quantity,
      unit,
      location: location || null,
      notes: notes || null,
      min_quantity: min_quantity || null,
      user_id: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar producto
exports.updateProduct = async (req, res, next) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, category, expiration_date, quantity, unit, location, notes, min_quantity } = req.body;

    const product = await Product.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Actualizar campos
    await product.update({
      name,
      category,
      expiration_date: expiration_date || null,
      quantity,
      unit,
      location: location || null,
      notes: notes || null,
      min_quantity: min_quantity !== undefined ? (min_quantity || null) : product.min_quantity,
    });

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener productos por debajo del stock mínimo
exports.getBelowMinimum = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: {
        user_id: req.userId,
        status: 'active',
        min_quantity: { [Op.not]: null },
      },
    });

    const belowMin = products.filter(
      p => p.min_quantity !== null && parseFloat(p.quantity) < parseFloat(p.min_quantity)
    );

    res.status(200).json({ success: true, data: { products: belowMin } });
  } catch (error) {
    next(error);
  }
};

// Reponer stock de un producto existente (sumar cantidad)
exports.restockProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity_to_add, expiration_date } = req.body;

    if (!quantity_to_add || parseFloat(quantity_to_add) <= 0) {
      return res.status(400).json({ success: false, message: 'La cantidad a añadir debe ser mayor a 0' });
    }

    const product = await Product.findOne({ where: { id, user_id: req.userId, status: 'active' } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const newQuantity = parseFloat((parseFloat(product.quantity) + parseFloat(quantity_to_add)).toFixed(2));
    const updates = { quantity: newQuantity };
    if (expiration_date) updates.expiration_date = expiration_date;

    await product.update(updates);
    res.status(200).json({ success: true, message: 'Stock repuesto correctamente', data: { product } });
  } catch (error) {
    next(error);
  }
};

// Marcar producto como consumido o desechado (soft-delete)
exports.markProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['consumed', 'wasted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }

    const product = await Product.findOne({ where: { id, user_id: req.userId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    await product.update({ status });

    res.status(200).json({ success: true, message: 'Producto actualizado' });
  } catch (error) {
    next(error);
  }
};
