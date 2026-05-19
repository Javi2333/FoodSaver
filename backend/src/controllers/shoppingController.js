const { body, validationResult } = require('express-validator');
const ShoppingItem = require('../models/ShoppingItem');

exports.itemValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 1, max: 150 }).withMessage('Máximo 150 caracteres'),
  body('quantity')
    .optional({ nullable: true })
    .isFloat({ min: 0.01 }).withMessage('La cantidad debe ser mayor a 0'),
  body('unit')
    .optional()
    .isIn(['kg', 'g', 'L', 'ml', 'unidades']).withMessage('Unidad inválida')
];

// GET /api/shopping — todos los ítems del usuario
exports.getAllItems = async (req, res, next) => {
  try {
    const items = await ShoppingItem.findAll({
      where: { user_id: req.userId },
      order: [
        ['checked', 'ASC'],
        ['created_at', 'ASC']
      ]
    });
    res.status(200).json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
};

// POST /api/shopping — añadir ítem(s)
// Acepta un solo objeto { name, quantity, unit } o un array de ellos
exports.addItems = async (req, res, next) => {
  try {
    const isArray = Array.isArray(req.body);

    // express-validator solo funciona con objeto raíz; si llega array, validar manualmente
    if (!isArray) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }
    }

    const payload = isArray ? req.body : [req.body];

    if (payload.length === 0) {
      return res.status(400).json({ success: false, message: 'La lista de ítems está vacía' });
    }
    if (payload.some(item => !item.name || !String(item.name).trim())) {
      return res.status(400).json({ success: false, message: 'Todos los ítems deben tener nombre' });
    }

    const created = await ShoppingItem.bulkCreate(
      payload.map(({ name, quantity, unit, product_id }) => ({
        name: name.trim(),
        quantity: quantity ?? null,
        unit: unit ?? 'unidades',
        product_id: product_id ?? null,
        checked: false,
        user_id: req.userId
      }))
    );
    res.status(201).json({ success: true, data: { items: created } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/shopping/:id/toggle — marcar/desmarcar
exports.toggleItem = async (req, res, next) => {
  try {
    const item = await ShoppingItem.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!item) return res.status(404).json({ success: false, message: 'Ítem no encontrado' });
    await item.update({ checked: !item.checked });
    res.status(200).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/shopping/:id — eliminar un ítem
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await ShoppingItem.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!item) return res.status(404).json({ success: false, message: 'Ítem no encontrado' });
    await item.destroy();
    res.status(200).json({ success: true, message: 'Ítem eliminado' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/shopping/checked — eliminar todos los marcados
exports.clearChecked = async (req, res, next) => {
  try {
    await ShoppingItem.destroy({ where: { user_id: req.userId, checked: true } });
    res.status(200).json({ success: true, message: 'Ítems marcados eliminados' });
  } catch (err) {
    next(err);
  }
};
