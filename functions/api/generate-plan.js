export async function onRequest(context) {
  const { request, env } = context;

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
      diet = 'nonveg'
    } = answers;

    const OPENAI_KEY = env.OPENAI_API_KEY;

    if (OPENAI_KEY) {
      try {
        const goalMap = { muscle: 'Muscle Gain', fat_loss: 'Fat Loss', recomp: 'Body Recomposition', strength: 'Strength & Power', general: 'General Fitness' };
        const dietMap = { nonveg: 'Non-vegetarian (includes chicken, eggs, fish)', egg: 'Eggetarian (eggs only, no meat)', veg: 'Vegetarian (no eggs, no meat)', vegan: 'Vegan (plant-based only)' };

        const prompt = `You are an expert fitness and nutrition coach specializing in Indian clients. Create a highly personalized, science-backed fitness plan.

CLIENT PROFILE:
- Name: ${pname}
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- Gender: ${gender}
- Goal: ${goalMap[goal] || goal}
- Diet: ${dietMap[diet] || diet}
- Training location: ${location === 'gym' ? 'Gym' : 'Home'}
- Training days: ${days} days per week

Calculate:
- BMR using Mifflin-St Jeor formula
- TDEE with activity factor based on ${days} training days
- Calorie target for goal (deficit for fat loss, surplus for muscle/weight gain)
- Macro split: protein (2g/kg bodyweight min), carbs (45-55% total), fats (remaining)

Return ONLY a valid JSON object with this EXACT structure (no markdown, no explanation):
{
  "kcal": 2100,
  "protein": 140,
  "carbs": 220,
  "fat": 65,
  "bmi": 22.5,
  "goal": "${goal}",
  "diet": "${diet}",
  "coachNote": "2-3 sentence personalized insight about this client's specific situation",
  "meals": [
    {"t": "8:00 AM", "n": "Breakfast", "d": "Detailed Indian food description with quantities", "i": "🍳", "k": 450, "p": 35, "note": "Coach tip"},
    {"t": "11:30 AM", "n": "Mid-Morning", "d": "...", "i": "🥗", "k": 280, "p": 18, "note": "..."},
    {"t": "1:30 PM", "n": "Lunch", "d": "...", "i": "🍱", "k": 580, "p": 42, "note": "..."},
    {"t": "5:00 PM", "n": "Pre-Workout Snack", "d": "...", "i": "⚡", "k": 250, "p": 15, "note": "..."},
    {"t": "8:30 PM", "n": "Dinner", "d": "...", "i": "🍛", "k": 480, "p": 30, "note": "..."}
  ],
  "workout": [
    {"n": "Push Day", "t": "Chest · Shoulders · Triceps", "exercises": [
      {"name": "barbell bench press", "sets": "4", "reps": "8-10", "badge": "push"},
      {"name": "dumbbell incline bench press", "sets": "3", "reps": "10-12", "badge": "push"},
      {"name": "standing dumbbell overhead press", "sets": "3", "reps": "10-12", "badge": "push"},
      {"name": "dumbbell lateral raise", "sets": "3", "reps": "12-15", "badge": "push"},
      {"name": "cable tricep pushdown", "sets": "3", "reps": "12-15", "badge": "push"}
    ]},
    {"n": "Pull Day", "t": "Back · Biceps", "exercises": [
      {"name": "barbell deadlift", "sets": "4", "reps": "6-8", "badge": "pull"},
      {"name": "pull-up", "sets": "4", "reps": "6-10", "badge": "pull"},
      {"name": "barbell bent over row", "sets": "3", "reps": "8-10", "badge": "pull"},
      {"name": "cable seated row", "sets": "3", "reps": "10-12", "badge": "pull"},
      {"name": "dumbbell alternate bicep curl", "sets": "3", "reps": "12-15", "badge": "pull"}
    ]},
    {"n": "Leg Day", "t": "Quads · Hamstrings · Calves", "exercises": [
      {"name": "barbell squat", "sets": "4", "reps": "8-10", "badge": "legs"},
      {"name": "barbell romanian deadlift", "sets": "3", "reps": "10-12", "badge": "legs"},
      {"name": "leg press", "sets": "3", "reps": "12-15", "badge": "legs"},
      {"name": "dumbbell walking lunges", "sets": "3", "reps": "12 each", "badge": "legs"},
      {"name": "standing calf raises", "sets": "4", "reps": "15-20", "badge": "legs"}
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
            max_tokens: 3000
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
          return new Response(JSON.stringify({ plan }), { headers, status: 200 });
        }
      } catch (aiErr) {
        console.warn('OpenAI call failed, falling back to smart local plan calculation:', aiErr);
      }
    }

    // Fallback: Smart Science-Backed Generator
    const numAge = Number(age) || 25;
    const numWeight = Number(weight) || 72;
    const numHeight = Number(height) || 175;
    const numDays = Number(days) || 4;

    let bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * numAge) + (gender === 'female' ? -161 : 5);
    const actMap = { 2: 1.35, 3: 1.45, 4: 1.55, 5: 1.65, 6: 1.75 };
    const tdee = Math.round(bmr * (actMap[numDays] || 1.55));

    let kcal = tdee;
    if (goal === 'fat_loss') kcal = Math.round(tdee - 450);
    else if (goal === 'muscle') kcal = Math.round(tdee + 350);
    else if (goal === 'strength') kcal = Math.round(tdee + 250);
    else if (goal === 'recomp') kcal = Math.round(tdee - 100);

    const protein = Math.round(numWeight * (goal === 'fat_loss' || goal === 'recomp' ? 2.2 : 2.0));
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

    const workout = [
      { n: 'Push Day', t: 'Chest · Shoulders · Triceps', exercises: [
        { name: 'barbell bench press', sets: '4', reps: '8', badge: 'push' },
        { name: 'dumbbell incline bench press', sets: '3', reps: '10', badge: 'push' },
        { name: 'standing dumbbell overhead press', sets: '3', reps: '10', badge: 'push' },
        { name: 'dumbbell lateral raise', sets: '3', reps: '12', badge: 'push' },
        { name: 'cable tricep pushdown', sets: '3', reps: '12', badge: 'push' }
      ]},
      { n: 'Pull Day', t: 'Back · Biceps', exercises: [
        { name: 'barbell deadlift', sets: '4', reps: '6', badge: 'pull' },
        { name: 'pull-up', sets: '4', reps: '8', badge: 'pull' },
        { name: 'barbell bent over row', sets: '3', reps: '10', badge: 'pull' },
        { name: 'cable seated row', sets: '3', reps: '10', badge: 'pull' },
        { name: 'dumbbell alternate bicep curl', sets: '3', reps: '12', badge: 'pull' }
      ]},
      { n: 'Leg Day', t: 'Quads · Hamstrings · Calves', exercises: [
        { name: 'barbell squat', sets: '4', reps: '8', badge: 'legs' },
        { name: 'barbell romanian deadlift', sets: '3', reps: '10', badge: 'legs' },
        { name: 'leg press', sets: '3', reps: '12', badge: 'legs' },
        { name: 'dumbbell walking lunges', sets: '3', reps: '12 each', badge: 'legs' },
        { name: 'standing calf raises', sets: '4', reps: '15', badge: 'legs' }
      ]}
    ];

    const plan = {
      kcal,
      protein,
      carbs,
      fat,
      bmi,
      goal,
      diet,
      coachNote: `${pname}, your personalized plan is engineered for ${goal}. With a target of ${kcal} kcal (${protein}g Protein · ${carbs}g Carbs · ${fat}g Fats) and your ${numDays}-day ${location === 'gym' ? 'Gym' : 'Home'} routine, you will maximize muscle retention and progression.`,
      weeklyInsight: `Consistency is your superpower, ${pname}! Execute this week’s sessions with progressive overload. 🚀`,
      meals,
      workout,
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
