const Recipe = require('../models/Recipe');

const INITIAL_RECIPES = [
  {
    name: 'Bizcocho de Yogurt',
    time_minutes: 45,
    difficulty: 'Fácil',
    calories: '250 kcal',
    diet: ['vegetariana'],
    image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: '3 huevos', key: 'huevo' },
      { text: '1 yogurt natural', key: 'yogur' },
      { text: '3 medidas de harina', key: 'harina' },
      { text: '2 medidas de azúcar', key: 'azúcar' },
      { text: '1 medida de aceite', key: 'aceite' },
      { text: '1 sobre de levadura', key: 'levadura' },
    ],
    keywords: ['huevo', 'yogur', 'yogurt', 'harina', 'azúcar', 'aceite', 'levadura'],
    steps: ['Precalentar horno a 180ºC', 'Batir huevos con azúcar', 'Añadir yogurt y aceite', 'Incorporar harina y levadura', 'Hornear 35-40 min'],
    user_id: null,
  },
  {
    name: 'Tortilla de Patatas',
    time_minutes: 30,
    difficulty: 'Media',
    calories: '180 kcal',
    diet: ['vegetariana'],
    image_url: 'https://images.unsplash.com/photo-1664472718957-c584762cf7f8?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: '4 patatas medianas', key: 'patata' },
      { text: '5 huevos', key: 'huevo' },
      { text: 'Aceite de oliva', key: 'aceite' },
      { text: 'Sal', key: null },
      { text: 'Cebolla (opcional)', key: 'cebolla' },
    ],
    keywords: ['patata', 'papa', 'huevo', 'aceite', 'cebolla'],
    steps: ['Pelar y cortar patatas', 'Freír patatas (y cebolla)', 'Batir huevos', 'Mezclar patatas con huevos', 'Cuajar en sartén por ambos lados'],
    user_id: null,
  },
  {
    name: 'Ensalada César',
    time_minutes: 15,
    difficulty: 'Fácil',
    calories: '120 kcal',
    diet: [],
    image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: 'Lechuga romana', key: 'lechuga' },
      { text: 'Pechuga de pollo', key: 'pollo' },
      { text: 'Picatostes', key: 'pan' },
      { text: 'Queso parmesano', key: 'queso' },
      { text: 'Salsa César', key: 'salsa' },
    ],
    keywords: ['lechuga', 'pollo', 'pan', 'queso', 'salsa'],
    steps: ['Lavar lechuga', 'Cocinar pollo a la plancha', 'Cortar pollo y pan', 'Mezclar todo en un bol', 'Añadir salsa y queso'],
    user_id: null,
  },
  {
    name: 'Revuelto de Jamón y Huevo',
    time_minutes: 10,
    difficulty: 'Fácil',
    calories: '220 kcal',
    diet: [],
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: '3 huevos', key: 'huevo' },
      { text: '100g jamón york', key: 'jamón' },
      { text: 'Sal', key: null },
      { text: 'Pimienta', key: null },
      { text: 'Mantequilla', key: 'mantequilla' },
    ],
    keywords: ['huevo', 'jamón', 'jamon', 'mantequilla'],
    steps: ['Derretir mantequilla en sartén', 'Batir los huevos con sal', 'Añadir jamón picado', 'Revolver a fuego lento', 'Servir caliente'],
    user_id: null,
  },
  {
    name: 'Gazpacho',
    time_minutes: 15,
    difficulty: 'Fácil',
    calories: '80 kcal',
    diet: ['vegetariana', 'vegana', 'sin gluten'],
    image_url: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: '1 kg tomates', key: 'tomate' },
      { text: '1 pimiento verde', key: 'pimiento' },
      { text: '1 pepino', key: 'pepino' },
      { text: '1 diente de ajo', key: 'ajo' },
      { text: 'Aceite de oliva', key: 'aceite' },
      { text: 'Vinagre', key: 'vinagre' },
      { text: 'Sal', key: null },
    ],
    keywords: ['tomate', 'pimiento', 'pepino', 'ajo', 'aceite', 'vinagre'],
    steps: ['Trocear todas las verduras', 'Triturar con batidora', 'Añadir aceite y vinagre', 'Salar al gusto', 'Refrigerar 1h antes de servir'],
    user_id: null,
  },
  {
    name: 'Pasta con Tomate y Jamón',
    time_minutes: 20,
    difficulty: 'Fácil',
    calories: '350 kcal',
    diet: [],
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: '250g pasta', key: 'pasta' },
      { text: 'Tomate frito', key: 'tomate' },
      { text: '150g jamón cocido', key: 'jamón' },
      { text: 'Queso rallado', key: 'queso' },
      { text: 'Sal', key: null },
      { text: 'Aceite', key: 'aceite' },
    ],
    keywords: ['pasta', 'macarrones', 'espagueti', 'tomate', 'jamón', 'jamon', 'queso', 'aceite'],
    steps: ['Cocer la pasta', 'Calentar tomate con jamón', 'Escurrir pasta', 'Mezclar y añadir queso', 'Servir caliente'],
    user_id: null,
  },
  {
    name: 'Leche Merengada',
    time_minutes: 10,
    difficulty: 'Fácil',
    calories: '130 kcal',
    diet: ['vegetariana'],
    image_url: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: '1L leche', key: 'leche' },
      { text: 'Azúcar', key: 'azúcar' },
      { text: 'Canela en polvo', key: 'canela' },
      { text: 'Limón', key: 'limón' },
    ],
    keywords: ['leche', 'azúcar', 'azucar', 'limón', 'limon', 'canela'],
    steps: ['Mezclar leche con azúcar', 'Añadir ralladura de limón', 'Batir hasta espumar', 'Servir con canela por encima', 'Opcionalmente enfriar'],
    user_id: null,
  },
  {
    name: 'Caldo de Verduras',
    time_minutes: 40,
    difficulty: 'Fácil',
    calories: '60 kcal',
    diet: ['vegetariana', 'vegana', 'sin gluten'],
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=600',
    ingredients: [
      { text: 'Zanahoria', key: 'zanahoria' },
      { text: 'Cebolla', key: 'cebolla' },
      { text: 'Apio', key: 'apio' },
      { text: 'Puerro', key: 'puerro' },
      { text: 'Ajo', key: 'ajo' },
      { text: 'Sal', key: null },
      { text: 'Aceite', key: 'aceite' },
    ],
    keywords: ['zanahoria', 'cebolla', 'apio', 'puerro', 'ajo', 'aceite'],
    steps: ['Lavar y trocear verduras', 'Rehogar en olla con aceite', 'Cubrir con agua', 'Cocer 30 min a fuego medio', 'Colar y salar'],
    user_id: null,
  },
];

const seedRecipes = async () => {
  try {
    const count = await Recipe.count({ where: { user_id: null } });
    if (count > 0) return; // Ya están cargadas las recetas del sistema
    await Recipe.bulkCreate(INITIAL_RECIPES);
    console.log('✅ Recetas iniciales cargadas en la base de datos');
  } catch (err) {
    console.error('❌ Error al cargar recetas iniciales:', err.message);
  }
};

module.exports = { seedRecipes };
