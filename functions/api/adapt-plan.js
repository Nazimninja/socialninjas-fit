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

    const GEMINI_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    const OPENAI_KEY = env.OPENAI_API_KEY;

    const weights = weeklyWeights || [];
    const startWeight = weights[0] || answers.weight;
    const currentWeight = weights[weights.length - 1] || startWeight;
    const weightChange = parseFloat((currentWeight - startWeight).toFixed(1));
    const weeks = weights.length;

    let workoutText = '';
    if (workoutSummary && workoutSummary.length > 0) {
      const recent = workoutSummary.slice(-5);
      workoutText = `\nRECENT WORKOUT PERFORMANCE (last ${recent.length} sessions):\n${recent.map(w => `- ${w.name || 'Workout'} on ${w.date}: ${w.setsCompleted}/${w.setsTotal} sets completed`).join('\n')}`;
    }

    let checkinText = '';
    if (checkin) {
      const difficultyMap = { easy: '😅 Too Easy', good: '💪 Just Right', hard: '😤 Too Hard' };
      const sorenessMap = { fresh: '😌 No Soreness', mild: '😐 Mild Soreness', sore: '😣 Very Sore' };
      checkinText = `\nPOST-WORKOUT CHECK-IN:\n- Difficulty: ${difficultyMap[checkin.difficulty] || checkin.difficulty}\n- Soreness: ${sorenessMap[checkin.soreness] || checkin.soreness}`;
    }

    const prompt = `You are an elite AI fitness coach doing a weekly check-in review.
Analyze client progress and adapt their nutrition & training plan.

CLIENT: ${answers.pname}, ${answers.gender}, ${answers.age}y, Goal: ${answers.goal}, Diet: ${answers.diet}
CURRENT PLAN: ${currentPlan.kcal} kcal/day, ${currentPlan.protein}g protein, ${currentPlan.carbs}g carbs, ${currentPlan.fat}g fat
WEIGHT HISTORY (${weeks} points): ${weights.join(' → ')} kg (Total change: ${weightChange > 0 ? '+' : ''}${weightChange} kg)
${workoutText}
${checkinText}

ADAPTATION RULES:
- Fat Loss: if stalled (<0.2kg change over 2 weeks), reduce -100 kcal from carbs. If losing >0.8kg/week, +100 kcal.
- Muscle Gain: if no gain in 2 weeks, +150 kcal.
- If difficulty = "easy": recommend adding weight/reps.
- If difficulty = "hard": suggest 10% deload.
- If soreness = "sore": recommend extra rest day.

Return ONLY valid JSON matching this schema:
{
  "kcal": ${currentPlan.kcal},
  "protein": ${currentPlan.protein},
  "carbs": ${currentPlan.carbs},
  "fat": ${currentPlan.fat},
  "coachNote": "Warm, personalized 2-3 sentence analysis of their specific progress",
  "changes": ["Specific change 1", "Specific change 2"],
  "weeklyInsight": "One energetic, personalized encouragement sentence",
  "celebration": "One congratulatory sentence if they progressed, or empty string",
  "meals": [
    {"id": "m1", "slot": "Breakfast", "time": "8:00 AM", "title": "...", "note": "...", "icon": "🍳", "kcal": ${Math.round(currentPlan.kcal * 0.28)}, "protein": ${Math.round(currentPlan.protein * 0.28)}, "carbs": ${Math.round(currentPlan.carbs * 0.28)}, "fat": ${Math.round(currentPlan.fat * 0.28)}}
  ]
}`;

    // Try Gemini
    if (GEMINI_KEY) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 3000, responseMimeType: 'application/json' }
          })
        });
        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const cleanJson = (gData?.candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/```json\n?|\n?```/g, '').trim();
          const updatedPlan = JSON.parse(cleanJson);
          updatedPlan.lastUpdated = new Date().toISOString();
          updatedPlan.monthNumber = (currentPlan.monthNumber || 1) + 1;
          updatedPlan.goal = currentPlan.goal || answers.goal;
          updatedPlan.diet = currentPlan.diet || answers.diet;
          updatedPlan.aiGenerated = true;
          updatedPlan.aiEngine = 'gemini-3.6-flash';
          return new Response(JSON.stringify({ plan: updatedPlan }), { headers, status: 200 });
        }
      } catch (gErr) {
        console.warn('Gemini adapt-plan warning:', gErr);
      }
    }

    // Try OpenAI
    if (OPENAI_KEY) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 2500,
            response_format: { type: 'json_object' }
          })
        });
        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const cleanJson = data.choices[0].message.content.trim().replace(/```json\n?|\n?```/g, '').trim();
          const updatedPlan = JSON.parse(cleanJson);
          updatedPlan.lastUpdated = new Date().toISOString();
          updatedPlan.monthNumber = (currentPlan.monthNumber || 1) + 1;
          updatedPlan.goal = currentPlan.goal || answers.goal;
          updatedPlan.diet = currentPlan.diet || answers.diet;
          updatedPlan.aiGenerated = true;
          updatedPlan.aiEngine = 'gpt-4o';
          return new Response(JSON.stringify({ plan: updatedPlan }), { headers, status: 200 });
        }
      } catch (oErr) {
        console.warn('OpenAI adapt-plan warning:', oErr);
      }
    }

    // Static fallback
    const updatedPlan = { ...currentPlan };
    updatedPlan.lastUpdated = new Date().toISOString();
    updatedPlan.coachNote = `Keep up the consistent work, ${answers.pname || 'Athlete'}! Your body is adapting nicely.`;
    return new Response(JSON.stringify({ plan: updatedPlan }), { headers, status: 200 });

  } catch (err) {
    console.error('adapt-plan error:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}
