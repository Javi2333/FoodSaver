const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas de productos requieren autenticación
router.use(authMiddleware);

// Rutas CRUD
router.get('/', productController.getAllProducts);
router.get('/expiring', productController.getExpiringProducts);
router.get('/below-minimum', productController.getBelowMinimum);
router.get('/:id', productController.getProduct);
router.post('/', productController.productValidation, productController.createProduct);
router.put('/:id', productController.productValidation, productController.updateProduct);
router.put('/:id/status', productController.markProductStatus);
router.patch('/:id/restock', productController.restockProduct);

module.exports = router;
