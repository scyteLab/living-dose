/**
 * Everyday foods for logging a meal (English).
 * Values are ESTIMATES for one medium portion, from typical Nigerian serving
 * sizes. A dietitian must verify them against the West African Food Composition
 * Table (FAO, 2019) before launch.
 * Meal-plan recipes (data/recipes.js) can be logged too.
 */
const f = (id, name, portion, kcal, protein, carbs, fat, fibre, salt, veg, group) => ({ id, name, portion, kcal, protein, carbs, fat, fibre, salt, veg, group })

export const FOODS = [
  // Rice and grains
  f('jollof-rice', 'Jollof rice', '1 cup (200 g)', 350, 6, 58, 10, 2, 1.3, 0.5, 'grains'),
  f('white-rice', 'White rice, boiled', '1 cup (180 g)', 235, 4, 52, 0.5, 0.6, 0, 0, 'grains'),
  f('fried-rice', 'Fried rice', '1 cup (200 g)', 380, 8, 55, 14, 2.5, 1.4, 1, 'grains'),
  f('ofada-stew', 'Ofada rice with ayamase', '1 cup rice, 3 tbsp stew', 470, 10, 60, 21, 4, 1.4, 0.5, 'grains'),
  f('bread-white', 'White bread', '2 slices (60 g)', 160, 5, 30, 2, 1.5, 0.6, 0, 'grains'),
  f('spaghetti', 'Spaghetti with tomato stew', '1 cup (220 g)', 330, 9, 55, 8, 3, 1.1, 0.5, 'grains'),
  f('noodles', 'Instant noodles with seasoning', '1 pack (70 g dry)', 330, 7, 44, 14, 2, 2.6, 0, 'grains'),
  // Swallows
  f('eba', 'Eba (garri)', 'Fist-sized wrap (200 g)', 360, 1.5, 86, 0.6, 3, 0, 0, 'swallow'),
  f('amala', 'Amala', 'Fist-sized wrap (200 g)', 290, 3, 68, 0.4, 4, 0, 0, 'swallow'),
  f('pounded-yam', 'Pounded yam', 'Fist-sized wrap (200 g)', 290, 3, 68, 0.4, 4, 0, 0, 'swallow'),
  f('fufu', 'Fufu (cassava)', 'Fist-sized wrap (200 g)', 320, 1, 78, 0.5, 2, 0, 0, 'swallow'),
  f('semo', 'Semolina', 'Fist-sized wrap (200 g)', 340, 11, 70, 1.2, 3, 0, 0, 'swallow'),
  // Soups and stews
  f('egusi-soup', 'Egusi soup with meat', '1 ladle (250 g)', 420, 22, 10, 33, 4, 1.6, 1, 'soup'),
  f('efo-riro', 'Efo riro with meat', '1 ladle (250 g)', 300, 20, 8, 21, 5, 1.5, 2, 'soup'),
  f('okra-soup', 'Okra soup with fish', '1 ladle (250 g)', 230, 18, 9, 14, 5, 1.4, 2, 'soup'),
  f('ogbono-soup', 'Ogbono soup with meat', '1 ladle (250 g)', 380, 20, 8, 30, 4, 1.5, 0.5, 'soup'),
  f('pepper-soup', 'Goat meat pepper soup', '1 bowl (300 g)', 280, 30, 4, 16, 1, 1.6, 0.5, 'soup'),
  f('tomato-stew', 'Tomato stew with chicken', '3 tbsp stew and 1 piece', 290, 22, 8, 19, 2, 1.2, 1, 'soup'),
  // Beans, yam and plantain
  f('beans-porridge', 'Beans porridge', '1 cup (250 g)', 330, 17, 50, 7, 13, 1, 0.5, 'beans'),
  f('moi-moi', 'Moi moi', '1 wrap (150 g)', 230, 13, 22, 10, 6, 0.8, 0, 'beans'),
  f('akara', 'Akara', '4 balls (120 g)', 300, 11, 22, 19, 5, 0.6, 0, 'beans'),
  f('yam-boiled', 'Boiled yam', '2 slices (180 g)', 210, 3, 50, 0.3, 7, 0, 0, 'beans'),
  f('dodo', 'Fried plantain (dodo)', '10 slices (120 g)', 300, 1.5, 45, 13, 3, 0.1, 1, 'beans'),
  f('boli', 'Roasted plantain (boli)', '1 medium plantain', 220, 2, 57, 0.5, 4, 0.1, 1, 'beans'),
  // Protein
  f('fried-fish', 'Fried fish', '1 medium piece (120 g)', 260, 26, 4, 15, 0, 0.8, 0, 'protein'),
  f('grilled-chicken', 'Grilled chicken', '1 piece (150 g)', 250, 36, 0, 11, 0, 0.7, 0, 'protein'),
  f('suya', 'Beef suya', '1 stick (100 g)', 270, 27, 6, 15, 1.5, 1.2, 0, 'protein'),
  f('boiled-egg', 'Boiled egg', '1 egg', 78, 6, 0.6, 5, 0, 0.2, 0, 'protein'),
  // Snacks
  f('puff-puff', 'Puff-puff', '5 pieces (100 g)', 350, 6, 50, 14, 1.5, 0.3, 0, 'snack'),
  f('meat-pie', 'Meat pie', '1 pie (120 g)', 400, 10, 40, 22, 2, 1, 0, 'snack'),
  f('chin-chin', 'Chin chin', '1 small handful (40 g)', 200, 3, 25, 10, 0.5, 0.2, 0, 'snack'),
  f('groundnuts', 'Roasted groundnuts', '1 handful (30 g)', 170, 7, 5, 14, 2.5, 0.1, 0, 'snack'),
  f('banana', 'Banana', '1 medium', 105, 1.3, 27, 0.4, 3, 0, 1, 'snack'),
  f('orange', 'Orange', '1 medium', 62, 1.2, 15, 0.2, 3, 0, 1, 'snack'),
  f('garden-egg', 'Garden eggs', '3 small', 45, 1.5, 10, 0.3, 4, 0, 1, 'snack'),
  // Drinks
  f('soft-drink', 'Soft drink', '1 bottle (50 cl)', 210, 0, 53, 0, 0, 0, 0, 'drink'),
  f('malt', 'Malt drink', '1 can (33 cl)', 230, 1.5, 55, 0, 0, 0.1, 0, 'drink'),
  f('zobo-sweet', 'Zobo, sweetened', '1 glass (300 ml)', 120, 0, 30, 0, 0, 0, 0, 'drink'),
  f('tea-sugar', 'Tea with milk and 2 sugars', '1 mug', 70, 1.5, 12, 1.5, 0, 0, 0, 'drink'),
  f('water', 'Water', '1 glass', 0, 0, 0, 0, 0, 0, 0, 'drink'),
]

export const FOODS_BY_ID = Object.fromEntries(FOODS.map((x) => [x.id, x]))
export const FOOD_GROUPS = ['grains', 'swallow', 'soup', 'beans', 'protein', 'snack', 'drink']
