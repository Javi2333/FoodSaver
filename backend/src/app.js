const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const shoppingRoutes = require('./routes/shoppingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const pushRoutes = require('./routes/pushRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Parsear JSON en el body
app.use(express.urlencoded({ extended: true })); // Parsear formularios
app.use(morgan('dev')); // Logger de peticiones HTTP

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/push', pushRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de FoodSaver funcionando correctamente',
    version: '1.0.0'
  });
});

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejador de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;
