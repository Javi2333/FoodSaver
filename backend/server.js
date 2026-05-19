const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');
const { seedRecipes } = require('./src/seeders/recipes');
const { startPushCron } = require('./src/jobs/pushCron');
// Importar modelos para que Sequelize los registre y cree las tablas
require('./src/models/ShoppingItem');
require('./src/models/PushSubscription');

const PORT = process.env.PORT || 5000;

// Evitar que errores no capturados tumben el servidor
process.on('uncaughtException', (err) => {
  console.error('❌ uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ unhandledRejection:', reason);
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();
    
    // Sincronizar modelos con la base de datos
    // Se sincroniza modelo a modelo para evitar ER_TOO_MANY_KEYS en tablas con muchos índices acumulados
    for (const [name, model] of Object.entries(sequelize.models)) {
      try {
        await model.sync({ alter: true });
      } catch (err) {
        if (err.parent?.code === 'ER_TOO_MANY_KEYS') {
          console.warn(`⚠️  ${name}: demasiados índices acumulados, sincronizando sin alter`);
          await model.sync(); // CREATE TABLE IF NOT EXISTS, no modifica nada
        } else {
          throw err;
        }
      }
    }
    console.log('✅ Modelos sincronizados con la base de datos');

    // Cargar recetas iniciales si la tabla está vacía
    await seedRecipes();

    // Iniciar cron de notificaciones push
    startPushCron();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
