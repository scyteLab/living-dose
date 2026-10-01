/**
 * Living Dose shop catalogue (sample data for development).
 * Prices are PLACEHOLDERS in naira, to be replaced with real prices before launch.
 * `ingredientIds` links a product to recipe ingredients, so a meal plan's
 * shopping list can be added to the basket in one step.
 * `trace` is shown on the product page (farm to door). Farm names are generic
 * until real partner farms are signed.
 */
export const CATEGORIES = ['produce', 'grains', 'protein', 'pantry', 'dairy', 'packs']

const p = (o) => ({ tags: [], ingredientIds: [], trace: null, stock: 50, ...o })

export const PRODUCTS = [
  // ---------------------------------------------------------------- produce
  p({ id: 'ugu', name: 'Ugu leaves', category: 'produce', unit: '250 g bunch', price: 800, tags: ['diabetic', 'heart', 'pregnancy', 'lowCost'], ingredientIds: ['ugu'], trace: { place: 'Partner farm, Ogun State', days: 1 },
      description: 'Fresh fluted pumpkin leaves, washed and bundled on the day of harvest. Rich in iron and folate.' }),
  p({ id: 'spinach', name: 'Spinach (efo tete)', category: 'produce', unit: '250 g bunch', price: 700, tags: ['diabetic', 'heart', 'pregnancy', 'lowCost'], ingredientIds: ['spinach'], trace: { place: 'Partner farm, Ogun State', days: 1 },
      description: 'Tender African spinach for efo riro, egusi and stews.' }),
  p({ id: 'waterleaf', name: 'Waterleaf', category: 'produce', unit: '250 g bunch', price: 700, tags: ['diabetic', 'heart', 'lowCost'], ingredientIds: ['waterleaf'], trace: { place: 'Partner farm, Ogun State', days: 1 },
      description: 'Soft waterleaf for vegetable soup and edikang ikong.' }),
  p({ id: 'scent-leaves', name: 'Scent leaves', category: 'produce', unit: 'Small bunch', price: 400, tags: ['lowCost'], ingredientIds: ['scent-leaves'], trace: { place: 'Partner farm, Oyo State', days: 1 },
      description: 'Fragrant leaves for pepper soup and stews.' }),
  p({ id: 'garden-eggs', name: 'Garden eggs', category: 'produce', unit: '6 pieces', price: 600, tags: ['diabetic', 'heart', 'lowCost'], ingredientIds: ['garden-egg'], trace: { place: 'Partner farm, Oyo State', days: 2 },
      description: 'Crunchy garden eggs, a filling low-sugar snack.' }),
  p({ id: 'plantain', name: 'Unripe plantain', category: 'produce', unit: 'Bunch of 4', price: 2500, tags: ['diabetic', 'pregnancy'], ingredientIds: ['plantain-unripe'], trace: { place: 'Partner farm, Ondo State', days: 2 },
      description: 'Firm green plantain, slower to raise blood sugar than ripe plantain.' }),
  p({ id: 'tomatoes', name: 'Tomatoes', category: 'produce', unit: '1 kg', price: 2200, tags: ['heart'], ingredientIds: ['tomato'], trace: { place: 'Partner farm, Plateau State', days: 3 },
      description: 'Ripe tomatoes for stews, sauces and salads.' }),
  p({ id: 'pepper-mix', name: 'Tatashe and scotch bonnet mix', category: 'produce', unit: '500 g', price: 1800, tags: [], ingredientIds: ['pepper-mix'], trace: { place: 'Partner farm, Kaduna State', days: 2 },
      description: 'Our stew base mix of red bell pepper and scotch bonnet.' }),
  p({ id: 'onions', name: 'Onions', category: 'produce', unit: '1 kg', price: 1500, tags: ['lowCost'], ingredientIds: ['onion'], trace: { place: 'Partner farm, Kano State', days: 4 },
      description: 'Red onions, cured for a longer shelf life.' }),
  p({ id: 'carrots', name: 'Carrots', category: 'produce', unit: '500 g', price: 1000, tags: ['diabetic', 'heart', 'pregnancy'], ingredientIds: ['carrot'], trace: { place: 'Partner farm, Plateau State', days: 3 },
      description: 'Sweet, crunchy carrots from the Jos Plateau.' }),
  p({ id: 'okra', name: 'Okra', category: 'produce', unit: '500 g', price: 1200, tags: ['diabetic', 'heart', 'pregnancy'], ingredientIds: ['okra'], trace: { place: 'Partner farm, Oyo State', days: 1 },
      description: 'Young, tender okra for soup.' }),
  p({ id: 'sweet-potato', name: 'Sweet potato', category: 'produce', unit: '1 kg', price: 1500, tags: ['diabetic', 'heart', 'pregnancy'], ingredientIds: ['sweet-potato'], trace: { place: 'Partner farm, Benue State', days: 3 },
      description: 'Orange-fleshed sweet potato, high in fibre and vitamin A.' }),
  p({ id: 'yam', name: 'Yam', category: 'produce', unit: 'Medium tuber, about 2 kg', price: 4500, tags: ['pregnancy'], ingredientIds: ['yam'], trace: { place: 'Partner farm, Benue State', days: 5 },
      description: 'Firm white yam for boiling, porridge and pepper soup.' }),
  p({ id: 'lettuce-cucumber', name: 'Lettuce and cucumber pack', category: 'produce', unit: '1 lettuce, 2 cucumbers', price: 1300, tags: ['diabetic', 'heart'], ingredientIds: ['lettuce'], trace: { place: 'Partner farm, Plateau State', days: 2 },
      description: 'Salad basics, crisp and ready to wash.' }),
  p({ id: 'oranges', name: 'Oranges', category: 'produce', unit: '6 pieces', price: 1500, tags: ['diabetic', 'heart', 'pregnancy', 'lowCost'], ingredientIds: ['orange'], trace: { place: 'Partner farm, Benue State', days: 3 },
      description: 'Juicy sweet oranges. Eat them whole for the fibre.' }),
  p({ id: 'bananas', name: 'Bananas', category: 'produce', unit: 'Bunch of about 8', price: 1500, tags: ['heart', 'pregnancy'], ingredientIds: ['banana'], trace: { place: 'Partner farm, Ogun State', days: 2 },
      description: 'Naturally sweet bananas for breakfast and snacks.' }),
  p({ id: 'pawpaw', name: 'Pawpaw', category: 'produce', unit: '1 medium', price: 1200, tags: ['diabetic', 'heart'], ingredientIds: ['pawpaw'], trace: { place: 'Partner farm, Ogun State', days: 2 },
      description: 'Ripe pawpaw, good for digestion.' }),
  p({ id: 'avocado', name: 'Avocados', category: 'produce', unit: '2 pieces', price: 1600, tags: ['diabetic', 'heart', 'pregnancy'], ingredientIds: ['avocado'], trace: { place: 'Partner farm, Ondo State', days: 3 },
      description: 'Creamy avocados, full of heart-healthy fats.' }),
  p({ id: 'watermelon', name: 'Watermelon', category: 'produce', unit: '1 small', price: 2500, tags: ['heart', 'pregnancy'], ingredientIds: ['watermelon'], trace: { place: 'Partner farm, Kano State', days: 4 },
      description: 'Refreshing and hydrating.' }),

  p({ id: 'green-beans', name: 'Green beans', category: 'produce', unit: '500 g', price: 1400, tags: ['diabetic', 'heart', 'pregnancy'], ingredientIds: ['green-beans'], trace: { place: 'Partner farm, Plateau State', days: 3 },
      description: 'Crisp green beans for salads and steaming.' }),
  p({ id: 'stir-fry-mix', name: 'Stir-fry vegetable mix', category: 'produce', unit: '500 g of cabbage, carrot and green pepper', price: 1600, tags: ['diabetic', 'heart'], ingredientIds: ['mixed-veg'], trace: { place: 'Partner farm, Plateau State', days: 2 },
      description: 'Sliced and ready to cook in minutes.' }),
  p({ id: 'corn', name: 'Fresh corn', category: 'produce', unit: '4 cobs', price: 1200, tags: ['pregnancy', 'lowCost'], ingredientIds: ['corn'], trace: { place: 'Partner farm, Oyo State', days: 1 },
      description: 'Sweet young corn for boiling or roasting.' }),
  p({ id: 'coconut', name: 'Coconut', category: 'produce', unit: '1 whole', price: 900, tags: ['lowCost'], ingredientIds: ['coconut'], trace: { place: 'Partner farm, Lagos', days: 5 },
      description: 'Mature coconut. Pairs well with corn.' }),

  // ---------------------------------------------------------------- grains, beans and swallows
  p({ id: 'ofada-rice', name: 'Ofada rice', category: 'grains', unit: '1 kg', price: 3500, tags: ['diabetic'], ingredientIds: ['ofada-rice'], trace: { place: 'Partner mill, Ogun State', days: 14 },
      description: 'Local unpolished rice with more fibre than white rice.' }),
  p({ id: 'brown-rice', name: 'Brown rice', category: 'grains', unit: '1 kg', price: 3800, tags: ['diabetic', 'heart'], ingredientIds: ['brown-rice', 'rice'], trace: { place: 'Partner mill, Kebbi State', days: 14 },
      description: 'Whole-grain rice that keeps you full for longer.' }),
  p({ id: 'brown-beans', name: 'Brown beans (oloyin)', category: 'grains', unit: '1 kg', price: 3200, tags: ['diabetic', 'heart', 'pregnancy', 'protein'], ingredientIds: ['beans-brown'], trace: { place: 'Partner farm, Kano State', days: 21 },
      description: 'Sweet honey beans, sorted and stone-free.' }),
  p({ id: 'oats', name: 'Rolled oats', category: 'grains', unit: '500 g', price: 2800, tags: ['diabetic', 'heart', 'pregnancy'], ingredientIds: ['oats'],
      description: 'Whole rolled oats for porridge and breakfast bowls.' }),
  p({ id: 'wholewheat-bread', name: 'Whole-wheat bread', category: 'grains', unit: '1 loaf', price: 2000, tags: ['diabetic', 'heart'], ingredientIds: ['wholewheat-bread'],
      description: 'Baked with whole-wheat flour, no added sugar.' }),
  p({ id: 'wheat-meal', name: 'Wheat meal', category: 'grains', unit: '1 kg', price: 2600, tags: ['diabetic'], ingredientIds: ['wheat-flour'],
      description: 'For a lighter swallow with more fibre.' }),
  p({ id: 'garri', name: 'Garri (yellow)', category: 'grains', unit: '1 kg', price: 1500, tags: ['lowCost'], ingredientIds: ['garri'], trace: { place: 'Partner processor, Ogun State', days: 10 },
      description: 'Fine yellow garri for eba.' }),
  p({ id: 'yam-flour', name: 'Yam flour (elubo)', category: 'grains', unit: '1 kg', price: 3000, tags: [], ingredientIds: ['yam-flour'],
      description: 'For smooth, dark amala.' }),

  p({ id: 'pap', name: 'Pap (ogi)', category: 'grains', unit: '1 kg wet paste', price: 1500, tags: ['lowCost'], ingredientIds: ['pap'], trace: { place: 'Partner processor, Oyo State', days: 2 },
      description: 'Smooth fermented corn paste. Serve without added sugar.' }),

  // ---------------------------------------------------------------- fish, meat and eggs
  p({ id: 'fish-croaker', name: 'Fresh croaker fish', category: 'protein', unit: '1 kg, cleaned', price: 7000, tags: ['diabetic', 'heart', 'pregnancy', 'protein'], ingredientIds: ['fish-fresh'], trace: { place: 'Partner fishery, Lagos', days: 1 },
      description: 'Cleaned and cut, delivered chilled.' }),
  p({ id: 'chicken', name: 'Chicken, skinless', category: 'protein', unit: '1 kg', price: 6500, tags: ['heart', 'protein'], ingredientIds: ['chicken'], trace: { place: 'Partner poultry farm, Ogun State', days: 1 },
      description: 'Skin removed to cut the fat. Delivered chilled.' }),
  p({ id: 'eggs', name: 'Eggs', category: 'protein', unit: 'Tray of 12', price: 2800, tags: ['protein', 'pregnancy'], ingredientIds: ['egg'], trace: { place: 'Partner poultry farm, Oyo State', days: 2 },
      description: 'Fresh farm eggs. Cook until the yolk is firm in pregnancy.' }),
  p({ id: 'crayfish', name: 'Ground crayfish', category: 'protein', unit: '100 g', price: 1500, tags: [], ingredientIds: ['crayfish'],
      description: 'Adds rich flavour, so you can use fewer seasoning cubes.' }),

  p({ id: 'prawns', name: 'Prawns, peeled', category: 'protein', unit: '500 g', price: 8500, tags: ['heart', 'protein', 'diabetic'], ingredientIds: ['prawns'], trace: { place: 'Partner fishery, Lagos', days: 1 },
      description: 'Peeled and deveined, delivered chilled. Cook until pink all through.' }),
  p({ id: 'beef', name: 'Lean beef', category: 'protein', unit: '1 kg', price: 8000, tags: ['protein'], ingredientIds: ['beef'], trace: { place: 'Partner abattoir, Lagos', days: 1 },
      description: 'Trimmed lean beef, cut into stew pieces.' }),
  p({ id: 'pork', name: 'Lean pork', category: 'protein', unit: '1 kg', price: 7000, tags: ['protein'], ingredientIds: ['pork'], trace: { place: 'Partner farm, Ogun State', days: 1 },
      description: 'Trimmed lean pork. Cook all the way through.' }),

  // ---------------------------------------------------------------- pantry and dairy
  p({ id: 'palm-oil', name: 'Palm oil', category: 'pantry', unit: '1 litre', price: 3000, tags: [], ingredientIds: ['palm-oil'], trace: { place: 'Partner mill, Ogun State', days: 30 },
      description: 'Red palm oil. A little goes a long way.' }),
  p({ id: 'groundnuts', name: 'Roasted groundnuts, unsalted', category: 'pantry', unit: '250 g', price: 1200, tags: ['diabetic', 'heart'], ingredientIds: ['groundnuts'],
      description: 'Dry-roasted, no salt added.' }),
  p({ id: 'egusi', name: 'Ground egusi', category: 'pantry', unit: '250 g', price: 2000, tags: ['protein'], ingredientIds: ['egusi'],
      description: 'Freshly ground melon seeds for egusi soup.' }),
  p({ id: 'veg-oil', name: 'Vegetable oil', category: 'pantry', unit: '1 litre', price: 3200, tags: [], ingredientIds: ['veg-oil'],
      description: 'Light cooking oil. Measure it rather than pouring.' }),
  p({ id: 'olive-oil', name: 'Olive oil', category: 'pantry', unit: '500 ml', price: 6500, tags: ['heart'], ingredientIds: ['olive-oil'],
      description: 'For dressings and light cooking.' }),
  p({ id: 'pepper-soup-spice', name: 'Pepper soup spice', category: 'pantry', unit: '100 g', price: 1200, tags: [], ingredientIds: ['pepper-soup-spice'],
      description: 'Ground calabash nutmeg, alligator pepper and other spices.' }),
  p({ id: 'groundnut-paste', name: 'Groundnut paste', category: 'pantry', unit: '250 g', price: 1800, tags: ['diabetic', 'heart'], ingredientIds: ['groundnut-paste'],
      description: 'Smooth paste made from roasted groundnuts only.' }),
  p({ id: 'cashews', name: 'Cashew nuts, unsalted', category: 'pantry', unit: '250 g', price: 3500, tags: ['heart'], ingredientIds: ['cashews'],
      description: 'Roasted cashews with no added salt.' }),
  p({ id: 'tiger-nuts', name: 'Tiger nuts', category: 'pantry', unit: '250 g', price: 1500, tags: ['heart'], ingredientIds: ['tigernuts'],
      description: 'Dried tiger nuts. Soak them to soften.' }),
  p({ id: 'dates', name: 'Dates', category: 'pantry', unit: '250 g', price: 2000, tags: [], ingredientIds: ['dates'],
      description: 'Naturally sweet. Two make a satisfying snack.' }),
  p({ id: 'milk', name: 'Milk', category: 'dairy', unit: '1 litre', price: 2200, tags: ['pregnancy'], ingredientIds: ['milk'],
      description: 'Pasteurised full-cream milk.' }),
  p({ id: 'yoghurt', name: 'Plain yoghurt', category: 'dairy', unit: '500 g', price: 2500, tags: ['heart', 'pregnancy'], ingredientIds: ['yoghurt'],
      description: 'Pasteurised, unsweetened. Add fruit for sweetness.' }),

  // ---------------------------------------------------------------- ready meal packs
  p({ id: 'pack-diabetic', name: 'Blood-sugar friendly lunch pack', category: 'packs', unit: '5 lunches', price: 22500, tags: ['diabetic', 'heart'], stock: 20,
      description: 'Five ready-to-heat lunches built on whole grains, beans and vegetables. Made in our kitchen and delivered chilled.' }),
  p({ id: 'pack-heart', name: 'Heart-healthy dinner pack', category: 'packs', unit: '5 dinners', price: 21000, tags: ['heart', 'diabetic'], stock: 20,
      description: 'Five low-salt dinners: pepper soups, grilled fish and vegetable dishes.' }),
  p({ id: 'pack-pregnancy', name: 'Pregnancy nourish pack', category: 'packs', unit: '5 meals', price: 23000, tags: ['pregnancy', 'protein'], stock: 20,
      description: 'Five balanced meals with extra protein, iron and folate, all fully cooked and pregnancy-safe.' }),
]

export const PRODUCTS_BY_ID = Object.fromEntries(PRODUCTS.map((x) => [x.id, x]))
