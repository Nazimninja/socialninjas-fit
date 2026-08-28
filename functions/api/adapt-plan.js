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
    const { answers, currentPlan, weeklyWeights, workoutSummary, checkin } = body || {};
    if (!answers || !currentPlan) {
      return new Response(JSON.stringify({ error: 'Missing data' }), { headers, status: 400 });
    }

    const OPENAI_KEY = env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { headers, status: 500 });
    }

    const weights = weeklyWeights || [];
    const startWeight = weights[0] || answers.weight;
    const currentWeight = weights[weights.length - 1] || startWeight;
    const weightChange = parseFloat((currentWeight - startWeight).toFixed(1));
    const weeks = weights.length;

    // Build workout performance summary text
    let workoutText = '';
    if (workoutSummary && workoutSummary.length > 0) {
      const recent = workoutSummary.slice(-5);
      workoutText = `
RECENT WORKOUT PERFORMANCE (last ${recent.length} sessions):
${recent.map(w => `- ${w.name || 'Workout'} on ${w.date}: ${w.setsCompleted}/${w.setsTotal} sets completed, top weights: ${(w.topWeights || []).slice(0,3).map(x => `${x.exercise} ${x.weight}kg`).join(', ')}`).join('\n')}
Completion rate: ${workoutSummary.filter(w => w.completed).length}/${workoutSummary.length} workouts completed`;
    }

    // Build check-in summary
    let checkinText = '';
    if (checkin) {
      const difficultyMap = { easy: '😅 Too Easy', good: '💪 Just Right', hard: '😤 Too Hard' };
      const sorenessMap = { fresh: '😌 No Soreness', mild: '😐 Mild Soreness', sore: '😣 Very Sore' };
      checkinText = `
POST-WORKOUT CHECK-IN (most recent):
- Difficulty: ${difficultyMap[checkin.difficulty] || checkin.difficulty}
- Soreness/Recovery: ${sorenessMap[checkin.soreness] || checkin.soreness}`;
      if (checkin.difficulty === 'easy') checkinText += '\n→ Weights feel too light, ready for progression';
      if (checkin.difficulty === 'hard') checkinText += '\n→ Client is struggling, may need deload or volume reduction';
      if (checkin.soreness === 'sore') checkinText += '\n→ Recovery is slow, consider extra rest day or reduce volume';
    }

    const prompt = `You are an expert AI fitness coach doing a real-time plan review. A client just logged new data. Analyze their progress immediately and adapt their plan with specific actionable changes.

CLIENT: ${answers.pname}, ${answers.gender}, ${answers.age}y, Goal: ${answers.goal}, Diet: ${answers.diet}
TRAINING: ${answers.location === 'gym' ? 'Gym (full equipment)' : 'Home (dumbbells & bodyweight)'}
CURRENT PLAN: ${currentPlan.kcal} kcal/day, ${currentPlan.protein}g protein, ${currentPlan.carbs}g carbs, ${currentPlan.fat}g fat

WEIGHT HISTORY (${weeks} data points): ${weights.join(' → ')} kg
TOTAL CHANGE: ${weightChange > 0 ? '+' : ''}${weightChange} kg
${workoutText}
${checkinText}

ADAPTATION RULES (apply strictly):
- Fat Loss goal: target 0.4-0.6 kg/week loss. If stalled (<0.2 kg change over 2+ weeks): -100 kcal from carbs. If losing >0.8 kg/week: +100 kcal. Protect muscle: keep protein ≥ 2g/kg.
- Muscle Gain goal: target 0.2-0.3 kg/week gain. If no gain in 2+ weeks: +150 kcal. If gaining >0.5 kg/week: -100 kcal (too much fat).
- Recomp: keep same calories, adjust protein higher if soreness is persistent.
- If difficulty check-in = "easy" for 2+ sessions: suggest progressive overload (add weight or reps).
- If difficulty check-in = "hard": suggest deload this week (reduce weights by 10%, same reps).
- If soreness = "sore": add 1 rest day recommendation.
- Workout completion < 80%: simplify plan, reduce volume.

Be a warm, encouraging coach. Celebrate progress. Be specific about what changed and why.

Return ONLY valid JSON (no markdown, no explanation):
{
  "kcal": 2050,
  "protein": 145,
  "carbs": 210,
  "fat": 63,
  "coachNote": "Warm, personalized 2-3 sentence analysis of their specific progress with concrete observations",
  "changes": ["Reduced carbs by 20g because weight has been stalling for 2 weeks", "Protein kept high to preserve your muscle gains"],
  "weeklyInsight": "One energetic, personalized encouragement sentence with emoji",
  "celebration": "One congratulatory sentence if they hit a milestone (PRs, streak, weight goal progress), or empty string",
  "meals": [
    {"t": "7:00 AM", "n": "Breakfast", "d": "Detailed food with quantities tailored to their diet", "i": "🍳", "k": 420, "p": 35, "note": "Coach tip"},
    {"t": "10:30 AM", "n": "Mid-Morning", "d": "...", "i": "🥗", "k": 250, "p": 18, "note": "..."},
    {"t": "1:00 PM", "n": "Lunch", "d": "...", "i": "🍱", "k": 550, "p": 40, "note": "..."},
    {"t": "4:00 PM", "n": "Pre-Workout", "d": "...", "i": "⚡", "k": 220, "p": 15, "note": "..."},
    {"t": "7:30 PM", "n": "Dinner", "d": "...", "i": "🍛", "k": 480, "p": 32, "note": "..."},
    {"t": "9:30 PM", "n": "Night Snack", "d": "...", "i": "🥛", "k": 150, "p": 12, "note": "..."}
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
        temperature: 0.6,
        max_tokens: 2500
      })
    });

    const data = await openAiResponse.json();
    if (!openAiResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI API error' }), { headers, status: openAiResponse.status });
    }

    const content = data.choices[0].message.content.trim();
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const updatedPlan = JSON.parse(jsonStr);

    updatedPlan.lastUpdated = new Date().toISOString();
    updatedPlan.monthNumber = (currentPlan.monthNumber || 1) + 1;
    updatedPlan.goal = currentPlan.goal || answers.goal;
    updatedPlan.diet = currentPlan.diet || answers.diet;

    return new Response(JSON.stringify({ plan: updatedPlan }), { headers, status: 200 });
  } catch (err) {
    console.error('adapt-plan error:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}
