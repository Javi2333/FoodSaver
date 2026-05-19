-- ====================================
-- FoodSaver Sample Data
-- ====================================

USE foodsaver_db;

-- Insertar usuario de prueba
-- Contraseña: Test1234
-- (La contraseña debe ser hasheada por el backend, estos son solo ejemplos)
INSERT INTO users (name, email, password) VALUES
('Usuario Demo', 'demo@foodsaver.com', '$2a$10$examplehashedpassword123456789012'),
('María García', 'maria@test.com', '$2a$10$examplehashedpassword123456789012');

-- Insertar productos de ejemplo
INSERT INTO products (user_id, name, category, expiration_date, quantity, unit, location, notes) VALUES
-- Productos del usuario 1
(1, 'Leche Entera', 'Lácteos', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 1, 'L', 'nevera', 'Comprada en el supermercado'),
(1, 'Yogures Naturales', 'Lácteos', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 4, 'unidades', 'nevera', NULL),
(1, 'Pechuga de Pollo', 'Carnes', DATE_ADD(CURDATE(), INTERVAL -1 DAY), 0.5, 'kg', 'nevera', 'Verificar antes de cocinar'),
(1, 'Manzanas', 'Frutas', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 6, 'unidades', 'despensa', NULL),
(1, 'Tomates', 'Verduras', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 0.8, 'kg', 'nevera', NULL),
(1, 'Pizza Congelada', 'Congelados', DATE_ADD(CURDATE(), INTERVAL 90 DAY), 1, 'unidades', 'congelador', NULL),
(1, 'Zumo de Naranja', 'Bebidas', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 1, 'L', 'nevera', 'Próximo a caducar'),
(1, 'Pan de Molde', 'Otros', DATE_ADD(CURDATE(), INTERVAL 4 DAY), 1, 'unidades', 'despensa', NULL);
