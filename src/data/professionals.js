/**
 * SAMPLE professionals for development. These are fictional people.
 * Before launch, every profile must be a real, verified professional with their
 * registration number checked against the relevant Nigerian council or body,
 * and their consent to the profile text.
 *
 * schedule: weekday (0 = Monday) → [start hour, end hour) in Lagos time.
 * fees: naira per consultation type (placeholders).
 */
export const SPECIALTIES = ['dietitian', 'doctor', 'psychologist', 'coach']
export const CONSULT_TYPES = ['video', 'voice', 'chat']
export const LANGUAGES = ['English', 'Yorùbá', 'Igbo', 'Hausa', 'Pidgin']

const pro = (o) => ({ types: CONSULT_TYPES, ...o })

export const PROFESSIONALS = [
  pro({ id: 'funmi-adeyemi', name: 'Funmi Adeyemi', title: 'Registered dietitian', specialty: 'dietitian', years: 9,
    languages: ['English', 'Yorùbá'], focus: ['diabetes', 'weight', 'heart'], fees: { video: 8000, voice: 7000, chat: 5000 },
    schedule: { 0: [9, 17], 1: [9, 17], 2: [12, 19], 3: [9, 17], 4: [9, 14] },
    bio: 'Funmi helps people manage diabetes and lose weight with Nigerian food they already love. She believes in small changes that fit real family life and real budgets.',
    education: ['BSc Human Nutrition and Dietetics', 'Postgraduate diploma in Clinical Nutrition'] }),
  pro({ id: 'chidi-okafor', name: 'Chidi Okafor', title: 'Registered dietitian', specialty: 'dietitian', years: 6,
    languages: ['English', 'Igbo', 'Pidgin'], focus: ['sports', 'weight', 'kidney'], fees: { video: 7500, voice: 6500, chat: 4500 },
    schedule: { 1: [10, 18], 2: [10, 18], 3: [10, 18], 5: [9, 13] },
    bio: 'Chidi works with active people, students and anyone managing kidney health. Expect practical meal ideas and clear portion guidance.',
    education: ['BSc Nutrition and Dietetics'] }),
  pro({ id: 'amina-bello', name: 'Amina Bello', title: 'Registered dietitian', specialty: 'dietitian', years: 11,
    languages: ['English', 'Hausa'], focus: ['pregnancy', 'children', 'pcos'], fees: { video: 9000, voice: 8000, chat: 5500 },
    schedule: { 0: [8, 14], 2: [8, 14], 4: [8, 16], 5: [9, 12] },
    bio: 'Amina specialises in nutrition before, during and after pregnancy, feeding young children, and PCOS. She is known for her calm, reassuring style.',
    education: ['BSc Human Nutrition', 'MSc Maternal and Child Nutrition'] }),
  pro({ id: 'tunde-balogun', name: 'Dr Tunde Balogun', title: 'Family doctor', specialty: 'doctor', years: 14,
    languages: ['English', 'Yorùbá', 'Pidgin'], focus: ['hypertension', 'diabetes', 'general'], fees: { video: 12000, voice: 10000, chat: 7000 },
    schedule: { 0: [16, 21], 1: [16, 21], 2: [16, 21], 3: [16, 21], 5: [10, 15] },
    bio: 'Dr Balogun looks after adults with high blood pressure and diabetes, and helps with everyday health concerns, test results and prescriptions.',
    education: ['MBBS', 'Fellowship in Family Medicine'] }),
  pro({ id: 'ngozi-eze', name: 'Dr Ngozi Eze', title: 'General practitioner', specialty: 'doctor', years: 8,
    languages: ['English', 'Igbo'], focus: ['womens', 'general', 'pregnancy'], fees: { video: 11000, voice: 9500, chat: 6500 },
    schedule: { 0: [9, 13], 1: [9, 13], 3: [9, 13], 4: [9, 13], 6: [14, 18] },
    bio: 'Dr Eze focuses on women\'s health, family planning and general check-ups, with a friendly, unhurried approach.',
    education: ['MBBS'] }),
  pro({ id: 'yusuf-abdullahi', name: 'Dr Yusuf Abdullahi', title: 'General practitioner', specialty: 'doctor', years: 5,
    languages: ['English', 'Hausa'], focus: ['general', 'heart', 'mens'], fees: { video: 10000, voice: 8500, chat: 6000 },
    schedule: { 1: [8, 12], 2: [8, 12], 3: [17, 21], 4: [17, 21], 5: [9, 13] },
    bio: 'Dr Abdullahi helps with general health concerns, heart health and men\'s health, and can explain test results in plain language.',
    education: ['MBBS'] }),
  pro({ id: 'kemi-alade', name: 'Kemi Alade', title: 'Clinical psychologist', specialty: 'psychologist', years: 10,
    languages: ['English', 'Yorùbá'], focus: ['anxiety', 'depression', 'stress'], fees: { video: 15000, voice: 13000, chat: 9000 }, types: ['video', 'voice'],
    schedule: { 0: [10, 18], 2: [10, 18], 4: [10, 18] },
    bio: 'Kemi supports people through anxiety, low mood and stress, using evidence-based talking therapies in a safe, private space.',
    education: ['BSc Psychology', 'MSc Clinical Psychology'] }),
  pro({ id: 'emeka-nwosu', name: 'Emeka Nwosu', title: 'Counselling psychologist', specialty: 'psychologist', years: 7,
    languages: ['English', 'Igbo', 'Pidgin'], focus: ['stress', 'relationships', 'eating'], fees: { video: 13000, voice: 11000, chat: 8000 },
    schedule: { 1: [12, 20], 3: [12, 20], 5: [10, 16] },
    bio: 'Emeka helps with stress, relationship difficulties and a healthier relationship with food.',
    education: ['BSc Psychology', 'MSc Counselling Psychology'] }),
  pro({ id: 'bisi-oladipo', name: 'Bisi Oladipo', title: 'Certified fitness coach', specialty: 'coach', years: 6,
    languages: ['English', 'Yorùbá'], focus: ['beginners', 'weight', 'strength'], fees: { video: 6000, voice: 5000, chat: 3500 },
    schedule: { 0: [6, 10], 1: [6, 10], 2: [6, 10], 3: [6, 10], 4: [6, 10], 5: [7, 11] },
    bio: 'Bisi builds simple home workouts for complete beginners: no gym, no equipment, just steady progress.',
    education: ['Certified personal trainer'] }),
  pro({ id: 'musa-ibrahim', name: 'Musa Ibrahim', title: 'Certified fitness coach', specialty: 'coach', years: 4,
    languages: ['English', 'Hausa', 'Pidgin'], focus: ['strength', 'older', 'beginners'], fees: { video: 5500, voice: 4500, chat: 3000 },
    schedule: { 1: [17, 21], 3: [17, 21], 5: [8, 12], 6: [8, 12] },
    bio: 'Musa helps people build strength safely, including older adults and those returning to exercise after a long break.',
    education: ['Certified strength and conditioning coach'] }),
]

export const PROFESSIONALS_BY_ID = Object.fromEntries(PROFESSIONALS.map((p) => [p.id, p]))
