export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const env = process.env;
  const request = { json: async () => req.body };
  const Response = class {
    constructor(bodyStr, opts) {
      const status = opts?.status || 200;
      res.status(status).send(bodyStr);
    }
  };

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { headers, status: 405 });
  }

  try {
    const body = await request.json();
    const { answers } = body || {};
    if (!answers) {
      return new Response(JSON.stringify({ error: 'No answers provided' }), { headers, status: 400 });
    }

    const {
      pname = 'Athlete',
      age = 25,
      weight = 72,
      height = 175,
      gender = 'male',
      goal = 'muscle',
      days = 4,
      location = 'gym',
      experience = 'intermediate',
      focus = 'balanced',
      diet = 'nonveg',
      splitPreference = 'coach',
      healthConditions = [],
      foodAllergies = '',
      foodDislikes = ''
    } = answers;

    const GEMINI_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    const OPENAI_KEY = env.OPENAI_API_KEY;

    // Clinical calculations
    const numAge = Number(age) || 25;
    const numWeight = Number(weight) || 72;
    const numHeight = Number(height) || 175;
    const numDays = Number(days) || 4;
    const bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge) + (gender === 'female' ? -161 : 5);
    const actMap = { 2: 1.35, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.75 };
    const tdee = Math.round(bmr * (actMap[numDays] || 1.55));
    let targetKcal = tdee;
    if (goal === 'fat_loss') targetKcal = Math.round(tdee - 450);
    else if (goal === 'muscle') targetKcal = Math.round(tdee + 350);
    else if (goal === 'strength') targetKcal = Math.round(tdee + 200);

    const conditions = Array.isArray(healthConditions) ? healthConditions : [healthConditions].filter(Boolean);
    if (conditions.includes('thyroid')) targetKcal = Math.round(targetKcal * 0.90);
    if (conditions.includes('diabetes')) targetKcal = Math.round(targetKcal * 0.95);
    if (conditions.includes('pcos')) targetKcal = Math.round(targetKcal * 0.92);
    if (conditions.includes('pregnancy')) targetKcal = Math.max(targetKcal, 1850);

    const isHighProtein = conditions.includes('pcos') || conditions.includes('diabetes');
    const proteinFactor = isHighProtein ? 2.2 : (goal === 'fat_loss' ? 2.2 : 2.0);
    const targetProtein = Math.round(numWeight * proteinFactor);
    const targetFat = Math.round((targetKcal * 0.25) / 9);
    const targetCarbs = Math.max(0, Math.round((targetKcal - (targetProtein * 4) - (targetFat * 9)) / 4));
    const bmi = parseFloat((numWeight / Math.pow(numHeight / 100, 2)).toFixed(1));

    const goalMap = { muscle: 'Muscle Hypertrophy & Mass Gain', fat_loss: 'Fat Loss & Definition', strength: 'Raw Strength & Power', general: 'General Fitness & Conditioning' };
    const dietMap = { nonveg: 'Non-vegetarian Indian (chicken, fish, eggs, paneer, dal, roti, rice)', egg: 'Eggetarian Indian (eggs, paneer, dal, soya, roti, rice — NO meat/fish)', veg: 'Vegetarian Indian (paneer, soya, dal, dahi, sprouts, roti, rice — NO meat/fish/eggs)', vegan: 'Vegan Indian (tofu, soya, dal, sprouts, oats, roti, rice — NO dairy/eggs/meat)' };
    const locMap = { gym: 'Full Commercial Gym (barbells, dumbbells, cables, machines)', home: 'Home Setup (dumbbells, adjustable bench, pull-up bar, bodyweight)', calisthenics: 'Zero Equipment Calisthenics (100% bodyweight only — absolutely NO weights/cables/machines)' };
    const focusMap = { balanced: 'Balanced full-body proportions', upper: 'Upper Body (chest, shoulders, arms)', vtaper: 'V-Taper (wide lats, capped delts, narrow waist)', legs: 'Lower Body (quads, glutes, hamstrings)' };
    const splitMap = { coach: 'Coach decides optimal split', ppl: 'Push / Pull / Legs (PPL)', upper_lower: 'Upper / Lower split', full_body: 'Full Body protocol', bro_split: 'Classic bodypart split' };

    const conditionDescriptions = {
      thyroid: 'Thyroid disorder — slow metabolism, calories reduced by 10%',
      diabetes: 'Type 2 Diabetes — stabilize blood sugar, reduce fast carbs, high protein',
      pcos: 'PCOS — insulin resistance, 2.2g/kg protein target, lower refined carbs',
      hypertension: 'Hypertension — avoid extreme loading, include moderate cardio',
      knee_injury: 'Knee injury — NO deep squats, NO barbell back squats, NO heavy leg press. Use leg extension, leg curl, step-ups, terminal knee extension',
      back_injury: 'Lower back injury — NO barbell deadlifts. Use chest-supported rows, trap bar deadlift, hyperextensions',
      shoulder_injury: 'Shoulder injury — NO overhead barbell press, NO upright rows. Use neutral-grip dumbbell press, cable face pulls',
      pregnancy: 'Post-pregnancy — NO heavy compound lifts. Focus on pelvic floor, core rehab, bodyweight. Min 1850 kcal'
    };
    const conditionStr = conditions.length > 0
      ? '- ' + conditions.map(c => conditionDescriptions[c] || c).filter(Boolean).join('\n- ')
      : 'None reported';

    const equipConstraints = location === 'calisthenics'
      ? 'CRITICAL: Every exercise MUST be 100% bodyweight only. Absolutely NO barbells, NO dumbbells, NO cables, NO machines.'
      : location === 'home'
      ? 'CRITICAL: Use ONLY dumbbells, adjustable bench, pull-up bar, and bodyweight. Absolutely NO barbells and NO cables.'
      : 'Full commercial gym available — barbells, dumbbells, cables, and machines.';

    const prompt = `You are an elite Indian fitness coach and sports nutritionist.
Create a 100% bespoke, personalized training and nutrition plan tailored specifically for this individual from scratch.

ATHLETE PROFILE:
- Name: ${pname}
- Age: ${numAge} | Gender: ${gender} | Weight: ${numWeight}kg | Height: ${numHeight}cm | BMI: ${bmi}
- Fitness Objective: ${goalMap[goal] || goal}
- Dietary Preference: ${dietMap[diet] || diet}
- Food Allergies/Dislikes: ${foodAllergies || foodDislikes || 'None'}
- Training Environment: ${locMap[location] || location}
- Training Frequency: EXACTLY ${numDays} DAYS PER WEEK
- Lifting Experience: ${experience}
- Priority Focus: ${focusMap[focus] || focus}
- Split Preference: ${splitMap[splitPreference] || splitPreference}

HEALTH RESTRICTIONS & CLINICAL SAFETY:
${conditionStr}

CALIBRATED TARGETS (use these exact numbers):
- Daily Target: ${targetKcal} kcal
- Protein: ${targetProtein}g | Carbs: ${targetCarbs}g | Fat: ${targetFat}g

EQUIPMENT CONSTRAINTS:
${equipConstraints}

INSTRUCTIONS:
1. Provide 5 authentic Indian meals tailored strictly to their diet (${diet}) and hitting ${targetKcal} kcal & ${targetProtein}g protein.
   Each meal MUST specify concrete food names and realistic portion sizes (e.g. "150g Paneer Bhurji + 2 Whole Wheat Rotis").
   Vary proteins and dishes across meals. Avoid any listed allergies/dislikes.
2. Provide EXACTLY ${numDays} distinct workout routines in the "workout" array.
   Each routine must contain 5-6 exercises strictly matching their equipment (${location}) and experience (${experience}).
   Follow the preferred split: ${splitMap[splitPreference] || splitPreference}.
   Strictly respect all health conditions and injury substitutions.

Return ONLY a valid JSON object with this EXACT schema (no markdown, no backticks, no explanations):
{
  "kcal": ${targetKcal},
  "protein": ${targetProtein},
  "carbs": ${targetCarbs},
  "fat": ${targetFat},
  "bmi": ${bmi},
  "goal": "${goal}",
  "diet": "${diet}",
  "coachNote": "2-3 personalized sentences addressing ${pname}, explaining their custom calories, macros, and workout split.",
  "weeklyInsight": "1 tactical, actionable coaching tip for their specific goal.",
  "meals": [
    {"id": "m1", "slot": "Breakfast", "time": "8:00 AM", "title": "...", "note": "...", "icon": "🍳", "kcal": ${Math.round(targetKcal * 0.28)}, "protein": ${Math.round(targetProtein * 0.28)}, "carbs": ${Math.round(targetCarbs * 0.28)}, "fat": ${Math.round(targetFat * 0.28)}},
    {"id": "m2", "slot": "Mid-Morning", "time": "11:30 AM", "title": "...", "note": "...", "icon": "🥗", "kcal": ${Math.round(targetKcal * 0.14)}, "protein": ${Math.round(targetProtein * 0.14)}, "carbs": ${Math.round(targetCarbs * 0.14)}, "fat": ${Math.round(targetFat * 0.14)}},
    {"id": "m3", "slot": "Lunch", "time": "1:30 PM", "title": "...", "note": "...", "icon": "🍱", "kcal": ${Math.round(targetKcal * 0.34)}, "protein": ${Math.round(targetProtein * 0.34)}, "carbs": ${Math.round(targetCarbs * 0.34)}, "fat": ${Math.round(targetFat * 0.34)}},
    {"id": "m4", "slot": "Pre-Workout Snack", "time": "5:00 PM", "title": "...", "note": "...", "icon": "⚡", "kcal": ${Math.round(targetKcal * 0.10)}, "protein": ${Math.round(targetProtein * 0.10)}, "carbs": ${Math.round(targetCarbs * 0.10)}, "fat": ${Math.round(targetFat * 0.10)}},
    {"id": "m5", "slot": "Dinner", "time": "8:30 PM", "title": "...", "note": "...", "icon": "🍛", "kcal": ${Math.round(targetKcal * 0.14)}, "protein": ${Math.round(targetProtein * 0.14)}, "carbs": ${Math.round(targetCarbs * 0.14)}, "fat": ${Math.round(targetFat * 0.14)}}
  ],
  "workout": [
    {
      "n": "Day 1: Upper Push",
      "t": "Chest · Shoulders · Triceps",
      "r": false,
      "exercises": [
        {"name": "exercise name", "sets": "4", "reps": "8", "badge": "push"}
      ]
    }
  ]
}`;

    // 1. Try Gemini API (gemini-3.6-flash)
    if (GEMINI_KEY) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json'
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim();
          const plan = JSON.parse(cleanJson);
          normalizePlan(plan, targetKcal, targetProtein, targetCarbs, targetFat, bmi, goal, diet);
          plan.aiGenerated = true;
          plan.aiEngine = 'gemini-3.6-flash';
          plan.generatedAt = new Date().toISOString();
          plan.monthNumber = 1;
          plan.lastUpdated = new Date().toISOString();
          return new Response(JSON.stringify({ plan }), { headers, status: 200 });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call warning:', geminiErr);
      }
    }

    // 2. Try OpenAI API (fallback)
    if (OPENAI_KEY) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 3500,
            response_format: { type: 'json_object' }
          })
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const content = data.choices[0].message.content.trim();
          const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
          const plan = JSON.parse(cleanJson);
          normalizePlan(plan, targetKcal, targetProtein, targetCarbs, targetFat, bmi, goal, diet);
          plan.aiGenerated = true;
          plan.aiEngine = 'gpt-4o';
          plan.generatedAt = new Date().toISOString();
          plan.monthNumber = 1;
          plan.lastUpdated = new Date().toISOString();
          return new Response(JSON.stringify({ plan }), { headers, status: 200 });
        }
      } catch (aiErr) {
        console.warn('OpenAI fallback error:', aiErr);
      }
    }

    // 3. Smart science fallback
    const staticMeals = buildFallbackMeals(diet, targetKcal, targetProtein);
    const staticWorkout = buildFallbackWorkout(numDays, location, goal, experience, conditions);
    const plan = {
      kcal: targetKcal,
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat,
      bmi,
      goal,
      diet,
      aiGenerated: false,
      aiEngine: 'static',
      coachNote: `${pname}, your 100% custom plan is engineered for ${goal.replace('_', ' ')}. With a daily target of ${targetKcal} kcal (${targetProtein}g Protein · ${targetCarbs}g Carbs · ${targetFat}g Fats) and a ${numDays}-day split, your protocol is calibrated for progressive overload.`,
      weeklyInsight: `Consistency is your superpower, ${pname}! Push your working sets with intensity. 🚀`,
      meals: staticMeals,
      workout: staticWorkout,
      generatedAt: new Date().toISOString(),
      monthNumber: 1,
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify({ plan }), { headers, status: 200 });

  } catch (err) {
    console.error('generate-plan error:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}

function normalizePlan(plan, k, p, c, f, bmi, goal, diet) {
  plan.kcal = Number(plan.kcal) || k;
  plan.protein = Number(plan.protein) || p;
  plan.carbs = Number(plan.carbs) || c;
  plan.fat = Number(plan.fat) || f;
  plan.bmi = Number(plan.bmi) || bmi;
  plan.goal = plan.goal || goal;
  plan.diet = plan.diet || diet;

  if (Array.isArray(plan.meals)) {
    plan.meals = plan.meals.map((m, idx) => ({
      id: m.id || ('m' + (idx + 1)),
      slot: m.slot || m.n || `Meal ${idx + 1}`,
      time: m.time || m.t || '8:00 AM',
      title: m.title || m.d || m.n || 'Meal',
      note: m.note || m.d || '',
      icon: m.icon || m.i || '🥗',
      kcal: Number(m.kcal || m.k) || Math.round(k * 0.2),
      protein: Number(m.protein || m.p) || Math.round(p * 0.2),
      carbs: Number(m.carbs || m.c) || Math.round(c * 0.2),
      fat: Number(m.fat || m.f) || Math.round(f * 0.2)
    }));
  }

  if (Array.isArray(plan.workout)) {
    plan.workout = plan.workout.map((w, idx) => ({
      n: w.n || w.name || `Day ${idx + 1}`,
      t: w.t || w.target || 'Workout',
      r: Boolean(w.r),
      exercises: Array.isArray(w.exercises) ? w.exercises.map(ex => ({
        name: ex.name || ex.n || 'Exercise',
        sets: String(ex.sets || ex.s || '3'),
        reps: String(ex.reps || ex.r || '10'),
        badge: ex.badge || ex.b || 'push'
      })) : []
    }));
  }
}

function buildFallbackMeals(diet, k, p) {
  const r = (a, b) => Math.round(a * b);
  if (diet === 'nonveg') return [
    { id: 'm1', slot: 'Breakfast', time: '7:30 AM', title: 'Masala Egg Scramble & Oats', note: '3 whole eggs + 2 egg whites scrambled with onions & tomatoes, 50g rolled oats with milk', icon: '🍳', kcal: r(k,0.27), protein: r(p,0.28), carbs: r(k*0.27*0.42,0.25), fat: r(k*0.27*0.28,0.11) },
    { id: 'm2', slot: 'Mid-Morning Fuel', time: '11:00 AM', title: 'Roasted Chana & Fruit', note: '40g roasted chana, 1 banana, 10 almonds, green tea', icon: '🥗', kcal: r(k,0.13), protein: r(p,0.12), carbs: r(k*0.13*0.60,0.25), fat: r(k*0.13*0.18,0.11) },
    { id: 'm3', slot: 'Lunch', time: '1:30 PM', title: 'Grilled Chicken Breast & Dal Rice', note: '200g grilled chicken breast curry, 1.5 cups cooked rice, 1 bowl moong dal tadka, cucumber salad', icon: '🍱', kcal: r(k,0.35), protein: r(p,0.38), carbs: r(k*0.35*0.45,0.25), fat: r(k*0.35*0.18,0.11) },
    { id: 'm4', slot: 'Pre-Workout Snack', time: '5:00 PM', title: 'Peanut Butter Toast & Coffee', note: '2 slices whole wheat bread with 1.5 tbsp peanut butter, black coffee', icon: '⚡', kcal: r(k,0.11), protein: r(p,0.09), carbs: r(k*0.11*0.52,0.25), fat: r(k*0.11*0.32,0.11) },
    { id: 'm5', slot: 'Dinner', time: '8:30 PM', title: 'Grilled Chicken Tikka & Roti', note: '150g grilled chicken tikka, 2 whole wheat rotis, mixed sabzi, 1 bowl thick curd', icon: '🍛', kcal: r(k,0.14), protein: r(p,0.13), carbs: r(k*0.14*0.38,0.25), fat: r(k*0.14*0.28,0.11) }
  ];
  if (diet === 'veg') return [
    { id: 'm1', slot: 'Breakfast', time: '7:30 AM', title: 'Paneer Bhurji & Multigrain Roti', note: '150g low-fat paneer bhurji with tomatoes & onions, 2 multigrain rotis, 1 glass toned milk', icon: '🧀', kcal: r(k,0.27), protein: r(p,0.27), carbs: r(k*0.27*0.40,0.25), fat: r(k*0.27*0.32,0.11) },
    { id: 'm2', slot: 'Mid-Morning Fuel', time: '11:00 AM', title: 'Sprouted Moong Chaat', note: '1 bowl sprouted moong & kala chana with lemon & cucumber, 10 walnuts', icon: '🥗', kcal: r(k,0.14), protein: r(p,0.16), carbs: r(k*0.14*0.58,0.25), fat: r(k*0.14*0.18,0.11) },
    { id: 'm3', slot: 'Lunch', time: '1:30 PM', title: 'Soya Chunks & Dal Rice Bowl', note: '60g soya chunks curry, 1 bowl dal tadka, 1.5 cups steamed rice, 1 bowl dahi', icon: '🍱', kcal: r(k,0.34), protein: r(p,0.36), carbs: r(k*0.34*0.50,0.25), fat: r(k*0.34*0.18,0.11) },
    { id: 'm4', slot: 'Pre-Workout Snack', time: '5:00 PM', title: 'Makhana & Banana', note: '1 medium banana, 1 bowl roasted makhana foxnuts, black coffee', icon: '⚡', kcal: r(k,0.11), protein: r(p,0.08), carbs: r(k*0.11*0.68,0.25), fat: r(k*0.11*0.12,0.11) },
    { id: 'm5', slot: 'Dinner', time: '8:30 PM', title: 'Paneer Tikka & Sabzi', note: '120g grilled paneer tikka, 2 whole wheat rotis, mixed vegetable sabzi, 1 bowl curd', icon: '🍛', kcal: r(k,0.14), protein: r(p,0.13), carbs: r(k*0.14*0.38,0.25), fat: r(k*0.14*0.32,0.11) }
  ];
  return [
    { id: 'm1', slot: 'Breakfast', time: '7:30 AM', title: 'Masala Omelette & Oats', note: '3 whole eggs + 2 egg whites omelette with peppers & onions, 50g oats with milk', icon: '🍳', kcal: r(k,0.27), protein: r(p,0.30), carbs: r(k*0.27*0.40,0.25), fat: r(k*0.27*0.28,0.11) },
    { id: 'm2', slot: 'Mid-Morning Fuel', time: '11:00 AM', title: 'Boiled Eggs & Mixed Nuts', note: '2 boiled egg whites, 10 almonds & walnuts, 1 green tea', icon: '🥜', kcal: r(k,0.13), protein: r(p,0.14), carbs: r(k*0.13*0.25,0.25), fat: r(k*0.13*0.40,0.11) },
    { id: 'm3', slot: 'Lunch', time: '1:30 PM', title: 'Egg Curry & Dal Rice Bowl', note: '3 egg curry, 1 bowl moong dal, 1.5 cups cooked rice, cucumber raita', icon: '🍱', kcal: r(k,0.35), protein: r(p,0.36), carbs: r(k*0.35*0.45,0.25), fat: r(k*0.35*0.22,0.11) },
    { id: 'm4', slot: 'Pre-Workout Snack', time: '5:00 PM', title: 'Banana & Peanut Butter', note: '1 medium banana, 1.5 tbsp peanut butter, black coffee', icon: '⚡', kcal: r(k,0.11), protein: r(p,0.08), carbs: r(k*0.11*0.58,0.25), fat: r(k*0.11*0.28,0.11) },
    { id: 'm5', slot: 'Dinner', time: '8:30 PM', title: 'Egg Bhurji & Roti', note: '3 egg bhurji with tomatoes & onions, 2 whole wheat rotis, 1 bowl thick dahi, green salad', icon: '🍛', kcal: r(k,0.14), protein: r(p,0.12), carbs: r(k*0.14*0.38,0.25), fat: r(k*0.14*0.28,0.11) }
  ];
}

function buildFallbackWorkout(numDays, location, goal, experience, conditions) {
  const isGym = location === 'gym', isHome = location === 'home', isCal = location === 'calisthenics';
  const s = experience === 'advanced' ? '4' : '3';
  const r = goal === 'strength' ? '5' : goal === 'fat_loss' ? '12' : '8';
  const rA = goal === 'strength' ? '8' : goal === 'fat_loss' ? '15' : '10';
  const hasKnee = conditions.includes('knee_injury'), hasBack = conditions.includes('back_injury'), hasShould = conditions.includes('shoulder_injury');
  const bench = isGym ? 'barbell bench press' : isHome ? 'dumbbell bench press' : 'push-up';
  const row = isGym ? 'barbell bent over row' : isHome ? 'one arm dumbbell row' : 'inverted row';
  const pull = isGym ? 'lat pulldown' : 'pull-up';
  const squat = hasKnee ? 'leg extension' : isGym ? 'barbell squat' : isHome ? 'goblet squat' : 'split squats';
  const dl = hasBack ? 'hyperextension' : isGym ? 'barbell deadlift' : isHome ? 'dumbbell romanian deadlift' : 'glute bridge march';
  const ohp = hasShould ? 'cable face pull' : isGym ? 'standing dumbbell overhead press' : isHome ? 'standing dumbbell overhead press' : 'pike push-up';
  const curl = isGym ? 'dumbbell alternate bicep curl' : 'hammer curl';
  const tri = isGym ? 'cable tricep pushdown' : 'overhead tricep extension';
  const calf = isGym ? 'standing calf raise' : 'bodyweight standing calf raise';
  const core = isCal ? 'crunch floor' : 'hanging leg raise';

  const push = { n: 'Day 1: Upper Push', t: 'Chest · Shoulders · Triceps', r: false, exercises: [
    {name: bench, sets: s, reps: r, badge: 'push'}, {name: ohp, sets: s, reps: rA, badge: 'push'},
    {name: tri, sets: s, reps: rA, badge: 'push'}, {name: 'dumbbell lateral raise', sets: s, reps: rA, badge: 'push'},
    {name: core, sets: '3', reps: '15', badge: 'core'}
  ]};
  const pullDay = { n: 'Day 2: Upper Pull', t: 'Back · Biceps · Rear Delts', r: false, exercises: [
    {name: pull, sets: s, reps: r, badge: 'pull'}, {name: row, sets: s, reps: rA, badge: 'pull'},
    {name: curl, sets: s, reps: rA, badge: 'pull'}, {name: isGym ? 'cable face pull' : 'inverted row', sets: '3', reps: '15', badge: 'pull'},
    {name: 'hammer curl', sets: '3', reps: rA, badge: 'pull'}
  ]};
  const legs = { n: 'Day 3: Lower Body', t: 'Quads · Hamstrings · Glutes · Calves', r: false, exercises: [
    {name: squat, sets: s, reps: r, badge: 'legs'}, {name: dl, sets: s, reps: rA, badge: 'legs'},
    {name: isGym ? 'leg press' : isHome ? 'dumbbell walking lunges' : 'walking lunge', sets: s, reps: rA, badge: 'legs'},
    {name: isGym ? 'lying leg curls' : 'dumbbell romanian deadlift', sets: s, reps: rA, badge: 'legs'},
    {name: calf, sets: '3', reps: '20', badge: 'legs'}
  ]};
  const full = { n: 'Day 4: Full Body Strength', t: 'Compound Power · Core', r: false, exercises: [
    {name: bench, sets: s, reps: r, badge: 'push'}, {name: row, sets: s, reps: r, badge: 'pull'},
    {name: squat, sets: s, reps: rA, badge: 'legs'}, {name: ohp, sets: s, reps: rA, badge: 'push'},
    {name: core, sets: '3', reps: '15', badge: 'core'}
  ]};

  if (numDays <= 2) return [push, pullDay];
  if (numDays === 3) return [push, legs, pullDay];
  return [push, legs, pullDay, full];
}
