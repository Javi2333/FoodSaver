# 🥗 FoodSaver - Guía de Instalación

Esta guía te ayudará a configurar y ejecutar la aplicación FoodSaver en tu entorno local.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) - [Descargar](https://nodejs.org/)
- **MySQL** (v8 o superior) - [Descargar](https://dev.mysql.com/downloads/)
  - Alternativamente, puedes usar **XAMPP** que incluye MySQL
- **Git** (opcional, para clonar el repositorio)

## 🗄️ Paso 1: Configurar la Base de Datos

### 1.1. Iniciar MySQL

Si usas XAMPP:

- Abre el panel de control de XAMPP
- Inicia el servicio MySQL

Si usas MySQL independiente:

- El servicio debería estar corriendo automáticamente
- Verifica que puedas acceder con tu usuario root

### 1.2. Crear la Base de Datos

Opción A - **Usando phpMyAdmin** (recomendado si usas XAMPP):

1. Abre tu navegador y ve a `http://localhost/phpmyadmin`
2. Haz clic en "Nuevo" en el panel izquierdo
3. Nombre de la base de datos: `foodsaver_db`
4. Cotejamiento: `utf8mb4_unicode_ci`
5. Haz clic en "Crear"
6. Ve a la pestaña "SQL"
7. Copia y pega el contenido del archivo `database/schema.sql`
8. Haz clic en "Continuar"

Opción B - **Usando línea de comandos**:

```bash
# Conéctate a MySQL
mysql -u root -p

# Ejecuta el script SQL
source [ruta_completa]/foodsaver/database/schema.sql

# Sal de MySQL
exit
```

## ⚙️ Paso 2: Configurar el Backend

### 2.1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2.2. Configurar Variables de Entorno

1. Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
copy .env.example .env
```

2. Abre el archivo `.env` y configura tus credenciales de MySQL:

```env
NODE_ENV=development
PORT=5000

# Configuración de la Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=foodsaver_db
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA_MYSQL_AQUI

# JWT Secret
JWT_SECRET=tu_clave_secreta_muy_segura_y_larga_para_jwt_foodsaver_2024
JWT_EXPIRES_IN=7d
```

**⚠️ IMPORTANTE**: Reemplaza `TU_CONTRASEÑA_MYSQL_AQUI` con la contraseña de tu usuario root de MySQL. Si no has configurado contraseña, déjalo vacío.

### 2.3. Iniciar el Servidor Backend

```bash
npm run dev
```

Si todo está configurado correctamente, verás:

```
✅ Conexión a la base de datos establecida correctamente.
✅ Modelos sincronizados con la base de datos
🚀 Servidor corriendo en http://localhost:5000
📝 Modo: development
```

## 🎨 Paso 3: Configurar el Frontend

### 3.1. Abrir una Nueva Terminal

**IMPORTANTE**: Deja el backend corriendo en la terminal anterior y abre una nueva terminal.

### 3.2. Instalar Dependencias

```bash
cd frontend
npm install
```

### 3.3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El servidor de Vite se iniciará y verás algo como:

```
VITE v7.3.1  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 🚀 Paso 4: Usar la Aplicación

1. Abre tu navegador en `http://localhost:5173`
2. Verás la página de inicio de sesión
3. Haz clic en "Regístrate aquí" para crear una cuenta
4. Completa el formulario de registro:
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Contraseña: Mínimo 8 caracteres con mayúsculas, minúsculas y números
5. ¡Comienza a usar FoodSaver!

## 📁 Estructura del Proyecto

```
foodsaver/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── models/       # Modelos de Sequelize
│   │   ├── routes/       # Rutas de la API
│   │   ├── middlewares/  # Middlewares (auth, errores)
│   │   ├── config/       # Configuración de BD
│   │   └── app.js        # Configuración de Express
│   ├── .env              # Variables de entorno (NO subir a Git)
│   └── server.js         # Punto de entrada
│
├── frontend/             # Aplicación React
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── services/     # Servicios API
│   │   ├── context/      # Contexto de autenticación
│   │   └── utils/        # Utilidades
│   └── package.json
│
└── database/             # Scripts SQL
    ├── schema.sql        # Creación de tablas
    └── seed.sql          # Datos de ejemplo
```

## 🔧 Comandos Útiles

### Backend

```bash
npm run dev      # Iniciar en modo desarrollo (con nodemon)
npm start        # Iniciar en modo producción
```

### Frontend

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

- Verifica que MySQL esté corriendo
- Comprueba que las credenciales en `.env` sean correctas
- Asegúrate de que la base de datos `foodsaver_db` existe

### Error: "Port 5000 already in use"

- Cambia el puerto en `backend/.env` (por ejemplo, a 5001)
- Actualiza también la URL de la API en el frontend si es necesario

### Error: "CORS policy"

- Asegúrate de que el backend esté corriendo en el puerto 5000
- Verifica que el frontend haga las peticiones a `http://localhost:5000/api`

### Error: "Module not found"

- Ejecuta `npm install` en la carpeta correspondiente (backend o frontend)
- Borra `node_modules` y `package-lock.json`, luego ejecuta `npm install` de nuevo

## 📝 Notas Adicionales

- El backend corre en `http://localhost:5000`
- El frontend corre en `http://localhost:5173`
- Los tokens JWT expiran después de 7 días
- Las contraseñas se cifran con bcrypt antes de guardarse

## 🎓 Para el TFG

### Documentación Importante:

1. **Manual de Usuario**: Crea capturas de pantalla de cada funcionalidad
2. **Manual Técnico**: Documenta la arquitectura y decisiones técnicas
3. **Memoria**: Incluye diagramas de la BD y flujos de la aplicación

### Pruebas Recomendadas:

1. Registro e inicio de sesión
2. Añadir productos de diferentes categorías
3. Editar y eliminar productos
4. Verificar que el código de colores funciona correctamente
5. Probar en diferentes navegadores (Chrome, Firefox, Edge)
6. Probar en dispositivos móviles (diseño responsive)

## 📞 Contacto

Para dudas o problemas con la aplicación durante el desarrollo del TFG, consulta:

- La documentación oficial de React: https://react.dev
- La documentación de Express: https://expressjs.com
- La documentación de Sequelize: https://sequelize.org

---

**¡Buena suerte con tu TFG!** 🚀
