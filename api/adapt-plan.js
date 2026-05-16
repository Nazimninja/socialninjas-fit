export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { answers, currentPlan, weeklyWeights } = req.body;
  if (!answers || !currentPlan) return res.status(400).json({ error: 'Missing data' });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const weights = weeklyWeights || [];
  const startWeight = weights[0] || answers.weight;
  const currentWeight = weights[weights.length - 1] || startWeight;
  const weightChange = parseFloat((currentWeight - startWeight).toFixed(1));
  const weeks = weights.length;

  const prompt = `You are an expert fitness coach doing a weekly plan review. Analyze progress and adapt the plan.

CLIENT: ${answers.pname}, ${answers.gender}, ${answers.age}y, Goal: ${answers.goal}, Diet: ${answers.diet}
TRAINING: ${answers.location === 'gym' ? 'Gym' : 'Home'} (${answers.equipment || 'None'})
ORIGINAL PLAN: ${currentPlan.kcal} kcal/day, ${currentPlan.protein}g protein, ${currentPlan.carbs}g carbs, ${currentPlan.fat}g fat

WEIGHT HISTORY (last ${weeks} weeks): ${weights.join(' → ')} kg
TOTAL CHANGE: ${weightChange > 0 ? '+' : ''}${weightChange} kg over ${weeks} weeks

Analyze:
- Is progress on track for their goal? (${answers.goal})
- Fat loss target: ~0.5kg/week. Muscle gain: ~0.25kg/week. Weight gain: ~0.5kg/week.
- If stalled (< 0.2kg change/week for 2+ weeks): adjust calories/macros
- If losing too fast: increase calories
- If gaining too fast (fat loss goal): reduce more

Return ONLY a valid JSON object (no markdown):
{
  "kcal": 2050,
  "protein": 145,
  "carbs": 210,
  "fat": 63,
  "coachNote": "Personalized 3-4 sentence analysis of their progress with specific actionable advice",
  "changes": ["Reduced carbs by 15g due to weight plateau", "Added 5g protein to preserve muscle"],
  "weeklyInsight": "One encouraging sentence acknowledging their effort",
  "meals": [same structure as before with 6 meals tailored to their diet],
  "workout": [same 7-day structure as before adapted if needed]
}`;

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
        temperature: 0.6,
        max_tokens: 3000
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');

    const content = data.choices[0].message.content.trim();
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const updatedPlan = JSON.parse(jsonStr);

    updatedPlan.lastUpdated = new Date().toISOString();
    updatedPlan.monthNumber = (currentPlan.monthNumber || 1) + 1;
    updatedPlan.goal = currentPlan.goal;
    updatedPlan.diet = currentPlan.diet;

    res.status(200).json({ plan: updatedPlan });
  } catch (err) {
    console.error('adapt-plan error:', err);
    res.status(500).json({ error: err.message });
  }
}
