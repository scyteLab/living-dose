/**
 * Community groups, weekly challenges and SAMPLE conversations for development.
 * The sample members and posts are fictional. Professional replies come from the
 * sample professionals in data/professionals.js. Replace with real, moderated
 * content before launch.
 */
export const GROUPS = [
  { id: 'blood-sugar', topic: 'diabetes', members: 1240, anonymous: false },
  { id: 'weight-journey', topic: 'weight', members: 2110, anonymous: false },
  { id: 'pregnancy-parents', topic: 'pregnancy', members: 860, anonymous: false },
  { id: 'heart-health', topic: 'heart', members: 730, anonymous: false },
  { id: 'fitness-beginners', topic: 'activity', members: 1580, anonymous: false },
  { id: 'mind-wellbeing', topic: 'mind', members: 940, anonymous: true },
  { id: 'diaspora-families', topic: 'family', members: 510, anonymous: false },
]
export const GROUPS_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]))

/** Weekly challenges. Progress comes from what members already track on Home. */
export const CHALLENGES = [
  { id: 'water-week', metric: 'waterDays', target: 7, participants: 320 }, // days with 8 glasses
  { id: 'move-150', metric: 'weekMinutes', target: 150, participants: 410 }, // active minutes this week
  { id: 'log-meals', metric: 'loggedDays', target: 5, participants: 275 }, // days with meals logged
]

// minutesAgo keeps the samples recent whenever the app is opened
export const SEED_POSTS = [
  {
    id: 'seed-1', group: 'blood-sugar', author: 'Ngozi', minutesAgo: 95, helpful: 18,
    body: 'Two months of swapping white rice for ofada and adding vegetables to every stew. My last fasting reading at the clinic was the best in a year. Small changes really add up.',
    replies: [
      { id: 'seed-1-r1', author: 'Tolu', minutesAgo: 80, body: 'This is encouraging! Did you find ofada filling enough at first?' },
      { id: 'seed-1-r2', author: 'Ngozi', minutesAgo: 70, body: 'Yes, more filling than white rice actually. I cook a big pot on Sunday.' },
      { id: 'seed-1-r3', professionalId: 'funmi-adeyemi', minutesAgo: 40, body: 'Lovely progress, Ngozi. Keeping portions to about a fist and pairing rice with vegetables and protein is exactly the approach we recommend. Keep checking in with your clinic.' },
    ],
  },
  {
    id: 'seed-2', group: 'fitness-beginners', author: 'Musa', minutesAgo: 260, helpful: 12,
    body: 'Day 10 of walking after dinner. Started with 10 minutes, now doing 25. My neighbour has started joining me, which helps on lazy days.',
    replies: [{ id: 'seed-2-r1', author: 'Chioma', minutesAgo: 200, body: 'A walking buddy makes such a difference. Well done!' }],
  },
  {
    id: 'seed-3', group: 'weight-journey', author: 'Kemi', minutesAgo: 600, helpful: 9,
    body: 'What do you all snack on at work? I keep reaching for biscuits around 4pm.',
    replies: [
      { id: 'seed-3-r1', author: 'Ade', minutesAgo: 540, body: 'Garden eggs with groundnut paste. Crunchy and filling.' },
      { id: 'seed-3-r2', author: 'Bisi', minutesAgo: 500, body: 'An orange and a handful of groundnuts. I pack them in the morning so I am not tempted.' },
    ],
  },
  {
    id: 'seed-4', group: 'pregnancy-parents', author: 'Amaka', minutesAgo: 1500, helpful: 14,
    body: 'Third trimester and the heartburn is real. Smaller meals and not lying down straight after eating have helped me. Anyone else?',
    replies: [{ id: 'seed-4-r1', professionalId: 'amina-bello', minutesAgo: 1300, body: 'Smaller, more frequent meals and staying upright after eating are both good strategies. If heartburn is severe or you need medicine, check with your antenatal team first, as some remedies are not suitable in pregnancy.' }],
  },
  {
    id: 'seed-5', group: 'mind-wellbeing', author: null, minutesAgo: 2000, helpful: 21,
    body: 'I finally booked a session with a psychologist after months of feeling low. I was nervous, but it felt good to talk to someone who listened without judging. If you are on the fence, it is worth it.',
    replies: [{ id: 'seed-5-r1', author: null, minutesAgo: 1900, body: 'Thank you for sharing this. I have been putting it off too.' }],
  },
  {
    id: 'seed-6', group: 'diaspora-families', author: 'Femi', minutesAgo: 3000, helpful: 7,
    body: 'I live in Manchester and set up Living Dose for my mum in Ibadan. Her dietitian calls happen while I am at work, and I get the summary afterwards. It has taken a lot of worry off my mind.',
    replies: [],
  },
  {
    id: 'seed-7', group: 'heart-health', author: 'Yusuf', minutesAgo: 4300, helpful: 11,
    body: 'Cut from three seasoning cubes to one over a month. My wife did not even notice by week three, and my blood pressure has come down a little. Crayfish and onions do most of the work now.',
    replies: [],
  },
]
