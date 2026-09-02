import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import Icon from '../components/Icon.jsx';
import { useUI } from '../store/useUI.js';
import { api } from '../lib/api.js';
import { t } from '../lib/i18n.js';
import { todayISO } from '../lib/format.js';
import { buildCustomDietPlan } from '../lib/planGenerator.js';

// Verified Quick Food Library for 1-Tap Detailed Logging
const QUICK_FOODS_DB = [
  // High Protein
  { name: 'Chicken Breast (Cooked)', portion: '150g', kcal: 248, protein: 46, carbs: 0, fat: 5, category: 'Protein', icon: '🍗' },
  { name: 'Whole Boiled Egg', portion: '1 large (50g)', kcal: 74, protein: 6.3, carbs: 0.4, fat: 5, category: 'Protein', icon: '🥚' },
  { name: 'Egg Whites', portion: '4 large (130g)', kcal: 68, protein: 14.5, carbs: 0.9, fat: 0.2, category: 'Protein', icon: '🍳' },
  { name: 'Low-Fat Paneer', portion: '100g', kcal: 180, protein: 20, carbs: 4, fat: 9, category: 'Protein', icon: '🧀' },
  { name: 'Soya Chunks (Dry)', portion: '50g', kcal: 172, protein: 26, carbs: 16, fat: 0.5, category: 'Protein', icon: '🫘' },
  { name: 'Whey Protein Isolate', portion: '1 scoop (30g)', kcal: 120, protein: 25, carbs: 2, fat: 1, category: 'Protein', icon: '🥤' },
  { name: 'Greek Yogurt / Thick Curd', portion: '150g (1 cup)', kcal: 105, protein: 15, carbs: 6, fat: 2, category: 'Protein', icon: '🥣' },
  { name: 'Fish Fillet (Tilapia/Basa)', portion: '150g', kcal: 190, protein: 39, carbs: 0, fat: 3.5, category: 'Protein', icon: '🐟' },
  { name: 'Tofu (Firm)', portion: '150g', kcal: 125, protein: 14, carbs: 3, fat: 7, category: 'Protein', icon: '🥗' },
  { name: 'Yellow Moong Dal (Cooked)', portion: '1 bowl (180g)', kcal: 180, protein: 12, carbs: 29, fat: 2, category: 'Protein', icon: '🍲' },
  { name: 'Rajma / Kidney Beans', portion: '1 bowl (180g)', kcal: 220, protein: 14, carbs: 38, fat: 2.5, category: 'Protein', icon: '🫘' },
  { name: 'Chole / Chickpeas', portion: '1 bowl (180g)', kcal: 240, protein: 13, carbs: 40, fat: 4, category: 'Protein', icon: '🫘' },

  // Carbs & Staples
  { name: 'Cooked White Basmati Rice', portion: '1 bowl (150g)', kcal: 195, protein: 4, carbs: 43, fat: 0.5, category: 'Carbs', icon: '🍚' },
  { name: 'Cooked Brown Rice / Quinoa', portion: '1 bowl (150g)', kcal: 165, protein: 3.5, carbs: 35, fat: 1.5, category: 'Carbs', icon: '🌾' },
  { name: 'Whole Wheat Roti / Chapati', portion: '1 medium (35g)', kcal: 105, protein: 3.5, carbs: 20, fat: 1.5, category: 'Carbs', icon: '🫓' },
  { name: 'Rolled Oats (Raw)', portion: '50g (1/2 cup)', kcal: 190, protein: 6.8, carbs: 34, fat: 3.5, category: 'Carbs', icon: '🥣' },
  { name: 'Banana', portion: '1 medium (118g)', kcal: 105, protein: 1.3, carbs: 27, fat: 0.3, category: 'Carbs', icon: '🍌' },
  { name: 'Sweet Potato (Boiled)', portion: '150g', kcal: 130, protein: 2.3, carbs: 30, fat: 0.2, category: 'Carbs', icon: '🍠' },
  { name: 'Whole Wheat Bread', portion: '2 slices (60g)', kcal: 140, protein: 6, carbs: 26, fat: 1.8, category: 'Carbs', icon: '🍞' },
  { name: 'Roasted Chana', portion: '40g (1 handful)', kcal: 150, protein: 8, carbs: 23, fat: 2.5, category: 'Carbs', icon: '🥗' },
  { name: 'Roasted Makhana (Foxnuts)', portion: '30g (1 bowl)', kcal: 105, protein: 3, carbs: 20, fat: 0.3, category: 'Carbs', icon: '🍿' },

  // Fats & Dairy
  { name: 'Natural Peanut Butter', portion: '1 tbsp (16g)', kcal: 95, protein: 4, carbs: 3.5, fat: 8, category: 'Fats', icon: '🥜' },
  { name: 'Almonds', portion: '10 pieces (12g)', kcal: 70, protein: 2.5, carbs: 2.5, fat: 6, category: 'Fats', icon: '🥜' },
  { name: 'Desi Ghee / Olive Oil', portion: '1 tsp (5g)', kcal: 45, protein: 0, carbs: 0, fat: 5, category: 'Fats', icon: '🧈' },
  { name: 'Chia Seeds', portion: '1 tbsp (12g)', kcal: 60, protein: 2, carbs: 5, fat: 4, category: 'Fats', icon: '🌱' },
  { name: 'Cow Milk (Full Cream)', portion: '1 glass (250ml)', kcal: 160, protein: 8, carbs: 12, fat: 9, category: 'Dairy', icon: '🥛' },
  { name: 'Cow Milk (Toned/Low-Fat)', portion: '1 glass (250ml)', kcal: 115, protein: 7.5, carbs: 12, fat: 3.5, category: 'Dairy', icon: '🥛' }
];

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
  const nav = useNavigate();
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

  // Detailed Food Logging Modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMealType, setCustomMealType] = useState('Breakfast');
  const [customTitle, setCustomTitle] = useState('');
  const [customPortion, setCustomPortion] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('All');

  // Custom Diet Builder Modal state
  const [showDietEditor, setShowDietEditor] = useState(false);
  const [editingMeals, setEditingMeals] = useState([]);

  // Target metrics calculation
  const weight = S.nutritionWeight || S.aiAnswers?.weight || 75;
  const height = S.nutritionHeight || S.aiAnswers?.height || 175;
  const age = S.nutritionAge || S.aiAnswers?.age || 26;
  const gender = S.nutritionGender || S.aiAnswers?.gender || 'male';
  const activity = S.nutritionActivity || 'moderate';
  const goal = S.nutritionGoal || S.aiAnswers?.goal || 'muscle_gain';

  const bmr = gender === 'female'
    ? Math.round(10 * weight + 6.25 * height - 5 * age - 161)
    : Math.round(10 * weight + 6.25 * height - 5 * age + 5);

  const actMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, extra_active: 1.9 };
  const tdee = Math.round(bmr * (actMultipliers[activity] || 1.55));

  let calcCalories = tdee;
  if (goal === 'fat_loss') calcCalories = Math.round(tdee - 450);
  else if (goal === 'muscle_gain' || goal === 'muscle') calcCalories = Math.round(tdee + 350);
  else if (goal === 'strength') calcCalories = Math.round(tdee + 200);

  const targetKcal = aiPlan?.kcal || S.targetCalories || calcCalories;
  const targetProtein = aiPlan?.protein || S.targetProtein || Math.round(weight * 2.1);
  const targetCarbs = aiPlan?.carbs || Math.round((targetKcal * 0.45) / 4);
  const targetFat = aiPlan?.fat || Math.round((targetKcal * 0.25) / 9);

  // Active Meal Protocol (Custom Diet || AI Plan Meals || Dynamic Indian Diet)
  const userDietPref = S.aiAnswers?.diet || 'nonveg';
  const activeDietMeals = S.customDiet?.meals || aiPlan?.meals || buildCustomDietPlan(userDietPref, targetKcal, targetProtein);

  // Calculate Consumed Totals
  const consumedKcal = todayLogs.reduce((sum, item) => sum + (Number(item.kcal) || 0), 0);
  const consumedProtein = todayLogs.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
  const consumedCarbs = todayLogs.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
  const consumedFat = todayLogs.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

  const remainingKcal = Math.max(0, targetKcal - consumedKcal);
  const kcalPercent = Math.min(100, Math.round((consumedKcal / targetKcal) * 100));

  // Toggle or Log a Prescribed Meal
  const toggleSuggestedMeal = (meal) => {
    const isLogged = todayLogs.some(item => item.id === meal.id || (item.slot === meal.slot && item.title === (meal.title || meal.n)));
    update(s => {
      if (!s.loggedMeals) s.loggedMeals = {};
      if (!s.loggedMeals[today]) s.loggedMeals[today] = [];

      if (isLogged) {
        s.loggedMeals[today] = s.loggedMeals[today].filter(item => item.id !== meal.id && !(item.slot === meal.slot && item.title === (meal.title || meal.n)));
        toast(`Removed ${meal.slot || meal.t} from today's log`);
      } else {
        s.loggedMeals[today].push({
          id: meal.id || 'm_' + Date.now(),
          slot: meal.slot || 'Meal',
          title: meal.title || meal.n || 'Prescribed Meal',
          portion: meal.note || meal.d || '',
          kcal: Number(meal.kcal || meal.k || 0),
          protein: Number(meal.protein || meal.p || 0),
          carbs: Number(meal.carbs || 0),
          fat: Number(meal.fat || 0),
          completed: true,
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        toast(`✓ Logged ${meal.slot || meal.title} (+${meal.kcal || meal.k} kcal)`);
      }
    });
  };

  // Add Detailed Custom Food / Meal
  const handleAddCustomMeal = () => {
    const k = parseInt(customKcal, 10) || 0;
    const p = parseInt(customProtein, 10) || 0;
    const c = parseInt(customCarbs, 10) || 0;
    const f = parseInt(customFat, 10) || 0;

    if (!customTitle.trim()) { toast('Please enter a food or meal name'); return; }
    if (k <= 0 && (p > 0 || c > 0 || f > 0)) {
      const calcK = (p * 4) + (c * 4) + (f * 9);
      if (calcK > 0) {
        logItemWithKcal(calcK, p, c, f);
        return;
      }
    }
    if (k <= 0) { toast('Please enter calories'); return; }

    logItemWithKcal(k, p, c, f);
  };

  const logItemWithKcal = (k, p, c, f) => {
    update(s => {
      if (!s.loggedMeals) s.loggedMeals = {};
      if (!s.loggedMeals[today]) s.loggedMeals[today] = [];

      s.loggedMeals[today].push({
        id: 'c_' + Date.now() + Math.random().toString(36).substring(2, 5),
        slot: customMealType,
        title: customTitle.trim(),
        portion: customPortion.trim(),
        kcal: k,
        protein: p,
        carbs: c,
        fat: f,
        completed: true,
        loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    toast(`✓ Logged ${customTitle} (+${k} kcal, +${p}g protein)`);
    setCustomTitle('');
    setCustomPortion('');
    setCustomKcal('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    setShowCustomModal(false);
  };

  // Remove a specific logged item from today
  const removeLoggedItem = (id) => {
    update(s => {
      if (s.loggedMeals && s.loggedMeals[today]) {
        s.loggedMeals[today] = s.loggedMeals[today].filter(item => item.id !== id);
      }
    });
    toast('Item removed from log');
  };

  // 1-Tap Fill from Quick Food Library
  const selectQuickFood = (food) => {
    setCustomTitle(food.name);
    setCustomPortion(food.portion);
    setCustomKcal(String(food.kcal));
    setCustomProtein(String(food.protein));
    setCustomCarbs(String(food.carbs));
    setCustomFat(String(food.fat));
  };

  // Open Diet Plan Builder
  const handleOpenDietEditor = () => {
    const initial = activeDietMeals.map(m => ({
      id: m.id || 'm_' + Math.random().toString(36).substring(2, 7),
      slot: m.slot || 'Meal',
      time: m.time || m.t || '12:00 PM',
      title: m.title || m.n || 'Meal',
      note: m.note || m.d || '',
      kcal: Number(m.kcal || m.k || 0),
      protein: Number(m.protein || m.p || 0),
      carbs: Number(m.carbs || 0),
      fat: Number(m.fat || 0),
      icon: m.icon || m.i || '🍽️'
    }));
    setEditingMeals(initial);
    setShowDietEditor(true);
  };

  // Save Custom Diet Plan
  const handleSaveCustomDiet = () => {
    if (editingMeals.length === 0) {
      toast('Please add at least 1 meal to your plan');
      return;
    }
    update(s => {
      s.customDiet = {
        name: 'Custom Athlete Diet',
        meals: editingMeals,
        updatedAt: new Date().toISOString()
      };
      if (s.aiPlan) {
        s.aiPlan.meals = editingMeals;
      }
    });
    toast('✓ Custom Diet Protocol Saved & Active!');
    setShowDietEditor(false);
  };

  // Reset Diet to AI Health Coach Recommendation
  const handleResetToAIDiet = () => {
    const aiDefault = buildCustomDietPlan(userDietPref, targetKcal, targetProtein);
    update(s => {
      delete s.customDiet;
      if (s.aiPlan) {
        s.aiPlan.meals = aiDefault;
      }
    });
    toast('✓ Reset to AI Health Coach Recommendation');
    setShowDietEditor(false);
  };

  // Add new empty slot to custom diet editor
  const handleAddEditorMeal = () => {
    const newMeal = {
      id: 'm_' + Date.now(),
      slot: 'Custom Meal',
      time: '4:00 PM',
      title: 'High-Protein Snack',
      note: 'e.g. 1 Scoop Whey, 1 Banana, 10 Almonds',
      kcal: 300,
      protein: 25,
      carbs: 30,
      fat: 8,
      icon: '⚡'
    };
    setEditingMeals([...editingMeals, newMeal]);
  };

  // Filter Quick Foods
  const filteredQuickFoods = QUICK_FOODS_DB.filter(f => {
    const matchesCategory = foodCategoryFilter === 'All' || f.category === foodCategoryFilter;
    const matchesSearch = !foodSearchQuery || f.name.toLowerCase().includes(foodSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered recipes
  const filteredRecipes = RECIPES_DB.filter(r => {
    if (recipeFilter === 'all') return true;
    if (recipeFilter === 'veg') return r.type === 'veg';
    if (recipeFilter === 'nonveg') return r.type === 'nonveg' || r.type === 'egg';
    if (recipeFilter === 'snack') return r.type === 'snack';
    return true;
  });

  return (
    <div className="view-content" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '148px' }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => nav('/home')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            aria-label="Back"
          >
            <Icon name="chevronLeft" />
          </button>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
              {S.customDiet ? 'Custom Protocol' : 'AI Calibrated'}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: '#fff', letterSpacing: '-0.6px' }}>
              {t('Nutrition & Macros')}
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowCustomModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(145deg,#ffffff 0%,#e2e8f0 100%)', border: 'none', borderRadius: '99px', padding: '9px 16px', color: '#000', fontSize: '12.5px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.6)' }}
        >
          <span style={{ fontSize: '14px' }}>+</span>
          <span>Log Food</span>
        </button>
      </div>

      {/* ── CALORIE COCKPIT HERO CARD ───────────────────────────── */}
      <div style={{ background: 'linear-gradient(150deg,#0d1627 0%,#090e1c 100%)', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.15)', borderRadius: '28px', padding: '22px 20px 20px', marginBottom: '14px', boxShadow: '0 10px 50px rgba(0,0,0,0.55)', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: -30, right: -20, width: 160, height: 120, background: 'radial-gradient(ellipse,rgba(251,191,36,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* Calorie numbers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.38)', marginBottom: '4px' }}>Daily Fuel Target</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '38px', fontWeight: '900', color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>{consumedKcal}</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>/ {targetKcal} kcal</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Remaining</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: remainingKcal > 0 ? '#34d399' : '#f87171', letterSpacing: '-0.8px' }}>
              {Math.max(0, remainingKcal)} <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>kcal</span>
            </div>
          </div>
        </div>

        {/* Calorie progress bar */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden', marginBottom: '18px' }}>
          <div style={{ width: `${Math.min(kcalPercent, 100)}%`, height: '100%', background: kcalPercent > 105 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#38bdf8,#34d399)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
        </div>

        {/* 3 Macro Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Protein', consumed: consumedProtein, target: targetProtein, color: '#60a5fa' },
            { label: 'Carbs', consumed: consumedCarbs, target: targetCarbs, color: '#34d399' },
            { label: 'Fats', consumed: consumedFat, target: targetFat, color: '#fbbf24' },
          ].map(({ label, consumed, target, color }) => {
            const pct = Math.min(100, Math.round((consumed / target) * 100)) || 0
            return (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderTop: `1px solid ${color}30`, borderRadius: '16px', padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '2px' }}>
                  {consumed}<span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>g</span>
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.32)', marginBottom: '8px', fontWeight: '600' }}>/ {target}g</div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px', opacity: 0.8 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CREATINE MONOHYDRATE DAILY TRACKER ───────────────────── */}
      {(() => {
        const isCreatineTaken = !!(S.creatineLogs && S.creatineLogs[today])
        const toggleCreatine = () => {
          update(s => {
            if (!s.creatineLogs) s.creatineLogs = {}
            s.creatineLogs[today] = !s.creatineLogs[today]
          })
          toast(!isCreatineTaken ? '⚡ 5g Creatine Monohydrate logged! Cell saturation active.' : 'Creatine unlogged')
        }

        return (
          <div style={{
            background: isCreatineTaken
              ? 'linear-gradient(150deg,rgba(16,185,129,0.12) 0%,#09131a 100%)'
              : 'linear-gradient(150deg,#121827 0%,#0a0f1c 100%)',
            border: isCreatineTaken ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(255,255,255,0.08)',
            borderTop: isCreatineTaken ? '1px solid rgba(52,211,153,0.55)' : '1px solid rgba(245,158,11,0.3)',
            borderRadius: '24px', padding: '18px 20px', marginBottom: '18px',
            boxShadow: isCreatineTaken ? '0 8px 30px rgba(16,185,129,0.15)' : 'var(--card-shadow)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: isCreatineTaken ? 'rgba(52,211,153,0.18)' : 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
                }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: isCreatineTaken ? '#34d399' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Ergogenic Saturation
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', letterSpacing: '-0.3px' }}>
                    Creatine Monohydrate (5g)
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: '800',
                color: isCreatineTaken ? '#34d399' : 'rgba(255,255,255,0.4)',
                background: isCreatineTaken ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
                border: isCreatineTaken ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.10)',
                padding: '4px 10px', borderRadius: '99px'
              }}>
                {isCreatineTaken ? '✓ Saturation Active' : 'Daily Dose Pending'}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.45, marginBottom: '14px' }}>
              {isCreatineTaken
                ? 'ATP phosphocreatine stores replenished for peak muscular output. Drink 3.5L+ water today for cellular hydration.'
                : 'Clinically proven gold standard for maximum strength, explosive power, and lean muscle fullness. 5g daily.'}
            </div>

            <button
              onClick={toggleCreatine}
              style={{
                width: '100%',
                background: isCreatineTaken
                  ? 'rgba(52,211,153,0.14)'
                  : 'linear-gradient(145deg,#f59e0b 0%,#d97706 100%)',
                border: isCreatineTaken ? '1px solid rgba(52,211,153,0.3)' : 'none',
                color: isCreatineTaken ? '#34d399' : '#000',
                borderRadius: '14px', padding: '12px',
                fontSize: '13.5px', fontWeight: '900', cursor: 'pointer',
                boxShadow: isCreatineTaken ? 'none' : '0 4px 20px rgba(245,158,11,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <span>{isCreatineTaken ? '✓ 5g Taken Today (Tap to Undo)' : '⚡ Log 5g Creatine Taken'}</span>
            </button>
          </div>
        )
      })()}

      {/* ── MEAL BLUEPRINT SECTION ─────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '3px' }}>
              {S.customDiet ? 'Hand-crafted by you' : 'AI-calibrated'}
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-0.4px' }}>
              🍽️ {S.customDiet ? 'My Diet Plan' : 'Meal Blueprint'}
            </h2>
          </div>
          <button
            onClick={handleOpenDietEditor}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '99px', padding: '8px 14px', fontSize: '11.5px', fontWeight: '800', color: 'rgba(255,255,255,0.72)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span>✏️</span><span>Customize</span>
          </button>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {activeDietMeals.map(meal => {
            const isDone = todayLogs.some(item => item.id === meal.id || (item.slot === meal.slot && item.title === (meal.title || meal.n)));
            const mealKcal = meal.kcal || meal.k || 0;
            const mealProtein = meal.protein || meal.p || 0;
            const mealCarbs = meal.carbs || 0;
            const mealFat = meal.fat || 0;

            return (
              <div
                key={meal.id || meal.slot}
                style={{
                  background: isDone ? 'rgba(52,211,153,0.06)' : 'var(--card-bg)',
                  border: isDone ? '1px solid rgba(52,211,153,0.28)' : '1px solid rgba(255,255,255,0.07)',
                  borderTop: isDone ? '1px solid rgba(52,211,153,0.45)' : '1px solid rgba(255,255,255,0.13)',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: isDone ? '0 4px 20px rgba(52,211,153,0.12)' : 'var(--card-shadow)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{meal.icon || meal.i || '🥗'}</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: isDone ? '#34d399' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {meal.slot || meal.n}
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontWeight: '600' }}>· {meal.time || meal.t || ''}</span>
                    {isDone && <span style={{ fontSize: '10px', fontWeight: '900', color: '#34d399', marginLeft: 'auto' }}>✓ Logged</span>}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '4px', letterSpacing: '-0.2px' }}>
                    {meal.title || meal.n}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '8px' }}>
                    {meal.note || meal.d}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { label: `${mealKcal} kcal`, color: '#fbbf24' },
                      { label: `${mealProtein}g P`, color: '#60a5fa' },
                      mealCarbs > 0 && { label: `${mealCarbs}g C`, color: '#34d399' },
                      mealFat > 0 && { label: `${mealFat}g F`, color: '#a78bfa' },
                    ].filter(Boolean).map(({ label, color }) => (
                      <span key={label} style={{ fontSize: '10.5px', fontWeight: '800', color, background: color + '15', border: `1px solid ${color}25`, padding: '3px 8px', borderRadius: '99px' }}>{label}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => toggleSuggestedMeal(meal)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: isDone ? 'linear-gradient(145deg,#34d399 0%,#10b981 100%)' : 'rgba(255,255,255,0.07)',
                    border: isDone ? 'none' : '1.5px solid rgba(255,255,255,0.14)',
                    color: isDone ? '#000' : 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '16px', flexShrink: 0, fontWeight: '900',
                    boxShadow: isDone ? '0 4px 14px rgba(52,211,153,0.4)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title={isDone ? 'Mark as incomplete' : 'Log prescribed meal'}
                >
                  {isDone ? '✓' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TODAY'S LOGGED FOODS & MEALS AUDIT ────────────────── */}
      {todayLogs.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--label)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              📋 {t("Today's Food Log")} ({todayLogs.length})
            </h2>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-2)' }}>
              Total: {consumedKcal} kcal · {consumedProtein}g Protein
            </span>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {todayLogs.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--acc)', textTransform: 'uppercase', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.slot}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--label-3)' }}>{item.loggedAt || ''}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--label)' }}>
                    {item.title}
                  </div>
                  {item.portion && (
                    <div style={{ fontSize: '11px', color: 'var(--label-2)', marginTop: '2px' }}>
                      Portion: {item.portion}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--label-2)', marginTop: '4px' }}>
                    <span>🔥 {item.kcal} kcal</span>
                    <span>🥩 {item.protein || 0}g P</span>
                    {item.carbs > 0 && <span>🍚 {item.carbs}g C</span>}
                    {item.fat > 0 && <span>🥑 {item.fat}g F</span>}
                  </div>
                </div>

                <button
                  onClick={() => removeLoggedItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--red)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px'
                  }}
                  title="Remove food"
                >
                  <Icon name="trash" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HIGH-PROTEIN RECIPE REFERENCE STUDIO ──────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--label)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              👨‍🍳 {t('Curated Recipes for Reference')}
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--label-2)', marginTop: '2px' }}>
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
                background: recipeFilter === tab.id ? 'var(--btn-pri-bg)' : 'var(--surface-2)',
                color: recipeFilter === tab.id ? 'var(--btn-pri-color)' : 'var(--label)',
                border: '1px solid var(--sep)',
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
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderTop: '1px solid var(--card-border-top)',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  boxShadow: 'var(--card-shadow)'
                }}
                onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '800', background: 'var(--surface-2)', color: 'var(--label)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      ⏱️ {recipe.time}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--label)', margin: '6px 0 4px' }}>
                      {recipe.title}
                    </h3>
                  </div>
                  <span style={{ color: 'var(--label-2)', fontSize: '18px' }}>
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>

                {/* Macro summary row */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--label-2)', marginTop: '6px' }}>
                  <span>🔥 <strong style={{ color: 'var(--label)' }}>{recipe.kcal}</strong> kcal</span>
                  <span>💪 <strong style={{ color: 'var(--label)' }}>{recipe.protein}g</strong> Protein</span>
                  <span>🍞 <strong style={{ color: 'var(--label)' }}>{recipe.carbs}g</strong> Carbs</span>
                  <span>🥑 <strong style={{ color: 'var(--label)' }}>{recipe.fat}g</strong> Fat</span>
                </div>

                {/* Expanded ingredients & preparation steps */}
                {isExpanded && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--sep)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--label)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Ingredients:
                    </div>
                    <ul style={{ margin: '0 0 12px 18px', padding: 0, fontSize: '12px', color: 'var(--label-2)', lineHeight: 1.5 }}>
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>

                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--label)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Preparation Steps:
                    </div>
                    <ol style={{ margin: '0 0 0 18px', padding: 0, fontSize: '12px', color: 'var(--label-2)', lineHeight: 1.5 }}>
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

      {/* ── DETAILED FOOD LOGGING MODAL (+ QUICK FOOD DATABASE) ── */}
      {showCustomModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-el)', border: '1px solid var(--card-border)',
            borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--label)' }}>+ Log Food / Meal</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--label-2)' }}>Detailed macro logging with 1-tap food library</p>
              </div>
              <button onClick={() => setShowCustomModal(false)} style={{ background: 'none', border: 'none', color: 'var(--label-2)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Quick Food Database Fast Selector */}
            <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '12px', marginBottom: '14px', border: '1px solid var(--sep)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label)', textTransform: 'uppercase' }}>
                  ⚡ Quick Pick from Library
                </span>
                <span style={{ fontSize: '10px', color: 'var(--label-3)' }}>Tap to fill macros</span>
              </div>

              {/* Search & Category Filter */}
              <input
                type="text"
                placeholder="🔍 Search Chicken, Paneer, Rice, Eggs, Oats..."
                value={foodSearchQuery}
                onChange={e => setFoodSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--sep)', borderRadius: '8px', padding: '7px 10px', color: 'var(--label)', fontSize: '12px', marginBottom: '8px' }}
              />

              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
                {['All', 'Protein', 'Carbs', 'Fats', 'Dairy'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFoodCategoryFilter(cat)}
                    style={{
                      background: foodCategoryFilter === cat ? 'var(--btn-pri-bg)' : 'var(--bg)',
                      color: foodCategoryFilter === cat ? 'var(--btn-pri-color)' : 'var(--label-2)',
                      border: '1px solid var(--sep)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Scrollable food pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {filteredQuickFoods.map(item => (
                  <div
                    key={item.name}
                    onClick={() => selectQuickFood(item)}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--sep)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: '700', color: 'var(--label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.icon} {item.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--label-2)', marginTop: '2px' }}>
                      {item.portion} · <strong>{item.protein}g P</strong> · {item.kcal} kcal
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Entry Form */}
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-2)', display: 'block', marginBottom: '4px' }}>Meal Slot</label>
                <select
                  value={customMealType}
                  onChange={e => setCustomMealType(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '10px', padding: '10px', color: 'var(--label)', fontSize: '13px' }}
                >
                  <option value="Breakfast">🍳 Breakfast</option>
                  <option value="Mid-Morning Fuel">🥗 Mid-Morning Fuel</option>
                  <option value="Lunch">🍱 Lunch</option>
                  <option value="Pre-Workout Snack">⚡ Pre-Workout Snack</option>
                  <option value="Post-Workout Fuel">🥤 Post-Workout Fuel</option>
                  <option value="Dinner">🍛 Dinner</option>
                  <option value="Late Night Snack">🌙 Late Night Snack</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-2)', display: 'block', marginBottom: '4px' }}>Food / Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Boiled Eggs + 2 Rotis"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '10px', padding: '10px', color: 'var(--label)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-2)', display: 'block', marginBottom: '4px' }}>Portion / Quantity (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 200g / 2 pieces / 1 bowl"
                  value={customPortion}
                  onChange={e => setCustomPortion(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '10px', padding: '10px', color: 'var(--label)', fontSize: '13px' }}
                />
              </div>

              {/* Macro Grid Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Calories</label>
                  <input
                    type="number"
                    placeholder="kcal"
                    value={customKcal}
                    onChange={e => setCustomKcal(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '10px', padding: '10px 6px', color: 'var(--label)', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Protein</label>
                  <input
                    type="number"
                    placeholder="g"
                    value={customProtein}
                    onChange={e => setCustomProtein(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '10px', padding: '10px 6px', color: 'var(--label)', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Carbs</label>
                  <input
                    type="number"
                    placeholder="g"
                    value={customCarbs}
                    onChange={e => setCustomCarbs(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '10px', padding: '10px 6px', color: 'var(--label)', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Fats</label>
                  <input
                    type="number"
                    placeholder="g"
                    value={customFat}
                    onChange={e => setCustomFat(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '10px', padding: '10px 6px', color: 'var(--label)', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* Auto Calculate Kcal helper button */}
              {(customProtein || customCarbs || customFat) && (
                <button
                  type="button"
                  onClick={() => {
                    const p = Number(customProtein) || 0;
                    const c = Number(customCarbs) || 0;
                    const f = Number(customFat) || 0;
                    const total = (p * 4) + (c * 4) + (f * 9);
                    setCustomKcal(String(total));
                  }}
                  style={{
                    background: 'none',
                    border: '1px dashed var(--sep)',
                    borderRadius: '8px',
                    padding: '6px',
                    fontSize: '11px',
                    color: 'var(--label-2)',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Auto-calculate Kcal from macros (P*4 + C*4 + F*9)
                </button>
              )}

              <button
                onClick={handleAddCustomMeal}
                style={{
                  background: 'var(--btn-pri-bg)', color: 'var(--btn-pri-color)', border: '1px solid var(--btn-pri-border)',
                  borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '800',
                  marginTop: '6px', cursor: 'pointer', boxShadow: 'var(--btn-pri-shadow)'
                }}
              >
                Log Meal to Today's Tracker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM DIET PLAN BUILDER & EDITOR MODAL ──────────── */}
      {showDietEditor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-el)', border: '1px solid var(--card-border)',
            borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--label)' }}>
                  🛠️ Custom Diet Plan Builder
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--label-2)' }}>
                  Customize or design your own daily meal schedule and macro targets
                </p>
              </div>
              <button onClick={() => setShowDietEditor(false)} style={{ background: 'none', border: 'none', color: 'var(--label-2)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Live Macro Sum Cockpit in Editor */}
            {(() => {
              const sumKcal = editingMeals.reduce((acc, m) => acc + (Number(m.kcal) || 0), 0);
              const sumP = editingMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);
              const sumC = editingMeals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);
              const sumF = editingMeals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);

              return (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label)', textTransform: 'uppercase' }}>
                      Planned Daily Total
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: sumKcal > targetKcal + 200 ? 'var(--orange)' : 'var(--label)' }}>
                      {sumKcal} / {targetKcal} kcal
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px', color: 'var(--label-2)' }}>
                    <span>🥩 Protein: <strong style={{ color: 'var(--label)' }}>{sumP}g</strong> / {targetProtein}g</span>
                    <span>🍚 Carbs: <strong style={{ color: 'var(--label)' }}>{sumC}g</strong> / {targetCarbs}g</span>
                    <span>🥑 Fats: <strong style={{ color: 'var(--label)' }}>{sumF}g</strong> / {targetFat}g</span>
                  </div>
                </div>
              );
            })()}

            {/* Editable Meal Slots List */}
            <div style={{ display: 'grid', gap: '14px', marginBottom: '18px' }}>
              {editingMeals.map((meal, index) => (
                <div
                  key={meal.id || index}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--sep)',
                    borderRadius: '14px',
                    padding: '14px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        value={meal.icon || '🍽️'}
                        onChange={e => {
                          const updated = [...editingMeals];
                          updated[index].icon = e.target.value;
                          setEditingMeals(updated);
                        }}
                        style={{ width: '32px', textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '6px', padding: '4px', fontSize: '14px' }}
                      />
                      <input
                        type="text"
                        value={meal.slot}
                        placeholder="Slot (e.g. Breakfast)"
                        onChange={e => {
                          const updated = [...editingMeals];
                          updated[index].slot = e.target.value;
                          setEditingMeals(updated);
                        }}
                        style={{ width: '130px', fontWeight: '800', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '6px', padding: '6px 8px', color: 'var(--label)', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        value={meal.time}
                        placeholder="Time"
                        onChange={e => {
                          const updated = [...editingMeals];
                          updated[index].time = e.target.value;
                          setEditingMeals(updated);
                        }}
                        style={{ width: '80px', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '6px', padding: '6px 8px', color: 'var(--label)', fontSize: '11px' }}
                      />
                    </div>

                    <button
                      onClick={() => {
                        const updated = editingMeals.filter((_, i) => i !== index);
                        setEditingMeals(updated);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '14px', cursor: 'pointer', padding: '4px' }}
                      title="Remove Slot"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--label-3)', textTransform: 'uppercase' }}>Meal Title</label>
                    <input
                      type="text"
                      value={meal.title}
                      placeholder="e.g. High Protein Eggs & Oats"
                      onChange={e => {
                        const updated = [...editingMeals];
                        updated[index].title = e.target.value;
                        setEditingMeals(updated);
                      }}
                      style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '8px', padding: '8px', color: 'var(--label)', fontSize: '12px', marginTop: '2px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--label-3)', textTransform: 'uppercase' }}>Portion & Ingredients Description</label>
                    <textarea
                      rows={2}
                      value={meal.note}
                      placeholder="e.g. 3 Eggs, 50g Oats, 1 Glass Milk"
                      onChange={e => {
                        const updated = [...editingMeals];
                        updated[index].note = e.target.value;
                        setEditingMeals(updated);
                      }}
                      style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '8px', padding: '8px', color: 'var(--label)', fontSize: '11.5px', resize: 'vertical', marginTop: '2px' }}
                    />
                  </div>

                  {/* Target Macros for this slot */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <div>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--label-3)' }}>KCAL</span>
                      <input
                        type="number"
                        value={meal.kcal}
                        onChange={e => {
                          const updated = [...editingMeals];
                          updated[index].kcal = Number(e.target.value) || 0;
                          setEditingMeals(updated);
                        }}
                        style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '6px', padding: '6px', color: 'var(--label)', fontSize: '11px', textAlign: 'center', fontWeight: '700' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--label-3)' }}>PROTEIN (g)</span>
                      <input
                        type="number"
                        value={meal.protein}
                        onChange={e => {
                          const updated = [...editingMeals];
                          updated[index].protein = Number(e.target.value) || 0;
                          setEditingMeals(updated);
                        }}
                        style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '6px', padding: '6px', color: 'var(--label)', fontSize: '11px', textAlign: 'center', fontWeight: '700' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--label-3)' }}>CARBS (g)</span>
                      <input
                        type="number"
                        value={meal.carbs}
                        onChange={e => {
                          const updated = [...editingMeals];
                          updated[index].carbs = Number(e.target.value) || 0;
                          setEditingMeals(updated);
                        }}
                        style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '6px', padding: '6px', color: 'var(--label)', fontSize: '11px', textAlign: 'center', fontWeight: '700' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--label-3)' }}>FATS (g)</span>
                      <input
                        type="number"
                        value={meal.fat}
                        onChange={e => {
                          const updated = [...editingMeals];
                          updated[index].fat = Number(e.target.value) || 0;
                          setEditingMeals(updated);
                        }}
                        style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '6px', padding: '6px', color: 'var(--label)', fontSize: '11px', textAlign: 'center', fontWeight: '700' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                onClick={handleAddEditorMeal}
                style={{
                  background: 'var(--surface-2)', border: '1px dashed var(--sep)',
                  borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: '700',
                  color: 'var(--label)', cursor: 'pointer'
                }}
              >
                + Add Another Meal Slot
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={handleResetToAIDiet}
                  style={{
                    background: 'var(--surface-3)', border: '1px solid var(--sep)',
                    borderRadius: '12px', padding: '12px', fontSize: '12px', fontWeight: '700',
                    color: 'var(--label-2)', cursor: 'pointer'
                  }}
                >
                  ⚡ Reset to AI Coach
                </button>

                <button
                  onClick={handleSaveCustomDiet}
                  style={{
                    background: 'var(--btn-pri-bg)', color: 'var(--btn-pri-color)', border: '1px solid var(--btn-pri-border)',
                    borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '800',
                    cursor: 'pointer', boxShadow: 'var(--btn-pri-shadow)'
                  }}
                >
                  💾 Save Custom Diet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
