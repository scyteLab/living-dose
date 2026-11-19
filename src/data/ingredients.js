/**
 * Living Dose ingredient table: nutrition per 100 g of the edible part, as bought
 * (raw, or dry for grains, beans and flours).
 *
 * Values are ESTIMATES based on the West African Food Composition Table (FAO/INFOODS,
 * 2019) and standard references, rounded. A registered dietitian must check every row
 * before launch. Recipe nutrition is worked out from this table (src/lib/recipes/nutrition.js),
 * so correcting a row here corrects every recipe that uses it.
 *
 * Columns: kcal, protein, carbs (available), fat, fibre, salt (g), sat (saturated fat, g)
 * Flags:   veg (counts towards fruit-and-veg portions, 80 g = 1), refined (refined starch),
 *          contains (allergen or diet group), cost (1 lower, 2 moderate, 3 higher)
 * Units:   unit 'g' or 'ml' (ml of oil weighs 0.92 g; other liquids about 1 g), or a
 *          count with pieceG (grams of edible part per piece) and pieceName.
 */

const n = (id, name, aisle, values, extra = {}) => {
  const [kcal, protein, carbs, fat, fibre, salt = 0, sat = 0] = values
  return { id, name, aisle, kcal, protein, carbs, fat, fibre, salt, sat, unit: 'g', veg: false, refined: false, contains: null, cost: 1, ...extra }
}

export const INGREDIENTS = [
  // ---------------------------------------------------------------- vegetables and leaves
  n('ugu', 'Ugu leaves', 'produce', [36, 3.6, 4, 0.7, 2.5, 0.02, 0.1], { veg: true }),
  n('spinach', 'Spinach (efo tete)', 'produce', [23, 2.5, 1.8, 0.3, 2, 0.05], { veg: true }),
  n('waterleaf', 'Waterleaf', 'produce', [20, 2, 2.3, 0.3, 1.5, 0.05], { veg: true }),
  n('ewedu', 'Ewedu (jute) leaves', 'produce', [43, 4.7, 5, 0.3, 2.5, 0.03], { veg: true }),
  n('bitterleaf', 'Bitterleaf, washed', 'produce', [40, 5, 4, 0.5, 4, 0.03], { veg: true }),
  n('oha', 'Oha leaves', 'produce', [40, 4, 5, 0.6, 3, 0.03], { veg: true }),
  n('afang', 'Afang (okazi) leaves, shredded', 'produce', [50, 6, 4, 0.6, 7, 0.03], { veg: true }),
  n('moringa', 'Moringa (zogale) leaves', 'produce', [64, 9.4, 3, 1.4, 2, 0.02, 0.2], { veg: true }),
  n('scent-leaves', 'Scent leaves', 'produce', [30, 3, 3, 0.6, 2, 0.01], { veg: true }),
  n('uziza', 'Uziza leaves', 'produce', [40, 3, 6, 1, 4]),
  n('utazi', 'Utazi leaves', 'produce', [40, 3, 6, 0.5, 4]),
  n('okra', 'Okra', 'produce', [33, 1.9, 4.5, 0.2, 3.2, 0.02], { veg: true }),
  n('tomato', 'Tomatoes', 'produce', [18, 0.9, 2.6, 0.2, 1.2, 0.01], { veg: true }),
  n('pepper-mix', 'Tatashe and scotch bonnet', 'produce', [31, 1.2, 6, 0.3, 2, 0.01], { veg: true }),
  n('onion', 'Onion', 'produce', [40, 1.1, 7.6, 0.1, 1.7, 0.01], { veg: true }),
  n('garlic', 'Garlic', 'produce', [149, 6.4, 30, 0.5, 2.1, 0.04]),
  n('ginger', 'Ginger', 'produce', [80, 1.8, 15, 0.8, 2, 0.03]),
  n('carrot', 'Carrots', 'produce', [41, 0.9, 7, 0.2, 2.8, 0.17], { veg: true }),
  n('green-beans', 'Green beans', 'produce', [31, 1.8, 4.3, 0.2, 2.7, 0.01], { veg: true }),
  n('mixed-veg', 'Cabbage, carrots and green pepper', 'produce', [25, 1.3, 4, 0.2, 2.2, 0.05], { veg: true }),
  n('lettuce', 'Lettuce and cucumber', 'produce', [15, 0.8, 2.5, 0.1, 1, 0.02], { veg: true }),
  n('cucumber', 'Cucumber', 'produce', [15, 0.7, 3.6, 0.1, 0.5, 0.01], { veg: true }),
  n('garden-egg', 'Garden eggs', 'produce', [25, 1, 3.5, 0.2, 3, 0.01], { veg: true, unit: '', pieceG: 40, pieceName: 'garden egg' }),
  n('pumpkin', 'Pumpkin (elegede)', 'produce', [26, 1, 5.5, 0.1, 0.5, 0.01], { veg: true }),
  n('lemon', 'Lemon', 'produce', [29, 1.1, 3, 0.3, 2.8], { unit: '', pieceG: 60, pieceName: 'lemon' }),

  // ---------------------------------------------------------------- starchy roots and plantain
  n('yam', 'Yam', 'produce', [118, 1.5, 25, 0.2, 4.1, 0.02]),
  n('water-yam', 'Water yam', 'produce', [115, 1.5, 25, 0.2, 3, 0.02]),
  n('cocoyam', 'Cocoyam', 'produce', [112, 1.5, 24, 0.2, 4, 0.03]),
  n('sweet-potato', 'Sweet potato', 'produce', [86, 1.6, 17, 0.1, 3, 0.14]),
  n('irish-potato', 'Irish potatoes', 'produce', [77, 2, 15, 0.1, 2.2, 0.02], { cost: 2 }),
  n('plantain-unripe', 'Unripe plantain', 'produce', [122, 1.3, 28, 0.4, 2.3, 0.01], { unit: '', pieceG: 180, pieceName: 'plantain' }),
  n('plantain-ripe', 'Ripe plantain', 'produce', [122, 1.3, 30, 0.4, 2, 0.01], { unit: '', pieceG: 180, pieceName: 'plantain' }),
  n('corn', 'Fresh corn', 'produce', [86, 3.3, 17, 1.4, 2.7, 0.04], { unit: '', pieceG: 100, pieceName: 'cob' }),

  // ---------------------------------------------------------------- fruit
  n('banana', 'Banana', 'produce', [89, 1.1, 20, 0.3, 2.6], { veg: true, unit: '', pieceG: 100, pieceName: 'banana' }),
  n('orange', 'Orange', 'produce', [47, 0.9, 9.4, 0.1, 2.4], { veg: true, unit: '', pieceG: 130, pieceName: 'orange' }),
  n('pawpaw', 'Pawpaw', 'produce', [43, 0.5, 9, 0.3, 1.7], { veg: true }),
  n('watermelon', 'Watermelon', 'produce', [30, 0.6, 7.5, 0.2, 0.4], { veg: true }),
  n('pineapple', 'Pineapple', 'produce', [50, 0.5, 12, 0.1, 1.4], { veg: true }),
  n('mango', 'Mango', 'produce', [60, 0.8, 15, 0.4, 1.6], { veg: true }),
  n('guava', 'Guava', 'produce', [68, 2.6, 9, 1, 5.4], { veg: true, unit: '', pieceG: 80, pieceName: 'guava' }),
  n('agbalumo', 'Agbalumo (African star apple)', 'produce', [67, 1, 14, 0.5, 4], { veg: true, unit: '', pieceG: 40, pieceName: 'agbalumo' }),
  n('avocado', 'Avocado', 'produce', [160, 2, 1.8, 15, 6.7, 0.02, 2.1], { veg: true, unit: '', pieceG: 150, pieceName: 'avocado', cost: 2 }),
  n('ube', 'Ube (African pear)', 'produce', [263, 4, 9, 23, 10, 0.02, 7], { unit: '', pieceG: 30, pieceName: 'ube' }),
  n('coconut', 'Coconut pieces', 'produce', [354, 3.3, 6, 33, 9, 0.05, 30]),
  n('coconut-water', 'Fresh coconut water', 'produce', [19, 0.7, 3.7, 0.2, 1.1, 0.26], { unit: 'ml' }),
  n('dates', 'Dates', 'pantry', [282, 2.5, 75, 0.4, 8], { unit: '', pieceG: 8, pieceName: 'date' }),

  // ---------------------------------------------------------------- grains, flours and swallows
  n('rice', 'Parboiled rice', 'grains', [360, 7, 79, 0.5, 1.5], { refined: true }),
  n('ofada-rice', 'Ofada rice', 'grains', [360, 7.5, 74, 2.7, 3.5], { cost: 2 }),
  n('brown-rice', 'Brown rice', 'grains', [362, 7.5, 74, 2.7, 3.4], { cost: 2 }),
  n('oats', 'Rolled oats', 'grains', [379, 13, 60, 6.5, 10, 0.01, 1.2], { cost: 2 }),
  n('millet', 'Millet (gero), grain or flour', 'grains', [361, 11.6, 67, 5, 8.5]),
  n('fonio', 'Acha (fonio)', 'grains', [360, 7.4, 77, 1.5, 3.5], { cost: 2 }),
  n('maize-flour', 'Maize flour (for tuwo)', 'grains', [360, 8, 76, 1.8, 3], { refined: true }),
  n('pap', 'Pap (ogi)', 'grains', [190, 2.5, 42, 1.2, 1], { refined: true }),
  n('garri', 'Garri', 'grains', [360, 1.2, 85, 0.5, 2], { refined: true }),
  n('fufu', 'Cassava fufu (akpu)', 'grains', [160, 0.6, 38, 0.2, 1.5], { refined: true }),
  n('starch', 'Cassava starch (usi)', 'grains', [350, 0.2, 87, 0.1, 0.9], { refined: true }),
  n('abacha', 'Abacha (dried cassava shreds)', 'grains', [340, 1.5, 83, 0.4, 3], { refined: true }),
  n('yam-flour', 'Yam flour (elubo)', 'grains', [330, 3.5, 77, 0.5, 4.5]),
  n('plantain-flour', 'Unripe plantain flour', 'grains', [340, 3, 78, 0.8, 6], { cost: 2 }),
  n('wheat-flour', 'Wheat meal', 'grains', [340, 13, 61, 2.5, 10.7]),
  n('wholewheat-bread', 'Whole-wheat bread', 'grains', [247, 13, 34, 3.4, 7, 1, 0.7], { unit: '', pieceG: 30, pieceName: 'slice', cost: 2 }),
  n('wholewheat-wrap', 'Whole-wheat wrap', 'grains', [290, 9, 45, 7, 6, 1, 2], { unit: '', pieceG: 50, pieceName: 'wrap', cost: 2 }),
  n('wholewheat-spaghetti', 'Whole-wheat spaghetti', 'grains', [350, 13, 63, 2.5, 8, 0.01], { cost: 2 }),
  n('tom-brown', 'Tom brown mix (roasted maize, soya, groundnut)', 'grains', [430, 18, 58, 13, 7, 0.05, 2.5]),
  n('popcorn', 'Popcorn kernels', 'grains', [387, 13, 62, 4.5, 14.5]),

  // ---------------------------------------------------------------- beans, nuts and seeds
  n('beans-brown', 'Brown beans', 'grains', [336, 23.5, 50, 1.3, 10.6, 0.04, 0.3]),
  n('beans-white', 'White beans (black-eyed)', 'grains', [336, 23, 50, 1.3, 10.6, 0.04, 0.3]),
  n('bambara', 'Bambara nut flour (okpa)', 'grains', [367, 18.8, 55, 6.2, 5.5, 0.05, 1.2]),
  n('ukwa', 'African breadfruit (ukwa), dehulled', 'grains', [384, 15, 58, 7, 8, 0.03, 1.5]),
  n('soy-milk', 'Soya milk (unsweetened)', 'dairy', [33, 3.3, 1.5, 1.8, 0.4, 0.1, 0.3], { unit: 'ml', cost: 2 }),
  n('groundnuts', 'Roasted groundnuts (unsalted)', 'pantry', [585, 24, 16, 49, 8, 0.02, 7], { contains: 'nuts' }),
  n('groundnut-paste', 'Groundnut paste', 'pantry', [590, 25, 15, 50, 6, 0.4, 10], { contains: 'nuts' }),
  n('kuli-kuli', 'Kuli-kuli (groundnut cake)', 'pantry', [520, 30, 20, 38, 6, 0.5, 7], { contains: 'nuts' }),
  n('cashews', 'Cashew nuts (unsalted)', 'pantry', [553, 18, 27, 44, 3.3, 0.03, 8], { contains: 'nuts', cost: 3 }),
  n('tigernuts', 'Tiger nuts', 'pantry', [409, 4.6, 40, 24, 17, 0.02, 4]),
  n('egusi', 'Ground egusi', 'pantry', [560, 28, 9, 47, 4, 0.05, 7]),
  n('ogbono', 'Ground ogbono', 'pantry', [680, 8, 12, 65, 14, 0.02, 55], { cost: 2 }),
  n('ugba', 'Ugba (oil bean slices)', 'pantry', [230, 12, 12, 15, 5, 0.3, 3]),

  // ---------------------------------------------------------------- fish, meat and eggs
  n('fish-fresh', 'Fresh fish (croaker, tilapia or mackerel)', 'protein', [130, 20, 0, 5.5, 0, 0.15, 1.3], { contains: 'fish', cost: 2 }),
  n('catfish', 'Catfish', 'protein', [110, 17, 0, 4.5, 0, 0.15, 1], { contains: 'fish', cost: 2 }),
  n('fish-dried', 'Dried or smoked fish', 'protein', [300, 60, 0, 6, 0, 1.5, 1.5], { contains: 'fish', cost: 2 }),
  n('sardines', 'Sardines (canned, drained)', 'protein', [210, 25, 0, 11.5, 0, 0.8, 1.5], { contains: 'fish', cost: 2 }),
  n('crayfish', 'Ground crayfish', 'protein', [300, 60, 2, 4, 0, 4, 1], { contains: 'shellfish' }),
  n('prawns', 'Prawns', 'protein', [85, 20, 0, 0.5, 0, 0.3, 0.1], { contains: 'shellfish', cost: 3 }),
  n('periwinkle', 'Periwinkle (shelled)', 'protein', [90, 16, 3, 1.5, 0, 0.6, 0.3], { contains: 'shellfish', cost: 2 }),
  n('chicken', 'Chicken (skinless)', 'protein', [120, 23, 0, 2.6, 0, 0.17, 0.7], { contains: 'chicken', cost: 2 }),
  n('beef', 'Lean beef', 'protein', [150, 21, 0, 7, 0, 0.15, 3], { contains: 'beef', cost: 3 }),
  n('goat', 'Goat meat', 'protein', [122, 23, 0, 2.6, 0, 0.2, 0.8], { contains: 'beef', cost: 3 }),
  n('pork', 'Lean pork', 'protein', [145, 21, 0, 6.5, 0, 0.15, 2.3], { contains: 'pork', cost: 2 }),
  n('egg', 'Egg', 'protein', [143, 12.6, 0.7, 9.5, 0, 0.36, 3.1], { contains: 'egg', unit: '', pieceG: 50, pieceName: 'egg' }),

  // ---------------------------------------------------------------- dairy
  n('milk', 'Milk', 'dairy', [61, 3.2, 4.8, 3.3, 0, 0.1, 1.9], { contains: 'dairy', unit: 'ml', cost: 2 }),
  n('yoghurt', 'Plain yoghurt (pasteurised)', 'dairy', [61, 3.5, 4.7, 3.3, 0, 0.12, 2.1], { contains: 'dairy', cost: 2 }),

  // ---------------------------------------------------------------- oils, seasonings and spices
  n('palm-oil', 'Palm oil', 'pantry', [884, 0, 0, 100, 0, 0, 49], { unit: 'ml' }),
  n('veg-oil', 'Vegetable oil', 'pantry', [884, 0, 0, 100, 0, 0, 15], { unit: 'ml' }),
  n('olive-oil', 'Olive oil', 'pantry', [884, 0, 0, 100, 0, 0, 14], { unit: 'ml', cost: 3 }),
  n('palm-fruit', 'Palm fruit concentrate (banga)', 'pantry', [300, 2, 6, 30, 5, 0.05, 15]),
  n('coconut-milk', 'Coconut milk', 'pantry', [200, 2, 3, 21, 0, 0.03, 18], { unit: 'ml', cost: 2 }),
  n('locust-beans', 'Locust beans (iru or dawadawa)', 'pantry', [220, 18, 8, 14, 6, 0.5, 3]),
  n('ogiri', 'Ogiri (fermented seasoning)', 'pantry', [400, 30, 12, 30, 5, 3, 5]),
  n('baobab-leaf', 'Kuka (baobab leaf powder)', 'pantry', [280, 12, 45, 4, 30, 0.05]),
  n('hibiscus', 'Zobo leaves (dried hibiscus)', 'pantry', [50, 1, 10, 0.3, 2, 0.01], { avoidPregnancy: true }),
  n('pepper-soup-spice', 'Pepper soup spice', 'pantry', [280, 8, 40, 6, 30, 0.1]),
  n('suya-spice', 'Suya spice (yaji)', 'pantry', [450, 22, 25, 30, 8, 6, 5], { contains: 'nuts' }),
  n('stock-cube', 'Seasoning cube', 'pantry', [250, 10, 20, 15, 0, 57, 8], { unit: '', pieceG: 4, pieceName: 'cube' }),
  n('salt', 'Iodised salt', 'pantry', [0, 0, 0, 0, 0, 100, 0]),
]

export const INGREDIENTS_BY_ID = Object.fromEntries(INGREDIENTS.map((x) => [x.id, x]))
