// ═══════════════════════════════════════════════
// PLAN GENERATION ENGINE
// ═══════════════════════════════════════════════

function generatePlan(answers) {
  var w = parseFloat(answers.weight || 70);
  var h = parseFloat(answers.height || 170) / 100;
  var age = parseInt(answers.age || 25);
  var isMale = answers.gender === 'male';

  // BMR — Mifflin-St Jeor
  var bmr = isMale
    ? (10 * w + 6.25 * 100 * h - 5 * age + 5)
    : (10 * w + 6.25 * 100 * h - 5 * age - 161);

  var multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725 };
  var tdee = Math.round(bmr * (multipliers[answers.activity] || 1.375));

  var kcal, p, f, c;
  var goal = answers.goal || 'general';

  // Adjust protein slightly for veg/vegan (needs more variety)
  var proteinFactor = (answers.diet === 'veg' || answers.diet === 'vegan') ? 1.8 : 2.0;

  switch (goal) {
    case 'muscle':
      kcal = tdee + 300;
      p = Math.round(w * proteinFactor);
      f = Math.round(w * 0.9);
      c = Math.max(150, Math.round((kcal - p * 4 - f * 9) / 4));
      break;
    case 'fat_loss':
      kcal = Math.max(1200, tdee - 450);
      p = Math.round(w * (proteinFactor + 0.2)); // Higher protein on cut
      f = Math.round(w * 0.75);
      c = Math.max(80, Math.round((kcal - p * 4 - f * 9) / 4));
      break;
    case 'weight_gain':
      kcal = tdee + 500;
      p = Math.round(w * proteinFactor);
      f = Math.round(w * 1.2); // Higher fat for calorie density
      c = Math.max(180, Math.round((kcal - p * 4 - f * 9) / 4));
      break;
    default: // general
      kcal = tdee;
      p = Math.round(w * 1.6);
      f = Math.round(w * 0.8);
      c = Math.max(120, Math.round((kcal - p * 4 - f * 9) / 4));
  }

  var bmi = Math.round(w / (h * h) * 10) / 10;

  // Pick workout program key
  var loc = answers.location || 'gym';
  var days = parseInt(answers.days || 5);
  var programKey;
  if (loc === 'home') {
    programKey = days >= 4 ? 'home_4' : 'home_3';
  } else {
    programKey = days >= 5 ? 'gym_5' : days === 4 ? 'gym_4' : 'gym_3';
  }

  // Get meal plan
  var diet = answers.diet || 'nonveg';
  var meals = (MEAL_PLANS[diet] && MEAL_PLANS[diet][goal])
    ? MEAL_PLANS[diet][goal]
    : MEAL_PLANS['nonveg']['general'];

  // Scale meal kcal to match target
  var rawTotal = meals.reduce(function(a, m) { return a + m.k; }, 0);
  var scaleFactor = kcal / rawTotal;
  meals = meals.map(function(m) {
    return Object.assign({}, m, {
      k: Math.round(m.k * scaleFactor),
      p: Math.round(m.p * (p / meals.reduce(function(a, x) { return a + x.p; }, 0)))
    });
  });

  // Get workout
  var workout = buildWorkoutFromProgram(programKey);

  // Water target
  var waterTarget = goal === 'fat_loss' ? 8 : goal === 'weight_gain' ? 10 : 14;

  return {
    kcal: kcal, protein: p, fat: f, carbs: c,
    tdee: tdee, bmi: bmi,
    weight: w, height: Math.round(h * 100), age: age,
    goal: goal, diet: diet, location: loc, days: days,
    programKey: programKey,
    meals: meals, workout: workout,
    waterTarget: waterTarget,
    createdAt: new Date().toISOString(),
    monthNumber: 1
  };
}

function buildWorkoutFromProgram(programKey) {
  var program = WORKOUT_PROGRAMS[programKey] || WORKOUT_PROGRAMS['gym_5'];
  return program.map(function(day) {
    return {
      n: day.n,
      t: day.t,
      r: day.r,
      exercises: day.exKeys.map(function(key) {
        var ex = EXERCISES[key];
        if (!ex) return null;
        var scheme = SET_SCHEMES[ex.b] || SET_SCHEMES['push'];
        return {
          key: key,
          name: ex.n,
          badge: ex.b,
          sets: scheme.sets,
          reps: scheme.reps,
          rest: scheme.rest,
          tip: ex.cues[0] || '',
          ytId: ex.ytId,
          muscles: ex.muscles,
          cues: ex.cues
        };
      }).filter(Boolean)
    };
  });
}

// ═══════════════════════════════════════════════
// MONTHLY PLAN UPDATE ENGINE
// ═══════════════════════════════════════════════
function generateMonthlyUpdate(state) {
  var plan = state.profile.plan;
  var weights = state.weights || [];
  var month = plan.monthNumber || 1;

  if (weights.length < 2) {
    return {
      canUpdate: true,
      month: month + 1,
      totalChange: 0,
      weeklyRate: 0,
      feedback: 'Welcome to Month ' + (month + 1) + '! We have successfully updated your plan for the next month. Since you have logged fewer than 2 weight entries, we kept your current calorie and macro targets intact. To unlock personalized target adjustments next month, make sure to log your weight every Monday morning.',
      changes: [],
      nextSteps: [
        'Set a weekly calendar reminder to log your weight every Monday',
        'Ensure you log your primary lifts to track progressive overload',
        'Aim to hit your daily water and sleep targets consistently'
      ],
      workoutProgression: plan.location === 'home' ? 'Excellent home training consistency. This month, consider joining a gym to unlock the next level of progression.' : 'You\'ve completed Month ' + month + ' of the ' + plan.days + '-day program. Focus on increasing weights on all main lifts this month.',
      newKcal: plan.kcal,
      newProtein: plan.protein,
      newFat: plan.fat,
      newCarbs: plan.carbs
    };
  }

  var startW = weights[0];
  var currentW = weights[weights.length - 1];
  var totalChange = parseFloat((currentW - startW).toFixed(1));
  var weeklyRate = parseFloat((totalChange / Math.max(1, weights.length - 1)).toFixed(2));

  var goal = plan.goal;
  var newKcal = plan.kcal;
  var newProtein = plan.protein;
  var changes = [];
  var feedback = '';
  var nextSteps = [];

  if (goal === 'muscle') {
    if (weeklyRate < 0.2) {
      newKcal += 200;
      changes.push({ label: 'Calories', from: plan.kcal, to: newKcal, reason: 'Weight gain too slow — adding 200 kcal' });
      feedback = 'You gained ' + totalChange + 'kg in ' + (weights.length - 1) + ' weeks — below the 0.3–0.5kg/week target. Increasing calories. Add an extra banana + peanut butter to your evening snack.';
    } else if (weeklyRate > 0.6) {
      newKcal -= 150;
      changes.push({ label: 'Calories', from: plan.kcal, to: newKcal, reason: 'Gaining too fast — reducing 150 kcal to minimize fat gain' });
      feedback = 'You gained ' + totalChange + 'kg in ' + (weights.length - 1) + ' weeks — slightly above target. Reducing dinner carbs slightly to keep gains lean.';
    } else {
      feedback = 'Excellent — you gained ' + totalChange + 'kg at ' + weeklyRate + 'kg/week. This is the ideal lean bulk rate. Keeping plan the same.';
    }
    nextSteps = [
      'Add 2.5kg to your bench press and squat this month',
      'Focus on progressive overload — write down every weight lifted',
      'Take a deload week if you\'ve trained 8+ weeks consecutively'
    ];
  } else if (goal === 'fat_loss') {
    if (weeklyRate > -0.2) {
      newKcal -= 150;
      changes.push({ label: 'Calories', from: plan.kcal, to: newKcal, reason: 'Fat loss stalled — reducing 150 kcal' });
      feedback = 'You lost ' + Math.abs(totalChange) + 'kg in ' + (weights.length - 1) + ' weeks — below target. Reducing dinner carbs slightly and adding one HIIT session.';
    } else if (weeklyRate < -0.7) {
      newKcal += 100;
      newProtein += 10;
      changes.push({ label: 'Calories', from: plan.kcal, to: newKcal, reason: 'Losing too fast — protect muscle mass' });
      changes.push({ label: 'Protein', from: plan.protein, to: newProtein, reason: 'Increase protein to preserve muscle during aggressive cut' });
      feedback = 'You lost ' + Math.abs(totalChange) + 'kg in ' + (weights.length - 1) + ' weeks — faster than ideal. You may be losing muscle. Increasing protein and adding small calories to protect your muscle.';
    } else {
      feedback = 'Excellent — you lost ' + Math.abs(totalChange) + 'kg at ' + Math.abs(weeklyRate) + 'kg/week. Perfect fat loss pace. Keeping plan the same.';
    }
    nextSteps = [
      'Increase cardio by 5 minutes this month',
      'Track every meal accurately — portion creep is the enemy',
      'Take a diet break (eat at maintenance) for 1 week if you\'ve been in deficit 8+ weeks'
    ];
  } else if (goal === 'weight_gain') {
    if (weeklyRate < 0.3) {
      newKcal += 300;
      changes.push({ label: 'Calories', from: plan.kcal, to: newKcal, reason: 'Weight gain too slow — adding 300 kcal' });
      feedback = 'You gained ' + totalChange + 'kg in ' + (weights.length - 1) + ' weeks — below target. Adding extra 300 kcal through calorie-dense foods: dates, peanut butter, ghee.';
    } else {
      feedback = 'Progress! You gained ' + totalChange + 'kg. Keep eating consistently and see a doctor to monitor health markers.';
    }
    nextSteps = [
      'Book a doctor appointment this month to check blood panel',
      'Add 1 more banana per day to your current plan',
      'Increase curd from 200g to 300g daily'
    ];
  } else {
    feedback = 'Good consistency! Month ' + (month + 1) + ' — keeping your balanced plan the same. Focus on building habits.';
    nextSteps = [
      'Add one new workout day this month if you have capacity',
      'Try meal prepping on Sunday for the first time',
      'Increase water intake by 2 glasses per day'
    ];
  }

  // Workout progression
  var workoutProgression = '';
  if (month >= 2 && plan.location !== 'home') {
    if (plan.days < 5) {
      workoutProgression = 'Consider adding 1 extra training day — you\'ve built the habit, now increase the volume.';
    } else {
      workoutProgression = 'You\'ve completed Month ' + month + ' of the ' + plan.days + '-day program. Focus on increasing weights on all main lifts this month.';
    }
  } else if (plan.location === 'home' && month >= 2) {
    workoutProgression = 'Excellent home training consistency. This month, consider joining a gym to unlock the next level of progression.';
  }

  return {
    canUpdate: true,
    month: month + 1,
    totalChange: totalChange,
    weeklyRate: weeklyRate,
    feedback: feedback,
    changes: changes,
    nextSteps: nextSteps,
    workoutProgression: workoutProgression,
    newKcal: newKcal,
    newProtein: newProtein,
    newFat: plan.fat,
    newCarbs: Math.max(100, Math.round((newKcal - newProtein * 4 - plan.fat * 9) / 4))
  };
}

function applyUpdate(update) {
  var plan = STATE.profile.plan;
  plan.kcal = update.newKcal;
  plan.protein = update.newProtein;
  plan.fat = update.newFat;
  plan.carbs = update.newCarbs;
  plan.monthNumber = update.month;
  plan.lastUpdated = new Date().toISOString();

  // Scale meals to new calorie target
  var meals = plan.meals;
  var rawTotal = meals.reduce(function(a, m) { return a + m.k; }, 0);
  var scaleFactor = update.newKcal / rawTotal;
  plan.meals = meals.map(function(m) {
    return Object.assign({}, m, { k: Math.round(m.k * scaleFactor) });
  });

  save();
}
