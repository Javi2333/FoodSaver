require('dotenv').config();
const { sequelize } = require('./src/config/database');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos.');

    await sequelize.query(`
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id
    `);
    console.log('✅ Columna is_public añadida a recipes.');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS recipe_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipe_id INT NOT NULL,
        user_id INT NOT NULL,
        rating TINYINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_recipe_user (recipe_id, user_id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla recipe_ratings creada.');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS recipe_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipe_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla recipe_comments creada.');

    console.log('\n✅ Migración completada correctamente.');
  } catch (err) {
    console.error('❌ Error en la migración:', err.message);
  } finally {
    await sequelize.close();
  }
};

run();
