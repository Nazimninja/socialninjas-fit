export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { answers } = req.body;
  if (!answers) return res.status(400).json({ error: 'No answers provided' });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const goalMap = { muscle: 'Muscle Gain', fat_loss: 'Fat Loss', weight_gain: 'Healthy Weight Gain', general: 'General Fitness' };
  const dietMap = { nonveg: 'Non-vegetarian (includes chicken, eggs, fish)', egg: 'Eggetarian (eggs only, no meat)', veg: 'Vegetarian (no eggs, no meat)', vegan: 'Vegan (plant-based only)' };

  const isFemale = answers.gender === 'female';
  const cycleNote = isFemale && answers.hasCycle === 'yes'
    ? `This client has a regular menstrual cycle of ${answers.cycleLength || 28} days. Consider cycle phase nutrition — higher iron during menstrual phase, higher carbs during follicular, peak protein during ovulation, magnesium-rich foods in luteal phase.`
    : '';

  const prompt = `You are an expert fitness and nutrition coach specializing in Indian clients. Create a highly personalized, science-backed fitness plan.

CLIENT PROFILE:
- Name: ${answers.pname}
- Age: ${answers.age} years
- Weight: ${answers.weight} kg
- Height: ${answers.height} cm
- Gender: ${answers.gender}
- Goal: ${goalMap[answers.goal]}
- Diet: ${dietMap[answers.diet]}
- Training location: ${answers.location === 'gym' ? 'Gym (has equipment)' : 'Home (bodyweight/minimal equipment)'}
- Available training days: ${answers.days} days per week
${cycleNote}

Calculate:
- BMR using Mifflin-St Jeor formula
- TDEE with activity factor based on ${answers.days} training days
- Calorie target for goal (deficit for fat loss, surplus for muscle/weight gain)
- Macro split: protein (2g/kg bodyweight min), carbs (45-55% total), fats (remaining)

Return ONLY a valid JSON object with this EXACT structure (no markdown, no explanation):
{
  "kcal": 2100,
  "protein": 140,
  "carbs": 220,
  "fat": 65,
  "bmi": 22.5,
  "goal": "${answers.goal}",
  "diet": "${answers.diet}",
  "coachNote": "2-3 sentence personalized insight about this client's specific situation",
  "meals": [
    {"t": "7:00 AM", "n": "Meal Name", "d": "Detailed Indian food description with quantities", "i": "🍳", "k": 450, "p": 35, "note": "Coach tip explaining why this meal matters"},
    {"t": "10:00 AM", "n": "Mid-Morning", "d": "...", "i": "🥗", "k": 280, "p": 18, "note": "..."},
    {"t": "1:00 PM", "n": "Lunch", "d": "...", "i": "🍱", "k": 580, "p": 42, "note": "..."},
    {"t": "4:00 PM", "n": "Evening Snack", "d": "...", "i": "🥜", "k": 250, "p": 15, "note": "..."},
    {"t": "7:30 PM", "n": "Dinner", "d": "...", "i": "🍛", "k": 480, "p": 30, "note": "..."},
    {"t": "9:30 PM", "n": "Before Bed", "d": "...", "i": "🥛", "k": 180, "p": 12, "note": "..."}
  ],
  "workout": [
    {"n": "Push Day", "t": "Chest · Shoulders · Triceps", "exercises": [
      {"name": "Bench Press", "sets": "4", "reps": "8-10", "badge": "push"},
      {"name": "Overhead Press", "sets": "3", "reps": "10-12", "badge": "push"},
      {"name": "Cable Flyes", "sets": "3", "reps": "12-15", "badge": "push"},
      {"name": "Tricep Pushdowns", "sets": "3", "reps": "12-15", "badge": "push"},
      {"name": "Lateral Raises", "sets": "3", "reps": "15-20", "badge": "push"}
    ]},
    {"n": "Pull Day", "t": "Back · Biceps", "exercises": [
      {"name": "Deadlift", "sets": "4", "reps": "5-6", "badge": "pull"},
      {"name": "Pull-Ups", "sets": "4", "reps": "6-10", "badge": "pull"},
      {"name": "Barbell Row", "sets": "3", "reps": "8-10", "badge": "pull"},
      {"name": "Face Pulls", "sets": "3", "reps": "15-20", "badge": "pull"},
      {"name": "Bicep Curls", "sets": "3", "reps": "12-15", "badge": "pull"}
    ]},
    {"n": "Leg Day", "t": "Quads · Hamstrings · Glutes", "exercises": [
      {"name": "Squats", "sets": "4", "reps": "8-10", "badge": "legs"},
      {"name": "Romanian Deadlift", "sets": "3", "reps": "10-12", "badge": "legs"},
      {"name": "Leg Press", "sets": "3", "reps": "12-15", "badge": "legs"},
      {"name": "Walking Lunges", "sets": "3", "reps": "12 each", "badge": "legs"},
      {"name": "Calf Raises", "sets": "4", "reps": "15-20", "badge": "legs"}
    ]},
    {"r": true, "n": "Rest", "t": "Recovery"},
    {"n": "Push Day B", "t": "Chest · Shoulders · Triceps", "exercises": [
      {"name": "Incline Dumbbell Press", "sets": "4", "reps": "10-12", "badge": "push"},
      {"name": "Dumbbell Shoulder Press", "sets": "3", "reps": "10-12", "badge": "push"},
      {"name": "Dips", "sets": "3", "reps": "10-15", "badge": "push"},
      {"name": "Skull Crushers", "sets": "3", "reps": "12-15", "badge": "push"},
      {"name": "Front Raises", "sets": "3", "reps": "12-15", "badge": "push"}
    ]},
    {"n": "Pull Day B", "t": "Back · Biceps · Rear Delts", "exercises": [
      {"name": "Seated Cable Row", "sets": "4", "reps": "10-12", "badge": "pull"},
      {"name": "Lat Pulldown", "sets": "3", "reps": "10-12", "badge": "pull"},
      {"name": "Single Arm Dumbbell Row", "sets": "3", "reps": "10-12 each", "badge": "pull"},
      {"name": "Reverse Flyes", "sets": "3", "reps": "15-20", "badge": "pull"},
      {"name": "Hammer Curls", "sets": "3", "reps": "12-15", "badge": "pull"}
    ]},
    {"r": true, "n": "Rest", "t": "Recovery"}
  ]
}

Tailor the meals specifically for Indian cuisine and the ${dietMap[answers.diet]} diet. Make meals practical, affordable, and achievable for an Indian household.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');

    const content = data.choices[0].message.content.trim();
    // Strip any markdown if present
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const plan = JSON.parse(jsonStr);

    // Add metadata
    plan.generatedAt = new Date().toISOString();
    plan.monthNumber = 1;
    plan.lastUpdated = new Date().toISOString();

    res.status(200).json({ plan });
  } catch (err) {
    console.error('generate-plan error:', err);
    res.status(500).json({ error: err.message });
  }
}
