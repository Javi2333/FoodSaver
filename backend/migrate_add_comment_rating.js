require('dotenv').config();
const { sequelize } = require('./src/config/database');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos.');

    await sequelize.query(`
      ALTER TABLE recipe_comments ADD COLUMN IF NOT EXISTS rating TINYINT NULL AFTER content
    `);
    console.log('✅ Columna rating añadida a recipe_comments.');

    console.log('\n✅ Migración completada correctamente.');
  } catch (err) {
    console.error('❌ Error en la migración:', err.message);
  } finally {
    await sequelize.close();
  }
};

run();
