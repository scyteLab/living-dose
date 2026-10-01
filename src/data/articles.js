/**
 * Learn articles (English).
 *
 * Written by the Living Dose team from well-established public health guidance.
 * Every article must be reviewed and signed off by a registered dietitian or
 * doctor before launch: set `reviewedBy` and `reviewedOn` when that happens.
 * Until then the article page shows "Awaiting clinical review".
 *
 * section: { heading, paragraphs?: [], list?: [], tip? }
 */
export const TOPICS = ['eating', 'diabetes', 'heart', 'weight', 'activity', 'sleep', 'mind', 'habits', 'pregnancy']

const a = (o) => ({ reviewedBy: null, reviewedOn: null, updated: '2026-09-30', ...o })

export const ARTICLES = [
  a({
    slug: 'fewer-seasoning-cubes',
    topic: 'heart',
    title: '5 ways to use fewer seasoning cubes without losing flavour',
    summary: 'Stock and seasoning cubes are one of the biggest hidden sources of salt in Nigerian cooking. Here is how to cut down while keeping the taste you love.',
    sections: [
      {
        heading: 'Why it matters',
        paragraphs: [
          'Too much salt raises blood pressure, and high blood pressure is a leading cause of stroke, heart disease and kidney disease. The World Health Organization recommends that adults eat less than 5 g of salt a day, which is about one level teaspoon.',
          'Seasoning cubes are made mostly of salt. Depending on the brand, one cube can supply a large share of that daily limit, before you add any salt from the pot or the table. Check the label: it usually lists salt or sodium per cube.',
        ],
      },
      {
        heading: 'Five swaps that work',
        list: [
          'Cut down gradually. Use one cube less this week and another less in two weeks. Your taste buds adjust within a few weeks, and food starts to taste salty enough with less.',
          'Build flavour from the base. Fry onions slowly, and add fresh garlic, ginger and pepper. They give depth that cubes usually cover up.',
          'Use ground crayfish, dried fish or a little iru (locust beans) for the savoury taste. They are rich in flavour, so a small amount goes a long way.',
          'Finish with fresh herbs and leaves such as scent leaf, uziza or basil, added at the end of cooking.',
          'Taste before you season. Add salt or a cube at the end, only if the dish needs it.',
        ],
      },
      {
        heading: 'Watch for other hidden salt',
        paragraphs: [
          'Instant noodle seasoning packets, canned foods, processed meats and many snacks are also high in salt. When you have them, cut back on salt elsewhere that day.',
        ],
        tip: 'Keep the salt shaker off the table. It is an easy habit to break when it is not within reach.',
      },
    ],
    takeaways: ['Adults should have less than 5 g of salt a day.', 'Cut cubes down gradually; your taste adjusts in a few weeks.', 'Onions, garlic, ginger, crayfish and fresh herbs add flavour without the salt.'],
    sources: ['World Health Organization: Salt reduction fact sheet', 'World Health Organization: Healthy diet fact sheet'],
  }),
  a({
    slug: 'more-vegetables',
    topic: 'eating',
    title: 'Easy ways to add vegetables to Nigerian meals',
    summary: 'Most adults eat far fewer vegetables and fruit than they need. These simple changes add more to the meals you already cook.',
    sections: [
      {
        heading: 'How much do we need?',
        paragraphs: [
          'The World Health Organization recommends at least 400 g of fruit and vegetables a day, roughly five portions. A portion is about a handful: a cupful of cooked leafy vegetables, a medium orange or banana, or a few garden eggs.',
          'Vegetables and fruit give you fibre, vitamins and minerals, help you feel full, and lower the risk of heart disease, stroke and type 2 diabetes.',
        ],
      },
      {
        heading: 'Add them to what you already cook',
        list: [
          'Stir a generous handful of ugu, spinach or waterleaf into stews and sauces in the last few minutes of cooking.',
          'Make soups with more vegetables and slightly less oil and meat: okra, efo riro and vegetable soup are a great start.',
          'Fill half your plate with vegetables, a quarter with protein and a quarter with rice, yam or swallow.',
          'Add sliced tomatoes, cucumber or carrots to rice and beans.',
          'Snack on garden eggs, carrots, cucumber or a piece of fruit instead of biscuits.',
        ],
      },
      {
        heading: 'Making it affordable',
        paragraphs: [
          'Seasonal vegetables from the market are usually cheapest and freshest. Leafy vegetables can be blanched and frozen in portions so nothing goes to waste.',
        ],
        tip: 'Wash vegetables and fruit well in clean water before eating, especially if you eat them raw.',
      },
    ],
    takeaways: ['Aim for at least five portions of fruit and vegetables a day.', 'Add leafy vegetables to stews and soups you already make.', 'Half the plate vegetables, a quarter protein, a quarter starch.'],
    sources: ['World Health Organization: Healthy diet fact sheet', 'World Health Organization: Increasing fruit and vegetable consumption to reduce the risk of noncommunicable diseases'],
  }),
  a({
    slug: '150-active-minutes',
    topic: 'activity',
    title: 'How to fit 150 active minutes into a busy week',
    summary: 'You don’t need a gym or a lot of free time. Short bursts of movement through the day add up quickly.',
    sections: [
      {
        heading: 'What the guidelines say',
        paragraphs: [
          'The World Health Organization recommends that adults do at least 150 to 300 minutes of moderate activity a week, or 75 to 150 minutes of vigorous activity, plus muscle-strengthening on two or more days.',
          'Moderate activity makes you breathe faster but you can still talk. Vigorous activity makes it hard to say more than a few words. Since 2020 the guidelines are clear that every minute counts: there is no minimum length for a session.',
        ],
      },
      {
        heading: 'Ideas that fit real life',
        list: [
          'Walk briskly for 10 to 20 minutes after dinner. It also helps keep blood sugar steady.',
          'Get off the bus or keke one stop early and walk the rest.',
          'Take the stairs instead of the lift.',
          'Dance to a few songs at home. It counts.',
          'Do active chores briskly: sweeping, washing the car, gardening or farm work.',
          'Walk while you talk on the phone.',
        ],
      },
      {
        heading: 'Starting safely',
        paragraphs: [
          'If you have been inactive, start with 5 to 10 minutes a day and build up each week. If you have a heart condition, chest pain, or feel dizzy or very short of breath when active, speak to a doctor before increasing your activity.',
        ],
        tip: 'Log your minutes on your Living Dose home screen. Seeing the total grow keeps you going.',
      },
    ],
    takeaways: ['Aim for 150 to 300 moderate minutes a week.', 'Every minute counts, even short walks.', 'Build up slowly and check with a doctor if you have a heart condition.'],
    sources: ['World Health Organization: Guidelines on physical activity and sedentary behaviour (2020)'],
  }),
  a({
    slug: 'better-drinks',
    topic: 'diabetes',
    title: 'Better drinks than soft drinks and sweet malt',
    summary: 'Sugary drinks add a lot of sugar without filling you up. Swapping just one a day makes a real difference.',
    sections: [
      {
        heading: 'The hidden sugar',
        paragraphs: [
          'The World Health Organization recommends keeping free sugars to less than 10% of daily energy, and ideally under 5%. For most adults, 5% is about six teaspoons a day.',
          'A single bottle of soft drink can contain more than ten teaspoons of sugar. Malt drinks, energy drinks, sweetened juices, sweetened zobo and kunu, and tea or coffee with sugar can all be high too. Regularly drinking sugary drinks is linked to weight gain, tooth decay and type 2 diabetes.',
        ],
      },
      {
        heading: 'Better choices',
        list: [
          'Water, plain or with slices of lemon, lime, cucumber or ginger.',
          'Zobo made without added sugar. Ginger and pineapple peel add natural flavour.',
          'Tea or coffee without sugar, or with less sugar each week.',
          'Fresh whole fruit instead of juice, so you get the fibre too.',
        ],
      },
      {
        heading: 'Cutting down without missing it',
        paragraphs: [
          'Go step by step: half a bottle instead of a whole one, then a smaller bottle, then only at weekends. If you add sugar to tea, use one spoon less each week.',
        ],
        tip: 'Keep a bottle of cold water with you. Thirst is often what makes us reach for a soft drink.',
      },
    ],
    takeaways: ['Free sugars should be under 10% of daily energy, ideally under 5%.', 'One bottle of soft drink can hold more than ten teaspoons of sugar.', 'Water, unsweetened zobo and whole fruit are better choices.'],
    sources: ['World Health Organization: Guideline on sugars intake for adults and children (2015)'],
  }),
  a({
    slug: 'boil-grill-steam',
    topic: 'heart',
    title: 'Boil, grill or steam: healthier ways with plantain and yam',
    summary: 'Frying soaks food in oil. These cooking methods keep the taste and cut the fat.',
    sections: [
      {
        heading: 'Why cooking method matters',
        paragraphs: [
          'Deep-fried foods absorb a lot of oil, which adds energy (calories) quickly and can make it harder to manage weight. Oil that is reheated again and again also breaks down, so it’s best not to reuse frying oil many times.',
        ],
      },
      {
        heading: 'Swaps to try',
        list: [
          'Boiled or roasted plantain (boli) instead of dodo.',
          'Boiled or roasted yam with a vegetable sauce instead of fried yam.',
          'Moi moi instead of akara. Same beans, steamed instead of fried.',
          'Grilled or pepper-soup fish instead of fried fish.',
          'Oven-baked or air-fried chicken instead of deep-fried.',
        ],
      },
      {
        heading: 'When you do fry',
        paragraphs: ['Measure the oil with a spoon instead of pouring from the bottle, use a non-stick pan, and drain fried food on paper towels.'],
        tip: 'Roast sliced plantain in a hot oven with a light brush of oil. It caramelises beautifully.',
      },
    ],
    takeaways: ['Fried food absorbs a lot of oil.', 'Boiling, grilling, steaming and roasting keep flavour with less fat.', 'Measure oil and avoid reusing frying oil many times.'],
    sources: ['World Health Organization: Healthy diet fact sheet'],
  }),
  a({
    slug: 'whole-grains-guide',
    topic: 'diabetes',
    title: 'A simple guide to whole grains in Nigeria',
    summary: 'Whole grains keep you fuller for longer and help steady your blood sugar. Many of them are already in our markets.',
    sections: [
      {
        heading: 'What is a whole grain?',
        paragraphs: [
          'A whole grain keeps all three parts of the seed: the bran, germ and endosperm. Refining removes the bran and germ, along with much of the fibre and nutrients. White rice, white bread and most pasta are refined.',
          'Fibre slows digestion, so whole grains raise blood sugar more gently and keep you full for longer. Eating more whole grains is linked with a lower risk of heart disease and type 2 diabetes.',
        ],
      },
      {
        heading: 'Whole grains you can find locally',
        list: ['Ofada rice and brown rice', 'Millet and sorghum (guinea corn)', 'Whole maize, such as fresh corn on the cob', 'Oats', 'Whole-wheat bread and wheat meal'],
      },
      {
        heading: 'Easy ways to start',
        list: [
          'Mix half brown or ofada rice with half white rice, then shift the balance over time.',
          'Choose bread where "whole wheat" or "wholemeal" is the first ingredient.',
          'Have oats or millet pap for breakfast, without added sugar.',
        ],
        tip: 'Portion size still matters with whole grains and swallows. Aim for about the size of your fist.',
      },
    ],
    takeaways: ['Whole grains keep the fibre that refining removes.', 'They raise blood sugar more gently and keep you full.', 'Start by mixing half whole grain with half refined.'],
    sources: ['World Health Organization: Healthy diet fact sheet', 'World Health Organization: Carbohydrate intake for adults and children (2023)'],
  }),
  a({
    slug: 'strength-at-home',
    topic: 'activity',
    title: 'Strength exercises you can do at home',
    summary: 'Muscle-strengthening twice a week protects your joints, bones and blood sugar. No gym needed.',
    sections: [
      {
        heading: 'Why strength matters',
        paragraphs: [
          'The World Health Organization recommends muscle-strengthening activities on at least two days a week. Stronger muscles help control blood sugar, support your joints, keep bones healthy and make everyday tasks easier as you get older.',
        ],
      },
      {
        heading: 'A simple 10-minute routine',
        list: [
          'Chair squats: sit down onto a chair and stand back up, without using your hands if you can. 10 times.',
          'Wall push-ups: hands on a wall at shoulder height, bend your elbows and push back. 10 times.',
          'Step-ups: step up onto the bottom stair and down again, alternating legs. 10 each side.',
          'Water-bottle rows: lean on a table with one hand and lift a filled bottle towards your ribs. 10 each side.',
          'Plank: hold a straight line from head to heels, on your knees if needed, for 15 to 30 seconds.',
        ],
        paragraphs: ['Rest for a minute, then repeat the whole set once more.'],
      },
      {
        heading: 'Doing it safely',
        paragraphs: [
          'Move slowly and with control, and breathe out as you push. Stop if you feel sharp pain. If you have a heart condition, high blood pressure that isn’t controlled, or a recent injury, ask a doctor first.',
        ],
        tip: 'Pair it with something you already do every day, like after your morning bath.',
      },
    ],
    takeaways: ['Do muscle-strengthening on two or more days a week.', 'Squats, wall push-ups and step-ups need no equipment.', 'Move slowly and stop if something hurts.'],
    sources: ['World Health Organization: Guidelines on physical activity and sedentary behaviour (2020)'],
  }),
  a({
    slug: 'better-sleep',
    topic: 'sleep',
    title: 'Seven habits for better sleep',
    summary: 'Good sleep supports your weight, blood sugar and mood. Small changes to your routine can make a big difference.',
    sections: [
      {
        heading: 'How much sleep do adults need?',
        paragraphs: [
          'Most adults need 7 to 9 hours a night. Regularly sleeping less is linked with weight gain, higher blood sugar, high blood pressure and low mood.',
        ],
      },
      {
        heading: 'Seven habits',
        list: [
          'Go to bed and get up at about the same time every day, weekends included.',
          'Get some daylight in the morning.',
          'Avoid coffee, strong tea, cola and energy drinks after midday.',
          'Put screens away 30 to 60 minutes before bed.',
          'Keep your room dark, quiet and as cool as you can.',
          'Avoid heavy meals and alcohol late in the evening. Alcohol makes sleep lighter and more broken.',
          'If you can’t sleep after about 20 minutes, get up, do something calm in dim light, and return when sleepy.',
        ],
      },
      {
        heading: 'When to see a doctor',
        paragraphs: [
          'Speak to a doctor if you have trouble sleeping most nights for more than three months, or if someone notices you snore loudly and stop breathing for moments in your sleep. That can be a sign of sleep apnoea, which is treatable.',
        ],
      },
    ],
    takeaways: ['Most adults need 7 to 9 hours.', 'Keep regular times and cut caffeine after midday.', 'Loud snoring with pauses in breathing needs a doctor’s check.'],
    sources: ['American Academy of Sleep Medicine and Sleep Research Society: Recommended amount of sleep for a healthy adult (2015)'],
  }),
  a({
    slug: 'cutting-down-alcohol',
    topic: 'habits',
    title: 'Cutting down on alcohol: where to start',
    summary: 'Drinking less benefits your blood pressure, liver, sleep and weight. Here are practical ways to start.',
    sections: [
      {
        heading: 'What we know',
        paragraphs: [
          'The World Health Organization advises that when it comes to alcohol, less is better, and that there is no level of drinking that is completely safe for health. Alcohol raises blood pressure, adds empty calories and is linked to liver disease and several cancers. Palm wine, beer, spirits and local gin all contain alcohol.',
        ],
      },
      {
        heading: 'Practical steps',
        list: [
          'Choose alcohol-free days each week.',
          'Have smaller measures or a lower-strength drink.',
          'Alternate each alcoholic drink with water or a soft drink without sugar.',
          'Eat before and while you drink.',
          'Plan what you will say when someone offers you another round.',
        ],
      },
      {
        heading: 'Important if you drink heavily every day',
        paragraphs: [
          'If you drink a lot every day, do not stop suddenly on your own. Stopping abruptly can cause serious withdrawal symptoms such as shaking, seizures or confusion. Speak to a doctor, who can help you cut down safely.',
        ],
      },
    ],
    takeaways: ['There is no completely safe level of alcohol.', 'Alcohol-free days and smaller measures help.', 'Heavy daily drinkers should cut down with a doctor’s help, not stop suddenly.'],
    sources: ['World Health Organization: No level of alcohol consumption is safe for our health (2023)', 'World Health Organization: Alcohol fact sheet'],
  }),
  a({
    slug: 'gentle-weight-loss',
    topic: 'weight',
    title: 'Losing weight gently, the realistic way',
    summary: 'You don’t need a crash diet. Losing just 5% of your weight brings real health benefits.',
    sections: [
      {
        heading: 'Small losses, big benefits',
        paragraphs: [
          'For people living with overweight, losing around 5 to 10% of body weight can lower blood pressure, improve blood sugar and reduce the risk of type 2 diabetes. In a large study, people at high risk who lost about 7% of their weight through healthier eating and activity cut their risk of developing diabetes by more than half.',
          'A steady loss of about 0.5 to 1 kg a week is realistic and easier to keep off.',
        ],
      },
      {
        heading: 'What works',
        list: [
          'Use the plate method: half vegetables, a quarter protein, a quarter starch.',
          'Keep swallows and rice to about the size of your fist.',
          'Swap sugary drinks for water or unsweetened drinks.',
          'Eat regular meals so you don’t arrive at dinner starving.',
          'Move more every day and sleep well; both affect appetite.',
        ],
      },
      {
        heading: 'What to avoid',
        paragraphs: [
          'Be careful of "slimming teas", detox drinks and weight-loss pills sold without a prescription. Many are unregulated and some can be harmful. Very low-calorie diets should only be followed with medical supervision.',
        ],
        tip: 'A dietitian can tailor a plan to your foods, budget and health. Book one from Care.',
      },
    ],
    takeaways: ['Losing 5 to 10% of your weight improves health.', 'Aim for about 0.5 to 1 kg a week.', 'Avoid unregulated slimming teas and pills.'],
    sources: ['Diabetes Prevention Program Research Group, New England Journal of Medicine (2002)', 'World Health Organization: Obesity and overweight fact sheet'],
  }),
  a({
    slug: 'stopping-smoking',
    topic: 'habits',
    title: 'Stopping smoking: what really helps',
    summary: 'Stopping is the single best thing you can do for your health, at any age. Support makes it much more likely to work.',
    sections: [
      {
        heading: 'Your body starts recovering quickly',
        paragraphs: [
          'Within 20 minutes of stopping, your heart rate and blood pressure begin to drop. Within 12 hours, the carbon monoxide in your blood returns to normal. After a year, your risk of coronary heart disease is about half that of someone who still smokes.',
          'Shisha and other tobacco products are also harmful; a shisha session can expose you to large amounts of smoke.',
        ],
      },
      {
        heading: 'What makes quitting more successful',
        list: [
          'Set a quit date and tell people who will support you.',
          'Ask a doctor or pharmacist about nicotine replacement (patches, gum) or prescribed medicines. They make success much more likely.',
          'Know your triggers, such as stress, alcohol or after meals, and plan something else to do.',
          'Remove cigarettes, lighters and ashtrays from your home and bag.',
          'If you slip, don’t give up. Most people need a few tries.',
        ],
      },
    ],
    takeaways: ['Your body starts recovering within minutes of stopping.', 'Medicines and support greatly improve your chances.', 'A slip is not failure. Keep going.'],
    sources: ['World Health Organization: Tobacco fact sheet', 'World Health Organization: Health benefits of smoking cessation'],
  }),
  a({
    slug: 'talking-about-feelings',
    topic: 'mind',
    title: 'When to talk to someone about how you feel',
    summary: 'Low mood and anxiety are common, and they are treatable. Knowing the signs helps you get support early.',
    sections: [
      {
        heading: 'Signs worth paying attention to',
        paragraphs: ['Everyone has hard days. It may be time to talk to someone if, for two weeks or more, you have:'],
        list: [
          'Felt down, hopeless or empty most of the time',
          'Lost interest or pleasure in things you used to enjoy',
          'Felt anxious, on edge or unable to stop worrying',
          'Had changes in sleep or appetite, or felt tired all the time',
          'Found it hard to concentrate or manage daily life',
        ],
      },
      {
        heading: 'Getting support',
        paragraphs: [
          'Talking to someone you trust is a good first step. A doctor or psychologist can help you understand what is going on and find the right support, which may include talking therapy. You can book a private consultation in Care.',
        ],
      },
      {
        heading: 'If you are in crisis',
        paragraphs: ['If you are thinking about harming yourself or feel you can’t keep yourself safe, call 112 now or go to the nearest hospital emergency department.'],
      },
    ],
    takeaways: ['Low mood and anxiety are common and treatable.', 'Signs lasting two weeks or more are worth talking about.', 'In a crisis, call 112 or go to the nearest hospital.'],
    sources: ['World Health Organization: Depressive disorder fact sheet', 'World Health Organization: Anxiety disorders fact sheet'],
  }),
  a({
    slug: 'healthy-habits-long-run',
    topic: 'habits',
    title: 'Keeping healthy habits for the long run',
    summary: 'Starting is the easy part. These ideas help healthy changes stick.',
    sections: [
      {
        heading: 'Make it small and specific',
        paragraphs: [
          '"Eat healthier" is hard to act on. "Add ugu to my stew on weekdays" is easy. Pick one small change at a time and make it part of your routine for a few weeks before adding the next.',
        ],
      },
      {
        heading: 'Ideas that help',
        list: [
          'Attach a new habit to an existing one, such as a walk straight after dinner.',
          'Track it. Ticking off meals, water and minutes builds momentum.',
          'Plan for busy days: keep a simple fallback meal ready.',
          'Avoid all-or-nothing thinking. One missed day doesn’t undo your progress.',
          'Check in every few weeks. Retake your health check to see what has changed.',
        ],
      },
    ],
    takeaways: ['Change one small, specific thing at a time.', 'Link new habits to things you already do.', 'Missing a day is normal; just carry on.'],
    sources: ['World Health Organization: Healthy diet fact sheet'],
  }),
  a({
    slug: 'blood-sugar-nigerian-food',
    topic: 'diabetes',
    title: 'Managing blood sugar with Nigerian food',
    summary: 'You don’t have to give up the foods you love. How much, how often and what you pair them with makes the difference.',
    sections: [
      {
        heading: 'Carbohydrates and blood sugar',
        paragraphs: [
          'Rice, yam, swallows, bread and plantain are mostly carbohydrate, which raises blood sugar. The amount on your plate matters most, followed by the type: foods with more fibre raise blood sugar more slowly.',
        ],
      },
      {
        heading: 'Practical tips',
        list: [
          'Keep starchy portions to about the size of your fist.',
          'Fill half your plate with vegetables or vegetable soup.',
          'Include protein such as beans, fish, eggs or chicken at each meal.',
          'Choose unripe plantain, ofada or brown rice, beans and whole grains more often.',
          'Eat at regular times and avoid long gaps followed by a very large meal.',
          'Go for a short walk after meals.',
        ],
      },
      {
        heading: 'If you have diabetes',
        paragraphs: [
          'Keep taking your medicines as prescribed and don’t change them without speaking to your doctor. Changes to your eating can affect how much medicine you need, so tell your doctor or dietitian about your plans. If you use insulin or certain tablets, ask how to recognise and treat low blood sugar.',
        ],
      },
    ],
    takeaways: ['Portion size of starchy food matters most.', 'Pair starch with vegetables and protein.', 'Never change diabetes medicines without your doctor.'],
    sources: ['World Health Organization: Diabetes fact sheet', 'World Health Organization: Carbohydrate intake for adults and children (2023)'],
  }),
  a({
    slug: 'eating-well-in-pregnancy',
    topic: 'pregnancy',
    title: 'Eating well in pregnancy',
    summary: 'What to eat more of, what to avoid, and the supplements that matter, in line with your antenatal care.',
    sections: [
      {
        heading: 'Supplements',
        paragraphs: [
          'The World Health Organization recommends a daily iron and folic acid supplement during pregnancy (400 micrograms of folic acid), ideally starting before conception, to protect against anaemia and certain birth defects. Your antenatal team will advise on the right doses for you.',
        ],
      },
      {
        heading: 'Eat more of',
        list: [
          'Leafy green vegetables such as ugu and spinach, for folate and iron',
          'Beans, lentils, eggs, fish and lean meat, for protein and iron',
          'Fruit, vegetables and whole grains, for fibre to help with constipation',
          'Milk, yoghurt and small fish with bones, for calcium',
        ],
      },
      {
        heading: 'Avoid or limit',
        list: [
          'Alcohol: no amount is known to be safe in pregnancy.',
          'Liver and liver products, which contain very high levels of vitamin A.',
          'Raw or undercooked eggs, meat and fish. Cook them until fully done.',
          'Unpasteurised milk and soft cheeses made from it.',
          'Too much caffeine from coffee, strong tea, cola and energy drinks.',
        ],
      },
      {
        heading: 'Get help quickly if',
        paragraphs: ['You have bleeding, severe headache, blurred vision, swelling of the face or hands, severe pain, fever, or your baby moves less than usual. Contact your antenatal clinic or go to hospital.'],
      },
    ],
    takeaways: ['Take iron and folic acid as advised by your antenatal team.', 'Avoid alcohol, liver and undercooked eggs, meat and fish.', 'Warning signs need urgent care.'],
    sources: ['World Health Organization: Recommendations on antenatal care for a positive pregnancy experience (2016)'],
  }),
]

export const ARTICLES_BY_SLUG = Object.fromEntries(ARTICLES.map((x) => [x.slug, x]))

/** Health check priority → the article that helps with it (used on Home and in Learn). */
export const ARTICLE_FOR_PRIORITY = {
  lessSalt: 'fewer-seasoning-cubes',
  vegetables: 'more-vegetables',
  moveMore: '150-active-minutes',
  sugaryDrinks: 'better-drinks',
  lessFried: 'boil-grill-steam',
  wholeGrains: 'whole-grains-guide',
  strength: 'strength-at-home',
  sleep: 'better-sleep',
  alcohol: 'cutting-down-alcohol',
  weight: 'gentle-weight-loss',
  stopSmoking: 'stopping-smoking',
  talkToSomeone: 'talking-about-feelings',
  keepGoing: 'healthy-habits-long-run',
}
