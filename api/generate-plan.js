export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { answers } = req.body || {}
    if (!answers) return res.status(400).json({ error: 'No answers provided' })

    const {
      pname = 'Athlete',
      age = 25, weight = 72, height = 175, gender = 'male',
      goal = 'muscle', days = 4, location = 'gym',
      experience = 'intermediate', focus = 'balanced', diet = 'nonveg',
      splitPreference = 'coach', healthConditions = [],
      foodAllergies = '', foodDislikes = ''
    } = answers

    const GEMINI_KEY = process.env.GEMINI_API_KEY
    const OPENAI_KEY = process.env.OPENAI_API_KEY

    // Clinical calorie calculation
    const numAge = Number(age) || 25
    const numWeight = Number(weight) || 72
    const numHeight = Number(height) || 175
    const numDays = Number(days) || 4
    const bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge) + (gender === 'female' ? -161 : 5)
    const actMap = { 2: 1.35, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.75 }
    const tdee = Math.round(bmr * (actMap[numDays] || 1.55))
    let targetKcal = tdee
    if (goal === 'fat_loss') targetKcal = Math.round(tdee - 450)
    else if (goal === 'muscle') targetKcal = Math.round(tdee + 350)
    else if (goal === 'strength') targetKcal = Math.round(tdee + 200)

    const conditions = Array.isArray(healthConditions) ? healthConditions : [healthConditions].filter(Boolean)
    if (conditions.includes('thyroid'))   targetKcal = Math.round(targetKcal * 0.90)
    if (conditions.includes('diabetes'))  targetKcal = Math.round(targetKcal * 0.95)
    if (conditions.includes('pcos'))      targetKcal = Math.round(targetKcal * 0.92)
    if (conditions.includes('pregnancy')) targetKcal = Math.max(targetKcal, 1850)

    const isHighProtein = conditions.includes('pcos') || conditions.includes('diabetes')
    const proteinFactor = isHighProtein ? 2.2 : (goal === 'fat_loss' ? 2.2 : 2.0)
    const targetProtein = Math.round(numWeight * proteinFactor)
    const targetFat = Math.round((targetKcal * 0.25) / 9)
    const targetCarbs = Math.max(0, Math.round((targetKcal - (targetProtein * 4) - (targetFat * 9)) / 4))
    const bmi = parseFloat((numWeight / Math.pow(numHeight / 100, 2)).toFixed(1))

    const goalMap = { muscle: 'Muscle Hypertrophy & Mass Gain', fat_loss: 'Fat Loss & Body Recomposition', strength: 'Raw Strength & Power', general: 'General Fitness & Athletic Conditioning' }
    const dietMap = { nonveg: 'Non-vegetarian Indian (chicken, fish, eggs, paneer, dal, roti, rice)', egg: 'Eggetarian Indian (eggs, paneer, dal, soya, roti, rice — no meat/fish)', veg: 'Vegetarian Indian (paneer, soya, dal, dahi, sprouts, roti, rice — no eggs/meat)', vegan: 'Vegan Indian (tofu, soya, dal, sprouts, oats, roti, rice — no animal products)' }
    const locMap = { gym: 'Full Commercial Gym (barbells, dumbbells, cables, machines)', home: 'Home Setup (dumbbells, adjustable bench, pull-up bar, bodyweight)', calisthenics: 'Zero Equipment Calisthenics (100% bodyweight only)' }
    const focusMap = { balanced: 'Balanced full-body proportions', upper: 'Upper Body (chest, shoulders, arms)', vtaper: 'V-Taper (wide lats, capped shoulders)', legs: 'Lower Body (quads, glutes, hamstrings)' }
    const splitMap = { coach: 'Coach decides optimal split', ppl: 'Push / Pull / Legs (PPL)', upper_lower: 'Upper / Lower split', full_body: 'Full Body protocol', bro_split: 'Classic bodypart split' }

    const conditionDescriptions = {
      thyroid: 'Thyroid disorder — slow metabolism, calories already reduced by 10%',
      diabetes: 'Type 2 Diabetes — stabilize blood sugar, reduce fast carbs, high protein',
      pcos: 'PCOS — insulin resistance, 2.2g/kg protein, lower refined carbs',
      hypertension: 'Hypertension — avoid extreme loading, moderate cardio',
      knee_injury: 'Knee injury — REMOVE: deep squats, barbell back squats, heavy leg press. ADD: leg extension, leg curl, step-ups, terminal knee extension',
      back_injury: 'Lower back injury — REMOVE: barbell deadlifts, good mornings. ADD: chest-supported rows, trap bar deadlift, hyperextensions',
      shoulder_injury: 'Shoulder injury — REMOVE: overhead barbell press, upright rows. ADD: neutral-grip dumbbell press, cable face pulls, rotator cuff work',
      pregnancy: 'Post-pregnancy — REMOVE: heavy compound lifts. ADD: pelvic floor, core rehab, bodyweight. Min 1850 kcal/day'
    }
    const conditionStr = conditions.length > 0
      ? '- ' + conditions.map(c => conditionDescriptions[c] || c).filter(Boolean).join('\n- ')
      : 'None reported'

    const equipConstraints = location === 'calisthenics'
      ? 'CRITICAL: Every exercise MUST be 100% bodyweight only. Absolutely NO barbells, NO dumbbells, NO cables, NO machines.'
      : location === 'home'
      ? 'CRITICAL: Use ONLY dumbbells, adjustable bench, pull-up bar, and bodyweight. Absolutely NO barbells and NO cables.'
      : 'Full commercial gym available — barbells, dumbbells, cables, and machines.'

    const repRange = goal === 'strength' ? '3-6 reps (heavy, strength)' : goal === 'fat_loss' ? '12-15 reps (metabolic, high volume)' : '8-12 reps (hypertrophy)'
    const setSuggestion = experience === 'beginner' ? '2-3 sets' : experience === 'advanced' ? '4-5 sets' : '3-4 sets'

    const prompt = `You are a world-class sports nutritionist and elite strength coach specializing in authentic Indian fitness.

Create a 100% bespoke individualized plan — NOT a template. Every meal and exercise tailored to this specific athlete.

ATHLETE PROFILE:
- Name: ${pname}
- Age: ${numAge} | Gender: ${gender} | Weight: ${numWeight}kg | Height: ${numHeight}cm | BMI: ${bmi}
- Goal: ${goalMap[goal] || goal}
- Diet: ${dietMap[diet] || diet}
- Food Allergies/Dislikes: ${foodAllergies || foodDislikes || 'None'}
- Training: ${locMap[location] || location}
- Days/Week: EXACTLY ${numDays} DAYS
- Experience: ${experience}
- Body Focus: ${focusMap[focus] || focus}
- Split Preference: ${splitMap[splitPreference] || splitPreference}

HEALTH CONDITIONS (apply strictly):
${conditionStr}

TARGETS (use exactly these numbers):
- Calories: ${targetKcal} kcal | Protein: ${targetProtein}g | Carbs: ${targetCarbs}g | Fat: ${targetFat}g

EQUIPMENT: ${equipConstraints}

MEAL PLAN RULES:
- 5 authentic Indian meals totaling EXACTLY ${targetKcal} kcal and ${targetProtein}g protein
- Specific quantities (e.g., "180g chicken breast", "1.5 cups cooked rice", "2 medium rotis")
- Must respect their ${diet} diet — absolutely no violations
- Different proteins, cooking styles and foods for each meal — no repetition
- Avoid all listed allergies/dislikes

WORKOUT RULES:
- Exactly ${numDays} workout sessions
- 5-6 exercises per session
- Reps: ${repRange}
- Sets: ${setSuggestion} per exercise
- Reflect goal (${goal}) and focus (${focusMap[focus]})
- Split: ${splitMap[splitPreference] || splitPreference}
- Apply ALL health condition exercise modifications

Return ONLY valid JSON, no markdown:
{
  "kcal": ${targetKcal},
  "protein": ${targetProtein},
  "carbs": ${targetCarbs},
  "fat": ${targetFat},
  "bmi": ${bmi},
  "goal": "${goal}",
  "diet": "${diet}",
  "coachNote": "3 sentences: greet ${pname} by name, explain their calorie target rationale, describe their exact training split and focus.",
  "weeklyInsight": "1 specific actionable tip for their goal and health conditions.",
  "meals": [
    {"id": "m1", "slot": "Breakfast", "time": "7:30 AM", "title": "Custom meal name", "note": "Exact ingredient quantities", "icon": "🍳", "kcal": 0, "protein": 0, "carbs": 0, "fat": 0},
    {"id": "m2", "slot": "Mid-Morning Fuel", "time": "11:00 AM", "title": "...", "note": "...", "icon": "🥗", "kcal": 0, "protein": 0, "carbs": 0, "fat": 0},
    {"id": "m3", "slot": "Lunch", "time": "1:30 PM", "title": "...", "note": "...", "icon": "🍱", "kcal": 0, "protein": 0, "carbs": 0, "fat": 0},
    {"id": "m4", "slot": "Pre-Workout Snack", "time": "5:00 PM", "title": "...", "note": "...", "icon": "⚡", "kcal": 0, "protein": 0, "carbs": 0, "fat": 0},
    {"id": "m5", "slot": "Dinner", "time": "8:30 PM", "title": "...", "note": "...", "icon": "🍛", "kcal": 0, "protein": 0, "carbs": 0, "fat": 0}
  ],
  "workout": [
    {"n": "Day 1: Session Name", "t": "Muscle groups", "r": false, "exercises": [
      {"name": "exact exercise name", "sets": "4", "reps": "8", "badge": "push"}
    ]}
  ]
}`

    // Try Gemini 2.0 Flash (primary)
    if (GEMINI_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: 'application/json' }
            })
          }
        )
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const plan = JSON.parse(rawText.replace(/```json\n?|\n?```/g, '').trim())
          plan.generatedAt = new Date().toISOString()
          plan.monthNumber = 1
          plan.lastUpdated = new Date().toISOString()
          plan.aiGenerated = true
          plan.aiEngine = 'gemini-2.0-flash'
          console.log('[generate-plan] Gemini AI plan generated for', pname)
          return res.status(200).json({ plan })
        }
        console.warn('[generate-plan] Gemini non-OK:', geminiRes.status)
      } catch (e) { console.warn('[generate-plan] Gemini error:', e.message) }
    }

    // Try OpenAI GPT-4o (fallback)
    if (OPENAI_KEY) {
      try {
        const oaRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 4096, response_format: { type: 'json_object' } })
        })
        if (oaRes.ok) {
          const data = await oaRes.json()
          const plan = JSON.parse(data.choices[0].message.content.trim())
          plan.generatedAt = new Date().toISOString()
          plan.monthNumber = 1
          plan.lastUpdated = new Date().toISOString()
          plan.aiGenerated = true
          plan.aiEngine = 'gpt-4o'
          console.log('[generate-plan] GPT-4o plan generated for', pname)
          return res.status(200).json({ plan })
        }
      } catch (e) { console.warn('[generate-plan] OpenAI error:', e.message) }
    }

    // Static science-based fallback
    console.warn('[generate-plan] No AI key — using static science plan')
    const meals = buildStaticMeals(diet, targetKcal, targetProtein)
    const workout = buildStaticWorkout(numDays, location, goal, experience, conditions)
    return res.status(200).json({ plan: {
      kcal: targetKcal, protein: targetProtein, carbs: targetCarbs, fat: targetFat, bmi,
      goal, diet, aiGenerated: false, aiEngine: 'static',
      coachNote: pname + ', your ' + targetKcal + ' kcal plan with ' + targetProtein + 'g protein is ready for ' + (goalMap[goal] || goal) + '.',
      weeklyInsight: 'Progressive overload is your superpower. Add reps or weight every week.',
      meals, workout,
      generatedAt: new Date().toISOString(), monthNumber: 1, lastUpdated: new Date().toISOString()
    }})

  } catch (err) {
    console.error('[generate-plan] Fatal:', err)
    return res.status(500).json({ error: err.message })
  }
}

function buildStaticMeals(diet, k, p) {
  const r = (a, b) => Math.round(a * b)
  if (diet === 'nonveg') return [
    { id: 'm1', slot: 'Breakfast', time: '7:30 AM', title: 'Masala Egg Scramble & Oats', note: '3 whole eggs + 2 egg whites scrambled with onions & tomatoes, 50g rolled oats with low-fat milk', icon: '🍳', kcal: r(k,0.27), protein: r(p,0.28), carbs: r(k*0.27*0.42,0.25), fat: r(k*0.27*0.28,0.11) },
    { id: 'm2', slot: 'Mid-Morning Fuel', time: '11:00 AM', title: 'Roasted Chana & Fruit', note: '40g roasted chana, 1 banana, 10 almonds, green tea', icon: '🥗', kcal: r(k,0.13), protein: r(p,0.12), carbs: r(k*0.13*0.60,0.25), fat: r(k*0.13*0.18,0.11) },
    { id: 'm3', slot: 'Lunch', time: '1:30 PM', title: 'Grilled Chicken Breast & Dal Rice', note: '200g grilled chicken breast curry, 1.5 cups cooked rice, 1 bowl moong dal tadka, cucumber salad', icon: '🍱', kcal: r(k,0.35), protein: r(p,0.38), carbs: r(k*0.35*0.45,0.25), fat: r(k*0.35*0.18,0.11) },
    { id: 'm4', slot: 'Pre-Workout Snack', time: '5:00 PM', title: 'Peanut Butter Toast', note: '2 slices whole wheat bread with 1.5 tbsp peanut butter, black coffee', icon: '⚡', kcal: r(k,0.11), protein: r(p,0.09), carbs: r(k*0.11*0.52,0.25), fat: r(k*0.11*0.32,0.11) },
    { id: 'm5', slot: 'Dinner', time: '8:30 PM', title: 'Grilled Chicken Tikka & Roti', note: '150g grilled chicken tikka, 2 whole wheat rotis, mixed sabzi, 1 bowl thick curd', icon: '🍛', kcal: r(k,0.14), protein: r(p,0.13), carbs: r(k*0.14*0.38,0.25), fat: r(k*0.14*0.28,0.11) }
  ]
  if (diet === 'veg') return [
    { id: 'm1', slot: 'Breakfast', time: '7:30 AM', title: 'Paneer Bhurji & Multigrain Roti', note: '150g low-fat paneer bhurji with tomatoes & onions, 2 multigrain rotis, 1 glass toned milk', icon: '🧀', kcal: r(k,0.27), protein: r(p,0.27), carbs: r(k*0.27*0.40,0.25), fat: r(k*0.27*0.32,0.11) },
    { id: 'm2', slot: 'Mid-Morning Fuel', time: '11:00 AM', title: 'Sprouted Moong Chaat', note: '1 bowl sprouted moong & kala chana with lemon & cucumber, 10 walnuts', icon: '🥗', kcal: r(k,0.14), protein: r(p,0.16), carbs: r(k*0.14*0.58,0.25), fat: r(k*0.14*0.18,0.11) },
    { id: 'm3', slot: 'Lunch', time: '1:30 PM', title: 'Soya Chunks & Dal Rice Bowl', note: '60g soya chunks curry, 1 bowl dal tadka, 1.5 cups steamed rice, 1 bowl dahi', icon: '🍱', kcal: r(k,0.34), protein: r(p,0.36), carbs: r(k*0.34*0.50,0.25), fat: r(k*0.34*0.18,0.11) },
    { id: 'm4', slot: 'Pre-Workout Snack', time: '5:00 PM', title: 'Makhana & Banana', note: '1 medium banana, 1 bowl roasted makhana foxnuts, black coffee', icon: '⚡', kcal: r(k,0.11), protein: r(p,0.08), carbs: r(k*0.11*0.68,0.25), fat: r(k*0.11*0.12,0.11) },
    { id: 'm5', slot: 'Dinner', time: '8:30 PM', title: 'Paneer Tikka & Sabzi', note: '120g grilled paneer tikka, 2 whole wheat rotis, mixed vegetable sabzi, 1 bowl curd', icon: '🍛', kcal: r(k,0.14), protein: r(p,0.13), carbs: r(k*0.14*0.38,0.25), fat: r(k*0.14*0.32,0.11) }
  ]
  if (diet === 'egg') return [
    { id: 'm1', slot: 'Breakfast', time: '7:30 AM', title: 'Masala Omelette & Oats', note: '3 whole eggs + 2 egg whites omelette with peppers & onions, 50g oats with milk', icon: '🍳', kcal: r(k,0.27), protein: r(p,0.30), carbs: r(k*0.27*0.40,0.25), fat: r(k*0.27*0.28,0.11) },
    { id: 'm2', slot: 'Mid-Morning Fuel', time: '11:00 AM', title: 'Boiled Eggs & Mixed Nuts', note: '2 boiled egg whites, 10 almonds & walnuts, 1 green tea', icon: '🥜', kcal: r(k,0.13), protein: r(p,0.14), carbs: r(k*0.13*0.25,0.25), fat: r(k*0.13*0.40,0.11) },
    { id: 'm3', slot: 'Lunch', time: '1:30 PM', title: 'Egg Curry & Dal Rice Bowl', note: '3 egg curry, 1 bowl moong dal, 1.5 cups cooked rice, cucumber raita', icon: '🍱', kcal: r(k,0.35), protein: r(p,0.36), carbs: r(k*0.35*0.45,0.25), fat: r(k*0.35*0.22,0.11) },
    { id: 'm4', slot: 'Pre-Workout Snack', time: '5:00 PM', title: 'Banana & Peanut Butter', note: '1 medium banana, 1.5 tbsp peanut butter, black coffee', icon: '⚡', kcal: r(k,0.11), protein: r(p,0.08), carbs: r(k*0.11*0.58,0.25), fat: r(k*0.11*0.28,0.11) },
    { id: 'm5', slot: 'Dinner', time: '8:30 PM', title: 'Egg Bhurji & Roti', note: '3 egg bhurji with tomatoes & onions, 2 whole wheat rotis, 1 bowl thick dahi, green salad', icon: '🍛', kcal: r(k,0.14), protein: r(p,0.12), carbs: r(k*0.14*0.38,0.25), fat: r(k*0.14*0.28,0.11) }
  ]
  return [
    { id: 'm1', slot: 'Breakfast', time: '7:30 AM', title: 'Tofu Scramble & Oats', note: '150g tofu scramble with spinach & turmeric, 50g oats with soy milk, 1 banana', icon: '🥗', kcal: r(k,0.27), protein: r(p,0.27), carbs: r(k*0.27*0.48,0.25), fat: r(k*0.27*0.22,0.11) },
    { id: 'm2', slot: 'Mid-Morning Fuel', time: '11:00 AM', title: 'Sprouted Moong & Chia Drink', note: '1 bowl sprouted moong & kala chana chaat with lemon, 1 glass chia seed water', icon: '🥜', kcal: r(k,0.14), protein: r(p,0.16), carbs: r(k*0.14*0.58,0.25), fat: r(k*0.14*0.16,0.11) },
    { id: 'm3', slot: 'Lunch', time: '1:30 PM', title: 'Rajma & Tofu Rice Bowl', note: '1 bowl rajma curry, 100g pan-seared tofu, 1.5 cups steamed rice, garden salad', icon: '🍱', kcal: r(k,0.34), protein: r(p,0.34), carbs: r(k*0.34*0.52,0.25), fat: r(k*0.34*0.18,0.11) },
    { id: 'm4', slot: 'Pre-Workout Snack', time: '5:00 PM', title: 'Banana & Peanut Butter', note: '1 banana, 1 tbsp natural peanut butter, black coffee', icon: '⚡', kcal: r(k,0.11), protein: r(p,0.07), carbs: r(k*0.11*0.60,0.25), fat: r(k*0.11*0.28,0.11) },
    { id: 'm5', slot: 'Dinner', time: '8:30 PM', title: 'Soya Chunks Curry & Roti', note: '60g soya chunks curry dry weight, 2 whole wheat rotis, steamed mixed veggies, coconut curd', icon: '🍛', kcal: r(k,0.14), protein: r(p,0.16), carbs: r(k*0.14*0.50,0.25), fat: r(k*0.14*0.14,0.11) }
  ]
}

function buildStaticWorkout(numDays, location, goal, experience, conditions) {
  const isGym = location === 'gym', isHome = location === 'home', isCal = location === 'calisthenics'
  const s = experience === 'advanced' ? '4' : '3'
  const r = goal === 'strength' ? '5' : goal === 'fat_loss' ? '12' : '8'
  const rA = goal === 'strength' ? '8' : goal === 'fat_loss' ? '15' : '10'
  const hasKnee = conditions.includes('knee_injury'), hasBack = conditions.includes('back_injury'), hasShould = conditions.includes('shoulder_injury')
  const bench = isGym ? 'barbell bench press' : isHome ? 'dumbbell bench press' : 'push-up'
  const row = isGym ? 'barbell bent over row' : isHome ? 'one arm dumbbell row' : 'inverted row'
  const pull = isGym ? 'lat pulldown' : 'pull-up'
  const squat = hasKnee ? 'leg extension' : isGym ? 'barbell squat' : isHome ? 'goblet squat' : 'split squats'
  const dl = hasBack ? 'hyperextension' : isGym ? 'barbell deadlift' : isHome ? 'dumbbell romanian deadlift' : 'glute bridge march'
  const ohp = hasShould ? 'cable face pull' : isGym ? 'standing dumbbell overhead press' : isHome ? 'standing dumbbell overhead press' : 'pike push-up'
  const curl = isGym ? 'dumbbell alternate bicep curl' : 'hammer curl'
  const tri = isGym ? 'cable tricep pushdown' : 'overhead tricep extension'
  const calf = isGym ? 'standing calf raise' : 'bodyweight standing calf raise'
  const core = isCal ? 'crunch floor' : 'hanging leg raise'

  const push = { n: 'Day 1: Push — Chest, Shoulders & Triceps', t: 'Chest · Shoulders · Triceps', r: false, exercises: [
    {name: bench, sets: s, reps: r, badge: 'push'}, {name: ohp, sets: s, reps: rA, badge: 'push'},
    {name: tri, sets: s, reps: rA, badge: 'push'}, {name: 'dumbbell lateral raise', sets: s, reps: rA, badge: 'push'},
    {name: core, sets: '3', reps: '15', badge: 'core'}
  ]}
  const pullDay = { n: 'Day 2: Pull — Back & Biceps', t: 'Lats · Upper Back · Biceps', r: false, exercises: [
    {name: pull, sets: s, reps: r, badge: 'pull'}, {name: row, sets: s, reps: rA, badge: 'pull'},
    {name: curl, sets: s, reps: rA, badge: 'pull'}, {name: isGym ? 'cable face pull' : 'inverted row', sets: '3', reps: '15', badge: 'pull'},
    {name: 'hammer curl', sets: '3', reps: rA, badge: 'pull'}
  ]}
  const legs = { n: 'Day 3: Legs — Quads, Hamstrings & Calves', t: 'Quads · Hamstrings · Glutes · Calves', r: false, exercises: [
    {name: squat, sets: s, reps: r, badge: 'legs'}, {name: dl, sets: s, reps: rA, badge: 'legs'},
    {name: isGym ? 'leg press' : isHome ? 'dumbbell walking lunges' : 'walking lunge', sets: s, reps: rA, badge: 'legs'},
    {name: isGym ? 'lying leg curls' : 'dumbbell romanian deadlift', sets: s, reps: rA, badge: 'legs'},
    {name: calf, sets: '3', reps: '20', badge: 'legs'}
  ]}
  const full = { n: 'Day 4: Full Body — Compound Power', t: 'Full Body · Core', r: false, exercises: [
    {name: bench, sets: s, reps: r, badge: 'push'}, {name: row, sets: s, reps: r, badge: 'pull'},
    {name: squat, sets: s, reps: rA, badge: 'legs'}, {name: ohp, sets: s, reps: rA, badge: 'push'},
    {name: core, sets: '3', reps: '15', badge: 'core'}
  ]}

  if (numDays <= 2) return [push, pullDay]
  if (numDays === 3) return [push, legs, pullDay]
  return [push, legs, pullDay, full]
}
