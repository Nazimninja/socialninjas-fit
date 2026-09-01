import React, { useState } from 'react';
import { useStore } from '../store/useStore.js';
import Icon from '../components/Icon.jsx';
import { useUI } from '../store/useUI.js';
import { api } from '../lib/api.js';
import { t } from '../lib/i18n.js';
import { todayISO } from '../lib/format.js';

// Curated High-Protein Recipes for Reference
const RECIPES_DB = [
  {
    id: 'r1',
    title: 'Tandoori Grilled Chicken Breast & Brown Rice',
    type: 'nonveg',
    time: '25 mins',
    kcal: 520,
    protein: 48,
    carbs: 45,
    fat: 12,
    ingredients: [
      '200g Skinless Chicken Breast (sliced)',
      '100g Cooked Brown Rice / Quinoa',
      '2 tbsp Low-Fat Curd / Greek Yogurt',
      '1 tsp Ginger-Garlic Paste & Tandoori Masala',
      '1/2 Lemon & Fresh Coriander'
    ],
    instructions: [
      'Marinate sliced chicken in curd, ginger-garlic paste, tandoori masala, salt, and lemon for 15 mins.',
      'Pan-sear or air-fry at 200°C for 12-14 mins until golden and juicy.',
      'Serve warm alongside 100g steamed brown rice and mixed cucumbers.'
    ]
  },
  {
    id: 'r2',
    title: 'High-Protein Paneer Bhurji & Multigrain Roti',
    type: 'veg',
    time: '15 mins',
    kcal: 460,
    protein: 34,
    carbs: 38,
    fat: 18,
    ingredients: [
      '150g Low-Fat Paneer (crumbled)',
      '1 Medium Multigrain Roti / Chapati',
      '1 Chopped Onion, Tomato, & Green Chili',
      '1 tsp Olive Oil / Desi Ghee',
      'Turmeric, Cumin Seeds, & Fresh Coriander'
    ],
    instructions: [
      'Heat oil/ghee in a pan with cumin seeds, onions, and tomatoes until soft.',
      'Add turmeric, chili powder, and crumbled low-fat paneer.',
      'Sauté on medium heat for 4-5 mins. Garnish with coriander and serve with warm roti.'
    ]
  },
  {
    id: 'r3',
    title: 'Egg White Masala Scramble & Oats',
    type: 'egg',
    time: '10 mins',
    kcal: 380,
    protein: 36,
    carbs: 42,
    fat: 7,
    ingredients: [
      '4 Egg Whites + 1 Whole Egg',
      '45g Rolled Oats (cooked in water or unsweetened almond milk)',
      '1/2 Bell Pepper, Onion, & Baby Spinach',
      '1 pinch Cinnamon & Salt'
    ],
    instructions: [
      'Whisk egg whites with whole egg, salt, and pepper.',
      'Sauté peppers and spinach for 2 mins, then pour eggs and scramble softly.',
      'Cook rolled oats in a separate bowl with cinnamon. Enjoy as a power breakfast!'
    ]
  },
  {
    id: 'r4',
    title: 'Soya Chunks & Moong Dal Power Bowl',
    type: 'veg',
    time: '20 mins',
    kcal: 490,
    protein: 42,
    carbs: 58,
    fat: 8,
    ingredients: [
      '50g Soya Chunks (boiled & squeezed dry)',
      '1 Bowl Cooked Yellow Moong Dal Tadka',
      '80g Steamed Basmati or Brown Rice',
      '1 Cucumber & Tomato salad with lemon'
    ],
    instructions: [
      'Boil soya chunks in salted water for 5 mins, drain and squeeze out excess water.',
      'Sauté soya chunks with light cumin and onion-tomato gravy.',
      'Assemble with steamed rice, hot moong dal, and fresh lemon salad.'
    ]
  },
  {
    id: 'r5',
    title: 'Whey Protein Oats & Chia Power Bowl',
    type: 'snack',
    time: '5 mins',
    kcal: 340,
    protein: 32,
    carbs: 38,
    fat: 6,
    ingredients: [
      '1 Scoop Whey Protein Isolate (Chocolate or Vanilla)',
      '40g Instant / Rolled Oats',
      '1 tsp Chia Seeds',
      '1/2 Sliced Banana & Pinch of Cinnamon',
      '150ml Warm Water or Almond Milk'
    ],
    instructions: [
      'Cook oats with warm water/almond milk for 2 minutes.',
      'Let cool slightly, then stir in 1 scoop of whey protein until smooth and creamy.',
      'Top with banana slices, chia seeds, and a dash of cinnamon.'
    ]
  },
  {
    id: 'r6',
    title: 'Pan-Seared Fish Fillet with Roasted Veggies',
    type: 'nonveg',
    time: '18 mins',
    kcal: 420,
    protein: 44,
    carbs: 22,
    fat: 14,
    ingredients: [
      '200g Tilapia / Basa / Cod Fillet',
      '100g Steamed Broccoli & Zucchini',
      '1 tsp Extra Virgin Olive Oil',
      'Black Pepper, Garlic Powder, & Sea Salt',
      '1/2 Lemon Wedge'
    ],
    instructions: [
      'Season fish fillets generously with garlic powder, crushed black pepper, and salt.',
      'Pan-sear in olive oil for 3-4 mins each side until crispy and flaky.',
      'Toss broccoli and zucchini in the pan drippings for 2 mins. Finish with fresh lemon.'
    ]
  }
];

export default function Nutrition() {
  const S = useStore(s => s.S);
  const update = useStore(s => s.update);
  const toast = msg => useUI.getState().toast(msg);

  const today = todayISO();
  const aiPlan = S.aiPlan;

  // Meal logging state
  const loggedMealsMap = S.loggedMeals || {};
  const todayLogs = loggedMealsMap[today] || [];

  // Recipe reference filter
  const [recipeFilter, setRecipeFilter] = useState('all');
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  // Custom meal modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMealType, setCustomMealType] = useState('Breakfast');
  const [customTitle, setCustomTitle] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const [customProtein, setCustomProtein] = useState('');

  // Target metrics calculation
  const weight = S.nutritionWeight || S.aiAnswers?.weight || 75;
  const height = S.nutritionHeight || S.aiAnswers?.height || 175;
  const age = S.nutritionAge || S.aiAnswers?.age || 26;
  const gender = S.nutritionGender || S.aiAnswers?.gender || 'male';
  const activity = S.nutritionActivity || 'moderate';
  const goal = S.nutritionGoal || S.aiAnswers?.goal || 'muscle_gain';

  const bmr = gender === 'male'
    ? Math.round(10 * weight + 6.25 * height - 5 * age + 5)
    : Math.round(10 * weight + 6.25 * height - 5 * age - 161);

  const actMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, extra_active: 1.9 };
  const tdee = Math.round(bmr * (actMultipliers[activity] || 1.55));

  let calcCalories = tdee;
  if (goal === 'fat_loss') calcCalories = Math.round(tdee - 500);
  else if (goal === 'muscle_gain' || goal === 'muscle') calcCalories = Math.round(tdee + 300);
  else if (goal === 'recomp') calcCalories = Math.round(tdee - 200);

  const targetKcal = aiPlan?.kcal || S.targetCalories || calcCalories;
  const targetProtein = aiPlan?.protein || S.targetProtein || Math.round(weight * 2.2);
  const targetCarbs = aiPlan?.carbs || Math.round((targetKcal * 0.45) / 4);
  const targetFat = aiPlan?.fat || Math.round((targetKcal * 0.25) / 9);

  // Default suggested meals
  const defaultMeals = [
    {
      id: 'm1',
      slot: 'Breakfast',
      time: '8:30 AM',
      title: S.aiAnswers?.diet === 'veg' ? 'Paneer Bhurji & Multigrain Toast' : 'Egg White Scramble & Rolled Oats',
      kcal: Math.round(targetKcal * 0.25),
      protein: Math.round(targetProtein * 0.25),
      carbs: Math.round(targetCarbs * 0.25),
      fat: Math.round(targetFat * 0.25),
      note: S.aiAnswers?.diet === 'veg' ? '150g Low-fat Paneer, 2 Slices Toast, Black Coffee' : '4 Egg Whites + 1 Egg, 50g Oats, Berries'
    },
    {
      id: 'm2',
      slot: 'Lunch',
      time: '1:30 PM',
      title: S.aiAnswers?.diet === 'veg' ? 'Soya Chunks & Dal Tadka Rice Bowl' : 'Grilled Chicken Breast, Brown Rice & Broccoli',
      kcal: Math.round(targetKcal * 0.35),
      protein: Math.round(targetProtein * 0.35),
      carbs: Math.round(targetCarbs * 0.35),
      fat: Math.round(targetFat * 0.35),
      note: S.aiAnswers?.diet === 'veg' ? '50g Soya Chunks Curry, 1 Bowl Dal, 100g Rice, Salad' : '200g Grilled Chicken, 100g Rice, Steamed Veggies'
    },
    {
      id: 'm3',
      slot: 'Pre/Post Workout Fuel',
      time: '5:00 PM',
      title: 'Whey Protein Isolate & Banana',
      kcal: Math.round(targetKcal * 0.15),
      protein: Math.round(targetProtein * 0.2),
      carbs: Math.round(targetCarbs * 0.15),
      fat: Math.round(targetFat * 0.1),
      note: '1 Scoop Whey Protein with cold water, 1 Medium Banana, 8 Almonds'
    },
    {
      id: 'm4',
      slot: 'Dinner',
      time: '8:30 PM',
      title: S.aiAnswers?.diet === 'veg' ? 'Tofu/Paneer Tikka & Multigrain Roti' : 'Pan-Seared Fish / Chicken & Green Salad',
      kcal: Math.round(targetKcal * 0.25),
      protein: Math.round(targetProtein * 0.2),
      carbs: Math.round(targetCarbs * 0.25),
      fat: Math.round(targetFat * 0.3),
      note: S.aiAnswers?.diet === 'veg' ? '150g Grilled Tofu or Paneer, 1 Roti, Mixed Salad' : '180g Fish or Chicken Breast, Large Garden Salad'
    }
  ];

  // Calculate Consumed Totals
  const consumedKcal = todayLogs.reduce((sum, item) => sum + (item.kcal || 0), 0);
  const consumedProtein = todayLogs.reduce((sum, item) => sum + (item.protein || 0), 0);
  const consumedCarbs = todayLogs.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const consumedFat = todayLogs.reduce((sum, item) => sum + (item.fat || 0), 0);

  const remainingKcal = Math.max(0, targetKcal - consumedKcal);
  const kcalPercent = Math.min(100, Math.round((consumedKcal / targetKcal) * 100));

  // Toggle or Log a Suggested Meal
  const toggleSuggestedMeal = (meal) => {
    const isLogged = todayLogs.some(item => item.id === meal.id || item.slot === meal.slot);
    update(s => {
      if (!s.loggedMeals) s.loggedMeals = {};
      if (!s.loggedMeals[today]) s.loggedMeals[today] = [];

      if (isLogged) {
        s.loggedMeals[today] = s.loggedMeals[today].filter(item => item.id !== meal.id && item.slot !== meal.slot);
        toast(`Removed ${meal.slot} from today's log`);
      } else {
        s.loggedMeals[today].push({
          id: meal.id,
          slot: meal.slot,
          title: meal.title,
          kcal: meal.kcal,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          completed: true,
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        toast(`✓ Logged ${meal.slot} (+${meal.kcal} kcal, +${meal.protein}g protein)`);
      }
    });
  };

  // Add Custom Food / Meal
  const handleAddCustomMeal = () => {
    const k = parseInt(customKcal, 10) || 0;
    const p = parseInt(customProtein, 10) || 0;
    if (!customTitle.trim()) { toast('Please enter a meal name'); return; }
    if (k <= 0) { toast('Please enter calories'); return; }

    update(s => {
      if (!s.loggedMeals) s.loggedMeals = {};
      if (!s.loggedMeals[today]) s.loggedMeals[today] = [];

      s.loggedMeals[today].push({
        id: 'c_' + Date.now(),
        slot: customMealType,
        title: customTitle.trim(),
        kcal: k,
        protein: p,
        carbs: Math.round((k * 0.4) / 4),
        fat: Math.round((k * 0.25) / 9),
        completed: true,
        loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    toast(`✓ Added ${customTitle} (+${k} kcal)`);
    setCustomTitle('');
    setCustomKcal('');
    setCustomProtein('');
    setShowCustomModal(false);
  };

  // Filtered recipes
  const filteredRecipes = RECIPES_DB.filter(r => {
    if (recipeFilter === 'all') return true;
    if (recipeFilter === 'veg') return r.type === 'veg';
    if (recipeFilter === 'nonveg') return r.type === 'nonveg' || r.type === 'egg';
    if (recipeFilter === 'snack') return r.type === 'snack';
    return true;
  });

  return (
    <div className="view-content" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '120px' }}>
      
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
            {t('Nutrition & Macros')}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--label-3, #94a3b8)', margin: '3px 0 0' }}>
            {t('Daily fuel targets, 1-tap meal logging & recipe references')}
          </p>
        </div>
        <button
          onClick={() => setShowCustomModal(true)}
          style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #00b4d8 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            color: '#000',
            fontSize: '12px',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 240, 255, 0.3)'
          }}
        >
          <span>+ Log Food</span>
        </button>
      </div>

      {/* ── DAILY TARGETS & CONSUMPTION COCKPIT ─────────────── */}
      <div style={{
        background: '#111823',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        borderRadius: '18px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--acc)' }}>
              {t('Daily Fuel Target')}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', lineHeight: 1.1, marginTop: '4px' }}>
              {consumedKcal} <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>/ {targetKcal} kcal</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>REMAINING</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: remainingKcal === 0 ? 'var(--acc)' : '#e2e8f0' }}>
              {remainingKcal} kcal
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{
            width: `${kcalPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00f0ff, #00b4d8)',
            borderRadius: '99px',
            transition: 'width 0.3s ease',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
          }} />
        </div>

        {/* 3 Macro Target Progress Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ background: '#172030', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--acc)', textTransform: 'uppercase' }}>PROTEIN</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
              {consumedProtein}g <span style={{ fontSize: '10px', color: '#94a3b8' }}>/ {targetProtein}g</span>
            </div>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
              {Math.max(0, targetProtein - consumedProtein)}g left
            </div>
          </div>

          <div style={{ background: '#172030', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#e2e8f0', textTransform: 'uppercase' }}>CARBS</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
              {consumedCarbs}g <span style={{ fontSize: '10px', color: '#94a3b8' }}>/ {targetCarbs}g</span>
            </div>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
              {Math.max(0, targetCarbs - consumedCarbs)}g left
            </div>
          </div>

          <div style={{ background: '#172030', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase' }}>FATS</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
              {consumedFat}g <span style={{ fontSize: '10px', color: '#94a3b8' }}>/ {targetFat}g</span>
            </div>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
              {Math.max(0, targetFat - consumedFat)}g left
            </div>
          </div>
        </div>
      </div>

      {/* ── DAILY MEAL SCHEDULE & LOGGING ───────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            🍽️ {t("Today's Meals & Logging")}
          </h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {todayLogs.length} of 4 Logged
          </span>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {defaultMeals.map(meal => {
            const isDone = todayLogs.some(item => item.id === meal.id || item.slot === meal.slot);
            return (
              <div
                key={meal.id}
                style={{
                  background: isDone ? 'rgba(0, 240, 255, 0.08)' : '#111823',
                  border: isDone ? '1px solid var(--acc)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: isDone ? 'var(--acc)' : '#cbd5e1', textTransform: 'uppercase' }}>
                      {meal.slot}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {meal.time}</span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {meal.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {meal.note}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', marginTop: '4px' }}>
                    {meal.kcal} kcal · {meal.protein}g Protein
                  </div>
                </div>

                <button
                  onClick={() => toggleSuggestedMeal(meal)}
                  style={{
                    background: isDone ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                    color: isDone ? '#000' : '#fff',
                    border: isDone ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {isDone ? '✓ Logged' : '+ Log'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HIGH-PROTEIN RECIPE REFERENCE STUDIO ──────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              👨‍🍳 {t('Curated Recipes for Reference')}
            </h2>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {t('High-protein meals tailored to your diet')}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
          {[
            { id: 'all', label: 'All Recipes' },
            { id: 'nonveg', label: '🍗 High-Protein Non-Veg' },
            { id: 'veg', label: '🥗 Indian Vegetarian' },
            { id: 'snack', label: '⚡ Quick Fuel / Snacks' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRecipeFilter(tab.id)}
              style={{
                background: recipeFilter === tab.id ? '#38bdf8' : '#1e293b',
                color: recipeFilter === tab.id ? '#000' : '#cbd5e1',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recipe Cards */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredRecipes.map(recipe => {
            const isExpanded = expandedRecipe === recipe.id;
            return (
              <div
                key={recipe.id}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      ⏱️ {recipe.time}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '6px 0 4px' }}>
                      {recipe.title}
                    </h3>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '18px' }}>
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>

                {/* Macro summary row */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  <span>🔥 <strong style={{ color: '#fff' }}>{recipe.kcal}</strong> kcal</span>
                  <span>💪 <strong style={{ color: '#38bdf8' }}>{recipe.protein}g</strong> Protein</span>
                  <span>🍞 <strong style={{ color: '#f59e0b' }}>{recipe.carbs}g</strong> Carbs</span>
                  <span>🥑 <strong style={{ color: '#f43f5e' }}>{recipe.fat}g</strong> Fat</span>
                </div>

                {/* Expanded ingredients & preparation steps */}
                {isExpanded && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Ingredients:
                    </div>
                    <ul style={{ margin: '0 0 12px 18px', padding: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>

                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Preparation Steps:
                    </div>
                    <ol style={{ margin: '0 0 0 18px', padding: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {recipe.instructions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CUSTOM FOOD LOGGING MODAL ─────────────────────────── */}
      {showCustomModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '420px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff' }}>+ Log Custom Food</h3>
              <button onClick={() => setShowCustomModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Meal Slot</label>
                <select
                  value={customMealType}
                  onChange={e => setCustomMealType(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Pre/Post Workout">Pre/Post Workout</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Food / Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Boiled Eggs & Protein Shake"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Calories (kcal)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={customKcal}
                    onChange={e => setCustomKcal(e.target.value)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Protein (g)</label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={customProtein}
                    onChange={e => setCustomProtein(e.target.value)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <button
                onClick={handleAddCustomMeal}
                style={{
                  background: '#10b981', border: 'none', borderRadius: '12px',
                  padding: '12px', color: '#000', fontSize: '14px', fontWeight: '800',
                  marginTop: '6px', cursor: 'pointer'
                }}
              >
                Log Meal to Today's Tracker
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
