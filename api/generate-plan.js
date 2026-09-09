export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { answers } = req.body || {};
    if (!answers) return res.status(400).json({ error: 'No answers provided' });

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
      diet = 'nonveg'
    } = answers;

    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    if (OPENAI_KEY) {
      try {
        const goalMap = { muscle: 'Muscle Hypertrophy & Mass', fat_loss: 'Fat Loss & Definition', strength: 'Raw Strength & Power', general: 'General Fitness & Athletic Conditioning' };
        const dietMap = { nonveg: 'Non-vegetarian (includes chicken, eggs, fish)', egg: 'Eggetarian (eggs only, no meat)', veg: 'Vegetarian (paneer, soya, dal, dahi)', vegan: 'Vegan (plant-based only)' };
        const locMap = { gym: 'Commercial Gym with Barbells, Dumbbells, Cables, and Machines', home: 'Home Setup with Dumbbells and Adjustable Bench', calisthenics: 'Zero Equipment Bodyweight and Calisthenics' };
        const focusMap = { balanced: 'Balanced full body proportion', upper: 'Upper Body (Chest, Delts & Arms priority)', vtaper: 'V-Taper (Back width, Lats & Shoulders)', legs: 'Lower Body (Quads, Glutes & Hamstrings)' };

        const equipConstraints = location === 'calisthenics'
          ? `MANDATORY EQUIPMENT CONSTRAINT FOR CALISTHENICS:
The client has selected 'Zero Equipment Bodyweight and Calisthenics'.
Every single exercise MUST strictly be 100% bodyweight only (e.g. push-ups, dips, pull-ups, chin-ups, inverted rows, bodyweight squats, lunges, calf raises, leg raises, planks).
ABSOLUTELY NO barbells, NO dumbbells, NO cables, NO machines, and NO added weights under any circumstances.`
          : location === 'home'
          ? `MANDATORY EQUIPMENT CONSTRAINT FOR HOME:
The client has a 'Home Setup with Dumbbells and Adjustable Bench'.
Use ONLY dumbbells, flat/incline bench, pull-up bar, and bodyweight exercises.
ABSOLUTELY NO barbells, NO cables, and NO heavy gym machines.`
          : `The client has access to a full commercial gym with barbells, dumbbells, cables, and machines.`;

        const prompt = `You are a world-class biomechanics strength coach and elite Indian sports nutritionist.
Create a 100% bespoke, custom training and nutrition plan tailored specifically for this individual from scratch.

CLIENT PROFILE:
- Name: ${pname}
- Age: ${age} years | Gender: ${gender} | Weight: ${weight} kg | Height: ${height} cm
- Fitness Objective: ${goalMap[goal] || goal}
- Cultural Nutrition: ${dietMap[diet] || diet}
- Training Environment: ${locMap[location] || location}
- Training Frequency: EXACTLY ${days} DAYS PER WEEK
- Lifting Experience: ${experience}
- Priority Focus: ${focusMap[focus] || focus}

EQUIPMENT RULES:
${equipConstraints}

INSTRUCTIONS:
1. Calculate BMR (Mifflin-St Jeor formula) and TDEE based on ${days} training days.
2. Calibrate daily calorie target (${goal === 'fat_loss' ? 'deficit' : goal === 'muscle' ? 'surplus' : 'maintenance'}) and macro split (Protein ~2.0-2.2g/kg, Carbs 45-55%, Fats 20-25%).
3. Generate EXACTLY ${days} distinct, custom workout routines in the "workout" array (one for each of the ${days} training days). Each routine must contain 5-6 exercises strictly matched to their equipment (${location}) and experience (${experience}).
4. Provide 5 authentic Indian meals tailored to their dietary preference (${diet}) that hit their exact macro targets.

Return ONLY a valid JSON object with this EXACT schema:
{
  "kcal": 2400,
  "protein": 145,
  "carbs": 270,
  "fat": 65,
  "bmi": 23.5,
  "goal": "${goal}",
  "diet": "${diet}",
  "coachNote": "2-3 personalized sentences highlighting their custom training architecture and progressive overload targets.",
  "weeklyInsight": "1 motivating tactical coaching tip.",
  "meals": [
    {"t": "8:00 AM", "n": "Breakfast", "d": "Meal description with quantities", "i": "🍳", "k": 480, "p": 35, "note": "Tip"},
    {"t": "11:30 AM", "n": "Mid-Morning", "d": "...", "i": "🥗", "k": 250, "p": 15, "note": "..."},
    {"t": "1:30 PM", "n": "Lunch", "d": "...", "i": "🍱", "k": 650, "p": 45, "note": "..."},
    {"t": "5:00 PM", "n": "Pre-Workout Snack", "d": "...", "i": "⚡", "k": 220, "p": 10, "note": "..."},
    {"t": "8:30 PM", "n": "Dinner", "d": "...", "i": "🍛", "k": 500, "p": 35, "note": "..."}
  ],
  "workout": [
    // EXACTLY ${days} workout objects here
    {"n": "Day 1: Upper Strength", "t": "Chest · Shoulders · Triceps", "exercises": [
      {"name": "${location === 'calisthenics' ? 'push-up' : location === 'home' ? 'dumbbell bench press' : 'barbell bench press'}", "sets": "4", "reps": "8", "badge": "push"}
    ]}
  ]
}`;

        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 3500
          })
        });

        if (openAiResponse.ok) {
          const data = await openAiResponse.json();
          const content = data.choices[0].message.content.trim();
          const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
          const plan = JSON.parse(jsonStr);
          plan.generatedAt = new Date().toISOString();
          plan.monthNumber = 1;
          plan.lastUpdated = new Date().toISOString();
          return res.status(200).json({ plan });
        }
      } catch (aiErr) {
        console.warn('OpenAI call failed, falling back to smart local plan calculation:', aiErr);
      }
    }

    // Fallback: Smart Science-Backed Custom Generator
    const numAge = Number(age) || 25;
    const numWeight = Number(weight) || 72;
    const numHeight = Number(height) || 175;
    const numDays = Number(days) || 4;

    const bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge) + (gender === 'female' ? -161 : 5);
    const actMap = { 2: 1.35, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.75 };
    const tdee = Math.round(bmr * (actMap[numDays] || 1.55));

    let kcal = tdee;
    if (goal === 'fat_loss') kcal = Math.round(tdee - 450);
    else if (goal === 'muscle') kcal = Math.round(tdee + 350);
    else if (goal === 'strength') kcal = Math.round(tdee + 250);

    const protein = Math.round(numWeight * (goal === 'fat_loss' ? 2.2 : 2.0));
    const fat = Math.round((kcal * 0.25) / 9);
    const carbs = Math.max(0, Math.round((kcal - (protein * 4) - (fat * 9)) / 4));

    const heightM = numHeight / 100;
    const bmi = parseFloat((numWeight / (heightM * heightM)).toFixed(1));

    const meals = [
      { t: '8:00 AM', n: 'High-Protein Breakfast', d: diet === 'nonveg' ? '3 Whole Eggs + 2 Egg Whites scramble + 2 rotis' : '150g Paneer Bhurji / Soya Paneer + 2 rotis', i: '🍳', k: Math.round(kcal * 0.28), p: Math.round(protein * 0.28), note: 'Optimal morning amino acid release.' },
      { t: '11:30 AM', n: 'Mid-Morning Boost', d: 'Roasted chana / mixed nuts (30g) + 1 fruit', i: '🥗', k: Math.round(kcal * 0.15), p: Math.round(protein * 0.18), note: 'Sustained energy and micronutrients.' },
      { t: '1:30 PM', n: 'Power Lunch', d: diet === 'nonveg' ? '150g Chicken breast / Fish curry + 1.5 cups rice + dal' : 'Soya chunks curry (50g) + 1 cup yellow dal + rice + curd', i: '🍱', k: Math.round(kcal * 0.32), p: Math.round(protein * 0.32), note: 'Glycogen replenishment and lean protein.' },
      { t: '5:00 PM', n: 'Pre-Workout Fuel', d: '2 brown breads with peanut butter + black coffee', i: '⚡', k: Math.round(kcal * 0.11), p: Math.round(protein * 0.10), note: 'Fast-digesting workout fuel.' },
      { t: '8:30 PM', n: 'Recovery Dinner', d: diet === 'nonveg' ? '120g Chicken tikka + mixed veg + 2 rotis' : '100g Tofu/Paneer curry + dal + 2 rotis', i: '🍛', k: Math.round(kcal * 0.14), p: Math.round(protein * 0.12), note: 'Overnight tissue repair.' }
    ];

    // Dynamic workout building based on location & days
    let workout = [];
    const isCalisthenics = location === 'calisthenics';
    const isHome = location === 'home';

    if (numDays === 3) {
      if (isCalisthenics) {
        workout = [
          { n: 'Day 1: Upper Push & Core Mechanics', t: 'Chest · Shoulders · Triceps · Abs', exercises: [
            { name: 'push-up', sets: '4', reps: '10-12', badge: 'push' },
            { name: 'chest dip', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'decline push-up', sets: '3', reps: '10-12', badge: 'push' },
            { name: 'diamond push-up', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'front plank with twist', sets: '3', reps: '45s hold', badge: 'core' }
          ]},
          { n: 'Day 2: Back Width & Pull Dynamics', t: 'Lats · Upper Back · Biceps', exercises: [
            { name: 'pull-up', sets: '4', reps: '6-10', badge: 'pull' },
            { name: 'chin-up', sets: '4', reps: '6-8', badge: 'pull' },
            { name: 'inverted row', sets: '3', reps: '10-12', badge: 'pull' },
            { name: 'scapular pull-up', sets: '3', reps: '12-15', badge: 'pull' },
            { name: 'hanging leg raise', sets: '3', reps: '12-15', badge: 'core' }
          ]},
          { n: 'Day 3: Lower Body Power & Conditioning', t: 'Quads · Hamstrings · Glutes · Calves', exercises: [
            { name: 'split squats', sets: '4', reps: '12 each', badge: 'legs' },
            { name: 'walking lunge', sets: '4', reps: '12 each', badge: 'legs' },
            { name: 'jump squat', sets: '3', reps: '12-15', badge: 'legs' },
            { name: 'bodyweight standing calf raise', sets: '4', reps: '15-20', badge: 'legs' },
            { name: 'glute bridge march', sets: '3', reps: '15', badge: 'legs' }
          ]}
        ];
      } else if (isHome) {
        workout = [
          { n: 'Day 1: Dumbbell Upper Body & Chest Focus', t: 'Chest · Shoulders · Triceps', exercises: [
            { name: 'dumbbell bench press', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'incline dumbbell bench press', sets: '3', reps: '10-12', badge: 'push' },
            { name: 'standing dumbbell overhead press', sets: '3', reps: '10', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'overhead tricep extension', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 2: Dumbbell Back Width & Arm Power', t: 'Back · Biceps · Rear Delts', exercises: [
            { name: 'one arm dumbbell row', sets: '4', reps: '8-10', badge: 'pull' },
            { name: 'pull-up', sets: '4', reps: '8', badge: 'pull' },
            { name: 'dumbbell romanian deadlift', sets: '3', reps: '10', badge: 'pull' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 3: Dumbbell Lower Body & Core Strength', t: 'Quads · Hamstrings · Glutes · Calves', exercises: [
            { name: 'goblet squat', sets: '4', reps: '8-10', badge: 'legs' },
            { name: 'dumbbell walking lunges', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'dumbbell romanian deadlift', sets: '3', reps: '10', badge: 'legs' },
            { name: 'single leg calf raise', sets: '3', reps: '15', badge: 'legs' },
            { name: 'front plank with twist', sets: '3', reps: '60s hold', badge: 'core' }
          ]}
        ];
      } else {
        workout = [
          { n: 'Day 1: Push Hypertrophy', t: 'Chest · Shoulders · Triceps', exercises: [
            { name: 'barbell bench press', sets: '4', reps: '8', badge: 'push' },
            { name: 'incline dumbbell bench press', sets: '3', reps: '10', badge: 'push' },
            { name: 'standing dumbbell overhead press', sets: '3', reps: '10', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '3', reps: '12', badge: 'push' },
            { name: 'cable tricep pushdown', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 2: Pull Power & Lat Width', t: 'Back · Biceps · Rear Delts', exercises: [
            { name: 'barbell deadlift', sets: '4', reps: '6', badge: 'pull' },
            { name: 'lat pulldown', sets: '4', reps: '8', badge: 'pull' },
            { name: 'barbell bent over row', sets: '3', reps: '10', badge: 'pull' },
            { name: 'cable seated row', sets: '3', reps: '10', badge: 'pull' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 3: Quad & Calves Power', t: 'Quads · Hamstrings · Calves', exercises: [
            { name: 'barbell squat', sets: '4', reps: '8', badge: 'legs' },
            { name: 'barbell romanian deadlift', sets: '3', reps: '10', badge: 'legs' },
            { name: 'leg press', sets: '3', reps: '12', badge: 'legs' },
            { name: 'lying leg curls', sets: '3', reps: '12', badge: 'legs' },
            { name: 'standing calf raises', sets: '4', reps: '15', badge: 'legs' }
          ]}
        ];
      }
    } else if (numDays === 5) {
      if (isCalisthenics) {
        workout = [
          { n: 'Day 1: Push Hypertrophy & Chest Specialization', t: 'Chest · Triceps Focus', exercises: [
            { name: 'push-up', sets: '4', reps: '10-12', badge: 'push' },
            { name: 'chest dip', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'decline push-up', sets: '3', reps: '10-12', badge: 'push' },
            { name: 'diamond push-up', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'bench dip (knees bent)', sets: '3', reps: '12-15', badge: 'push' }
          ]},
          { n: 'Day 2: Pull Hypertrophy & Lat Width Arc', t: 'Lats · Upper Back · Biceps', exercises: [
            { name: 'pull-up', sets: '4', reps: '6-10', badge: 'pull' },
            { name: 'chin-up', sets: '4', reps: '6-8', badge: 'pull' },
            { name: 'wide grip pull-up', sets: '3', reps: '6-8', badge: 'pull' },
            { name: 'inverted row', sets: '3', reps: '10-12', badge: 'pull' },
            { name: 'bodyweight squatting row', sets: '3', reps: '12-15', badge: 'pull' }
          ]},
          { n: 'Day 3: Lower Body Power & Calves Conditioning', t: 'Quads · Hamstrings · Glutes · Calves', exercises: [
            { name: 'split squats', sets: '4', reps: '12 each', badge: 'legs' },
            { name: 'walking lunge', sets: '4', reps: '10 each', badge: 'legs' },
            { name: 'jump squat', sets: '3', reps: '12-15', badge: 'legs' },
            { name: 'glute bridge march', sets: '3', reps: '15', badge: 'legs' },
            { name: 'bodyweight standing calf raise', sets: '4', reps: '20', badge: 'legs' }
          ]},
          { n: 'Day 4: Shoulders & Dynamic Push Mechanics', t: 'Delts · Upper Chest · Core', exercises: [
            { name: 'pike-to-cobra push-up', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'archer push up', sets: '3', reps: '6 each', badge: 'push' },
            { name: 'incline push-up', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'hanging leg raise', sets: '3', reps: '12-15', badge: 'core' },
            { name: 'front plank with twist', sets: '3', reps: '60s hold', badge: 'core' }
          ]},
          { n: 'Day 5: Full Body Functional Conditioning & Finisher', t: 'Total Body Calisthenics Overload', exercises: [
            { name: 'pull-up', sets: '4', reps: '6-8', badge: 'pull' },
            { name: 'chest dip', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'forward lunge (male)', sets: '3', reps: '12 each', badge: 'legs' },
            { name: 'diamond push-up', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'reverse crunch', sets: '3', reps: '15', badge: 'core' }
          ]}
        ];
      } else if (isHome) {
        workout = [
          { n: 'Day 1: Dumbbell Chest & Triceps Hypertrophy', t: 'Chest · Triceps Focus', exercises: [
            { name: 'dumbbell bench press', sets: '4', reps: '8', badge: 'push' },
            { name: 'incline dumbbell bench press', sets: '3', reps: '10', badge: 'push' },
            { name: 'dumbbell floor fly', sets: '3', reps: '12', badge: 'push' },
            { name: 'push-up', sets: '3', reps: '15', badge: 'push' },
            { name: 'overhead tricep extension', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 2: Dumbbell Back Width & Biceps Arc', t: 'Back · Biceps · Rear Delts', exercises: [
            { name: 'one arm dumbbell row', sets: '4', reps: '8', badge: 'pull' },
            { name: 'pull-up', sets: '4', reps: '8', badge: 'pull' },
            { name: 'dumbbell romanian deadlift', sets: '3', reps: '10', badge: 'pull' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 3: Dumbbell Lower Body & Calves Power', t: 'Quads · Hamstrings · Calves', exercises: [
            { name: 'goblet squat', sets: '4', reps: '8', badge: 'legs' },
            { name: 'dumbbell walking lunges', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'dumbbell romanian deadlift', sets: '3', reps: '10', badge: 'legs' },
            { name: 'single leg calf raise', sets: '3', reps: '15', badge: 'legs' },
            { name: 'hanging leg raise', sets: '3', reps: '12', badge: 'core' }
          ]},
          { n: 'Day 4: Dumbbell Shoulders & Traps Isolation', t: 'Delts · Traps · Upper Back', exercises: [
            { name: 'standing dumbbell overhead press', sets: '4', reps: '8', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '4', reps: '12', badge: 'push' },
            { name: 'dumbbell rear lateral raise', sets: '3', reps: '12', badge: 'pull' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' },
            { name: 'front plank with twist', sets: '3', reps: '60s hold', badge: 'core' }
          ]},
          { n: 'Day 5: Posterior Chain & Arm Overload', t: 'Hamstrings · Glutes · Arms', exercises: [
            { name: 'dumbbell romanian deadlift', sets: '4', reps: '8', badge: 'legs' },
            { name: 'bulgarian split squat', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' },
            { name: 'overhead tricep extension', sets: '3', reps: '12', badge: 'push' },
            { name: 'reverse crunch', sets: '3', reps: '15', badge: 'core' }
          ]}
        ];
      } else {
        workout = [
          { n: 'Day 1: Chest & Triceps Hypertrophy', t: 'Chest · Triceps', exercises: [
            { name: 'barbell bench press', sets: '4', reps: '8', badge: 'push' },
            { name: 'incline dumbbell bench press', sets: '3', reps: '10', badge: 'push' },
            { name: 'cable crossover', sets: '3', reps: '12', badge: 'push' },
            { name: 'cable tricep pushdown', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 2: Back & Lat Thickness', t: 'Lats · Upper Back · Biceps', exercises: [
            { name: 'barbell deadlift', sets: '4', reps: '6', badge: 'pull' },
            { name: 'lat pulldown', sets: '4', reps: '8', badge: 'pull' },
            { name: 'barbell bent over row', sets: '3', reps: '10', badge: 'pull' },
            { name: 'barbell curl', sets: '3', reps: '10', badge: 'pull' }
          ]},
          { n: 'Day 3: Quad Power & Calves', t: 'Quads · Calves', exercises: [
            { name: 'barbell squat', sets: '4', reps: '8', badge: 'legs' },
            { name: 'leg press', sets: '3', reps: '10', badge: 'legs' },
            { name: 'leg extensions', sets: '3', reps: '12', badge: 'legs' },
            { name: 'standing calf raises', sets: '4', reps: '15', badge: 'legs' }
          ]},
          { n: 'Day 4: Shoulders & Arms Focus', t: 'Delts · Biceps · Triceps', exercises: [
            { name: 'standing dumbbell overhead press', sets: '4', reps: '8', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '4', reps: '12', badge: 'push' },
            { name: 'cable face pull', sets: '3', reps: '15', badge: 'pull' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 5: Posterior Chain & Core', t: 'Hamstrings · Glutes · Abs', exercises: [
            { name: 'barbell romanian deadlift', sets: '4', reps: '8', badge: 'legs' },
            { name: 'lying leg curls', sets: '4', reps: '12', badge: 'legs' },
            { name: 'hanging leg raise', sets: '3', reps: '15', badge: 'core' }
          ]}
        ];
      }
    } else if (numDays === 6) {
      if (isCalisthenics) {
        workout = [
          { n: 'Day 1: Push A · Chest Compound & Bodyweight Power', t: 'Chest · Shoulders · Triceps', exercises: [
            { name: 'push-up', sets: '4', reps: '10-12', badge: 'push' },
            { name: 'chest dip', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'decline push-up', sets: '3', reps: '10-12', badge: 'push' },
            { name: 'diamond push-up', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'front plank with twist', sets: '3', reps: '45s hold', badge: 'core' }
          ]},
          { n: 'Day 2: Pull A · Lat Width & Biceps Dynamics', t: 'Lats · Biceps · Upper Back', exercises: [
            { name: 'pull-up', sets: '4', reps: '6-10', badge: 'pull' },
            { name: 'chin-up', sets: '4', reps: '6-8', badge: 'pull' },
            { name: 'inverted row', sets: '3', reps: '10-12', badge: 'pull' },
            { name: 'scapular pull-up', sets: '3', reps: '12-15', badge: 'pull' },
            { name: 'hanging leg raise', sets: '3', reps: '12-15', badge: 'core' }
          ]},
          { n: 'Day 3: Legs A · Quad Overload & Calves', t: 'Quads · Calves · Core', exercises: [
            { name: 'split squats', sets: '4', reps: '12 each', badge: 'legs' },
            { name: 'walking lunge', sets: '4', reps: '10 each', badge: 'legs' },
            { name: 'jump squat', sets: '3', reps: '12-15', badge: 'legs' },
            { name: 'bodyweight standing calf raise', sets: '4', reps: '20', badge: 'legs' },
            { name: 'cross body crunch', sets: '3', reps: '15', badge: 'core' }
          ]},
          { n: 'Day 4: Push B · Delts & Triceps Focus', t: 'Shoulders · Triceps · Upper Chest', exercises: [
            { name: 'pike-to-cobra push-up', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'archer push up', sets: '3', reps: '6 each', badge: 'push' },
            { name: 'incline push-up', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'bench dip (knees bent)', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'close-grip push-up', sets: '3', reps: '10-12', badge: 'push' }
          ]},
          { n: 'Day 5: Pull B · Back Thickness & Inverted Rows', t: 'Upper Back · Lats · Core', exercises: [
            { name: 'pull-up', sets: '4', reps: '6-8', badge: 'pull' },
            { name: 'inverted row bent knees', sets: '3', reps: '10-12', badge: 'pull' },
            { name: 'bodyweight squatting row', sets: '3', reps: '12-15', badge: 'pull' },
            { name: 'chin-up', sets: '3', reps: '6-8', badge: 'pull' },
            { name: 'reverse crunch', sets: '3', reps: '15', badge: 'core' }
          ]},
          { n: 'Day 6: Legs B · Posterior Chain & Glutes', t: 'Hamstrings · Glutes · Calves', exercises: [
            { name: 'forward lunge (male)', sets: '4', reps: '12 each', badge: 'legs' },
            { name: 'glute bridge march', sets: '3', reps: '15', badge: 'legs' },
            { name: 'single leg squat (pistol) male', sets: '3', reps: '8 each', badge: 'legs' },
            { name: 'bodyweight standing calf raise', sets: '4', reps: '20', badge: 'legs' },
            { name: 'bodyweight incline side plank', sets: '3', reps: '45s hold', badge: 'core' }
          ]}
        ];
      } else if (isHome) {
        workout = [
          { n: 'Day 1: Push A (Dumbbell Chest & Delts)', t: 'Chest · Shoulders · Triceps', exercises: [
            { name: 'dumbbell bench press', sets: '4', reps: '8', badge: 'push' },
            { name: 'incline dumbbell bench press', sets: '3', reps: '10', badge: 'push' },
            { name: 'standing dumbbell overhead press', sets: '3', reps: '10', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '3', reps: '12', badge: 'push' },
            { name: 'overhead tricep extension', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 2: Pull A (Dumbbell Rows & Pull-ups)', t: 'Back · Biceps', exercises: [
            { name: 'one arm dumbbell row', sets: '4', reps: '8', badge: 'pull' },
            { name: 'pull-up', sets: '4', reps: '8', badge: 'pull' },
            { name: 'dumbbell romanian deadlift', sets: '3', reps: '10', badge: 'pull' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 3: Legs A (Goblet Squat & Quads)', t: 'Quads · Calves · Core', exercises: [
            { name: 'goblet squat', sets: '4', reps: '8', badge: 'legs' },
            { name: 'dumbbell walking lunges', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'single leg calf raise', sets: '3', reps: '15', badge: 'legs' },
            { name: 'jump squat', sets: '3', reps: '12', badge: 'legs' },
            { name: 'hanging leg raise', sets: '3', reps: '12', badge: 'core' }
          ]},
          { n: 'Day 4: Push B (Incline & Arms)', t: 'Incline Chest · Delts · Triceps', exercises: [
            { name: 'incline dumbbell bench press', sets: '4', reps: '10', badge: 'push' },
            { name: 'push-up', sets: '4', reps: '15', badge: 'push' },
            { name: 'standing dumbbell overhead press', sets: '3', reps: '10', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '3', reps: '12', badge: 'push' },
            { name: 'chest dip', sets: '3', reps: '10', badge: 'push' }
          ]},
          { n: 'Day 5: Pull B (Posterior Chain & Arms)', t: 'Back · Biceps', exercises: [
            { name: 'one arm dumbbell row', sets: '4', reps: '10', badge: 'pull' },
            { name: 'inverted row', sets: '3', reps: '10-12', badge: 'pull' },
            { name: 'dumbbell rear lateral raise', sets: '3', reps: '12', badge: 'pull' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 6: Legs B (Romanian Deadlift & Glutes)', t: 'Hamstrings · Glutes · Calves', exercises: [
            { name: 'dumbbell romanian deadlift', sets: '4', reps: '8', badge: 'legs' },
            { name: 'goblet squat', sets: '3', reps: '10', badge: 'legs' },
            { name: 'bulgarian split squat', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'single leg calf raise', sets: '3', reps: '15', badge: 'legs' },
            { name: 'front plank with twist', sets: '3', reps: '60s hold', badge: 'core' }
          ]}
        ];
      } else {
        workout = [
          { n: 'Day 1: Push A (Chest Compound)', t: 'Chest · Shoulders · Triceps', exercises: [
            { name: 'barbell bench press', sets: '4', reps: '8', badge: 'push' },
            { name: 'incline dumbbell bench press', sets: '3', reps: '10', badge: 'push' },
            { name: 'standing dumbbell overhead press', sets: '3', reps: '10', badge: 'push' },
            { name: 'cable tricep pushdown', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 2: Pull A (Lat Width)', t: 'Back · Biceps', exercises: [
            { name: 'pull-up', sets: '4', reps: '8', badge: 'pull' },
            { name: 'lat pulldown', sets: '3', reps: '10', badge: 'pull' },
            { name: 'barbell bent over row', sets: '3', reps: '10', badge: 'pull' },
            { name: 'barbell curl', sets: '3', reps: '10', badge: 'pull' }
          ]},
          { n: 'Day 3: Legs A (Quad Focus)', t: 'Quads · Calves', exercises: [
            { name: 'barbell squat', sets: '4', reps: '8', badge: 'legs' },
            { name: 'leg press', sets: '3', reps: '10', badge: 'legs' },
            { name: 'standing calf raises', sets: '4', reps: '15', badge: 'legs' }
          ]},
          { n: 'Day 4: Push B (Incline & Delts)', t: 'Incline Chest · Delts', exercises: [
            { name: 'incline dumbbell bench press', sets: '4', reps: '10', badge: 'push' },
            { name: 'chest dip', sets: '3', reps: '10', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '4', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 5: Pull B (Back Thickness)', t: 'Deadlifts · Rows', exercises: [
            { name: 'barbell deadlift', sets: '4', reps: '6', badge: 'pull' },
            { name: 'cable seated row', sets: '4', reps: '10', badge: 'pull' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 6: Legs B (Posterior Chain)', t: 'Hamstrings · Glutes', exercises: [
            { name: 'barbell romanian deadlift', sets: '4', reps: '8', badge: 'legs' },
            { name: 'goblet squat', sets: '3', reps: '12', badge: 'legs' },
            { name: 'lying leg curls', sets: '3', reps: '12', badge: 'legs' }
          ]}
        ];
      }
    } else {
      // Default 4 Days
      if (isCalisthenics) {
        workout = [
          { n: 'Day 1: Upper Push & Chest Architecture', t: 'Chest · Shoulders · Triceps', exercises: [
            { name: 'push-up', sets: '4', reps: '10-12', badge: 'push' },
            { name: 'chest dip', sets: '4', reps: '8-10', badge: 'push' },
            { name: 'incline push-up', sets: '3', reps: '10-12', badge: 'push' },
            { name: 'close-grip push-up', sets: '3', reps: '10-12', badge: 'push' },
            { name: 'front plank with twist', sets: '3', reps: '45s hold', badge: 'core' }
          ]},
          { n: 'Day 2: Lower Body Power & Quad Hypertrophy', t: 'Quads · Glutes · Calves · Abs', exercises: [
            { name: 'split squats', sets: '4', reps: '12 each', badge: 'legs' },
            { name: 'walking lunge', sets: '4', reps: '10 each', badge: 'legs' },
            { name: 'jump squat', sets: '3', reps: '12-15', badge: 'legs' },
            { name: 'bodyweight standing calf raise', sets: '4', reps: '15-20', badge: 'legs' },
            { name: 'cross body crunch', sets: '3', reps: '15', badge: 'core' }
          ]},
          { n: 'Day 3: Upper Pull & Back Width Arc', t: 'Lats · Upper Back · Biceps', exercises: [
            { name: 'pull-up', sets: '4', reps: '6-10', badge: 'pull' },
            { name: 'chin-up', sets: '4', reps: '6-8', badge: 'pull' },
            { name: 'inverted row', sets: '3', reps: '10-12', badge: 'pull' },
            { name: 'scapular pull-up', sets: '3', reps: '12-15', badge: 'pull' },
            { name: 'hanging leg raise', sets: '3', reps: '12-15', badge: 'core' }
          ]},
          { n: 'Day 4: Posterior Chain & Functional Conditioning', t: 'Glutes · Hamstrings · Calisthenics Core', exercises: [
            { name: 'single leg squat (pistol) male', sets: '4', reps: '8-10 each', badge: 'legs' },
            { name: 'glute bridge march', sets: '3', reps: '15', badge: 'legs' },
            { name: 'diamond push-up', sets: '3', reps: '12-15', badge: 'push' },
            { name: 'bodyweight incline side plank', sets: '3', reps: '45s hold', badge: 'core' },
            { name: 'reverse crunch', sets: '3', reps: '15', badge: 'core' }
          ]}
        ];
      } else if (isHome) {
        workout = [
          { n: 'Day 1: Upper Body Strength & Chest Focus', t: 'Chest · Back · Shoulders', exercises: [
            { name: 'dumbbell bench press', sets: '4', reps: '8', badge: 'push' },
            { name: 'one arm dumbbell row', sets: '4', reps: '8', badge: 'pull' },
            { name: 'incline dumbbell bench press', sets: '3', reps: '10', badge: 'push' },
            { name: 'dumbbell lateral raise', sets: '3', reps: '12', badge: 'push' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 2: Lower Body Power & Quad Hypertrophy', t: 'Quads · Hamstrings · Glutes · Calves', exercises: [
            { name: 'goblet squat', sets: '4', reps: '8', badge: 'legs' },
            { name: 'dumbbell romanian deadlift', sets: '3', reps: '10', badge: 'legs' },
            { name: 'dumbbell walking lunges', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'single leg calf raise', sets: '3', reps: '12', badge: 'legs' },
            { name: 'front plank with twist', sets: '3', reps: '60s hold', badge: 'core' }
          ]},
          { n: 'Day 3: Upper Body Hypertrophy & Arms Overload', t: 'Shoulders · Back · Triceps · Biceps', exercises: [
            { name: 'standing dumbbell overhead press', sets: '4', reps: '8', badge: 'push' },
            { name: 'pull-up', sets: '4', reps: '8', badge: 'pull' },
            { name: 'dumbbell floor fly', sets: '3', reps: '12', badge: 'push' },
            { name: 'hammer curl', sets: '3', reps: '12', badge: 'pull' },
            { name: 'overhead tricep extension', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 4: Posterior Chain & Functional Conditioning', t: 'Hamstrings · Calves · Core', exercises: [
            { name: 'dumbbell romanian deadlift', sets: '4', reps: '8', badge: 'legs' },
            { name: 'bulgarian split squat', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'single leg calf raise', sets: '3', reps: '12', badge: 'legs' },
            { name: 'hanging leg raise', sets: '3', reps: '12', badge: 'core' },
            { name: 'push-up', sets: '3', reps: '15', badge: 'push' }
          ]}
        ];
      } else {
        workout = [
          { n: 'Day 1: Upper Power & Chest Compound', t: 'Chest · Back · Shoulders', exercises: [
            { name: 'barbell bench press', sets: '4', reps: '8', badge: 'push' },
            { name: 'barbell bent over row', sets: '4', reps: '8', badge: 'pull' },
            { name: 'standing dumbbell overhead press', sets: '3', reps: '10', badge: 'push' },
            { name: 'cable tricep pushdown', sets: '3', reps: '12', badge: 'push' }
          ]},
          { n: 'Day 2: Lower Power & Quad Focus', t: 'Quads · Hamstrings · Calves', exercises: [
            { name: 'barbell squat', sets: '4', reps: '8', badge: 'legs' },
            { name: 'barbell romanian deadlift', sets: '3', reps: '10', badge: 'legs' },
            { name: 'leg press', sets: '3', reps: '12', badge: 'legs' },
            { name: 'standing calf raises', sets: '4', reps: '15', badge: 'legs' }
          ]},
          { n: 'Day 3: Upper Hypertrophy & V-Taper', t: 'Incline Chest · Lats · Delts · Arms', exercises: [
            { name: 'incline dumbbell bench press', sets: '4', reps: '10', badge: 'push' },
            { name: 'lat pulldown', sets: '4', reps: '8', badge: 'pull' },
            { name: 'dumbbell lateral raise', sets: '4', reps: '12', badge: 'push' },
            { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' }
          ]},
          { n: 'Day 4: Lower Hypertrophy & Deadlift Power', t: 'Hamstrings · Quads · Core', exercises: [
            { name: 'barbell deadlift', sets: '4', reps: '6', badge: 'pull' },
            { name: 'dumbbell walking lunges', sets: '3', reps: '10 each', badge: 'legs' },
            { name: 'lying leg curls', sets: '3', reps: '12', badge: 'legs' },
            { name: 'hanging leg raise', sets: '3', reps: '12', badge: 'core' }
          ]}
        ];
      }
    }

    const plan = {
      kcal,
      protein,
      carbs,
      fat,
      bmi,
      goal,
      diet,
      coachNote: `${pname}, your 100% custom plan is engineered for ${goal.replace('_', ' ')}. With a daily target of ${kcal} kcal (${protein}g Protein · ${carbs}g Carbs · ${fat}g Fats) and a ${numDays}-day ${location === 'gym' ? 'Commercial Gym' : location === 'home' ? 'Home Dumbbells' : 'Calisthenics'} split, your protocol is configured for progressive overload.`,
      weeklyInsight: `Consistency is your superpower, ${pname}! Push your working sets with intensity. 🚀`,
      meals,
      workout,
      generatedAt: new Date().toISOString(),
      monthNumber: 1,
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json({ plan });

  } catch (err) {
    console.error('generate-plan error:', err);
    return res.status(500).json({ error: err.message });
  }
}
