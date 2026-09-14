import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import Icon from '../components/Icon.jsx';
import { useUI } from '../store/useUI.js';
import { api } from '../lib/api.js';
import { t } from '../lib/i18n.js';
import { todayISO } from '../lib/format.js';
import { buildCustomDietPlan } from '../lib/planGenerator.js';

// Comprehensive Food Catalog with Automatic Quantity-Based Macro Calculation
const COMMON_FOODS = [
  // 🥚 Eggs & Dairy
  { id: 'roti_chapati', name: 'Roti / Chapati (Whole Wheat)', category: 'Grains & Carbs', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 2, perUnit: { piece: { kcal: 105, p: 3.5, c: 20, f: 1.5, weightG: 35 }, g: { kcal: 3.0, p: 0.10, c: 0.57, f: 0.043 } } },
  { id: 'boiled_egg', name: 'Whole Boiled Egg', category: 'Eggs & Dairy', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 2, perUnit: { piece: { kcal: 74, p: 6.3, c: 0.4, f: 5, weightG: 50 }, g: { kcal: 1.48, p: 0.126, c: 0.008, f: 0.1 } } },
  { id: 'egg_white', name: 'Egg White (Boiled)', category: 'Eggs & Dairy', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 4, perUnit: { piece: { kcal: 17, p: 3.6, c: 0.2, f: 0.1, weightG: 33 }, g: { kcal: 0.52, p: 0.11, c: 0.007, f: 0.002 } } },
  { id: 'egg_omelette', name: 'Egg Omelette (1 Egg, minimal oil)', category: 'Eggs & Dairy', defaultUnit: 'piece', units: ['piece'], defaultQty: 2, perUnit: { piece: { kcal: 95, p: 6.5, c: 1, f: 7.2 } } },
  { id: 'paneer_regular', name: 'Paneer (Standard / Dairy)', category: 'Eggs & Dairy', defaultUnit: 'g', units: ['g'], defaultQty: 100, perUnit: { g: { kcal: 2.65, p: 0.18, c: 0.04, f: 0.20 } } },
  { id: 'paneer_lowfat', name: 'Low-Fat Paneer', category: 'Eggs & Dairy', defaultUnit: 'g', units: ['g'], defaultQty: 100, perUnit: { g: { kcal: 1.80, p: 0.20, c: 0.04, f: 0.09 } } },
  { id: 'curd_dahi', name: 'Curd / Plain Dahi', category: 'Eggs & Dairy', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 98, p: 5.2, c: 7, f: 5, weightG: 150 }, g: { kcal: 0.65, p: 0.035, c: 0.046, f: 0.033 } } },
  { id: 'greek_yogurt', name: 'Greek Yogurt / Thick Curd', category: 'Eggs & Dairy', defaultUnit: 'cup', units: ['cup', 'g'], defaultQty: 1, perUnit: { cup: { kcal: 105, p: 15, c: 6, f: 2, weightG: 150 }, g: { kcal: 0.70, p: 0.10, c: 0.04, f: 0.013 } } },
  { id: 'milk_toned', name: 'Cow Milk (Toned / Low Fat)', category: 'Eggs & Dairy', defaultUnit: 'glass', units: ['glass', 'ml'], defaultQty: 1, perUnit: { glass: { kcal: 115, p: 7.5, c: 12, f: 3.5, weightG: 250 }, ml: { kcal: 0.46, p: 0.03, c: 0.048, f: 0.014 } } },
  { id: 'milk_full', name: 'Cow Milk (Full Cream)', category: 'Eggs & Dairy', defaultUnit: 'glass', units: ['glass', 'ml'], defaultQty: 1, perUnit: { glass: { kcal: 160, p: 8, c: 12, f: 9, weightG: 250 }, ml: { kcal: 0.64, p: 0.032, c: 0.048, f: 0.036 } } },

  // 🍗 Meat & Fish
  { id: 'chicken_breast', name: 'Chicken Breast (Cooked / Grilled)', category: 'Meat & Fish', defaultUnit: 'g', units: ['g'], defaultQty: 150, perUnit: { g: { kcal: 1.65, p: 0.31, c: 0, f: 0.036 } } },
  { id: 'chicken_curry', name: 'Home Chicken Curry (Pieces)', category: 'Meat & Fish', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 280, p: 32, c: 6, f: 14, weightG: 200 }, g: { kcal: 1.4, p: 0.16, c: 0.03, f: 0.07 } } },
  { id: 'fish_fillet', name: 'Fish Fillet (Tilapia / Basa / Cod)', category: 'Meat & Fish', defaultUnit: 'g', units: ['g'], defaultQty: 150, perUnit: { g: { kcal: 1.25, p: 0.26, c: 0, f: 0.025 } } },

  // 🫘 Plant Protein & Supplements
  { id: 'soya_chunks', name: 'Soya Chunks (Raw Dry Weight)', category: 'Plant Protein', defaultUnit: 'g', units: ['g'], defaultQty: 50, perUnit: { g: { kcal: 3.45, p: 0.52, c: 0.33, f: 0.01 } } },
  { id: 'tofu_firm', name: 'Tofu (Firm / Soya Paneer)', category: 'Plant Protein', defaultUnit: 'g', units: ['g'], defaultQty: 150, perUnit: { g: { kcal: 0.83, p: 0.095, c: 0.02, f: 0.045 } } },
  { id: 'whey_protein', name: 'Whey Protein Powder', category: 'Plant Protein', defaultUnit: 'scoop', units: ['scoop', 'g'], defaultQty: 1, perUnit: { scoop: { kcal: 120, p: 25, c: 2, f: 1, weightG: 30 }, g: { kcal: 4.0, p: 0.83, c: 0.067, f: 0.033 } } },
  { id: 'yellow_dal', name: 'Yellow Moong / Toor Dal (Cooked)', category: 'Plant Protein', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 180, p: 12, c: 29, f: 2, weightG: 180 }, g: { kcal: 1.0, p: 0.067, c: 0.16, f: 0.011 } } },
  { id: 'rajma', name: 'Rajma / Kidney Beans (Cooked)', category: 'Plant Protein', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 220, p: 14, c: 38, f: 2.5, weightG: 180 }, g: { kcal: 1.22, p: 0.078, c: 0.21, f: 0.014 } } },
  { id: 'chole', name: 'Chole / Chickpeas (Cooked)', category: 'Plant Protein', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 240, p: 13, c: 40, f: 4, weightG: 180 }, g: { kcal: 1.33, p: 0.072, c: 0.22, f: 0.022 } } },

  // 🍚 Grains & Staples
  { id: 'cooked_white_rice', name: 'Cooked White Rice', category: 'Grains & Carbs', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 195, p: 4, c: 43, f: 0.5, weightG: 150 }, g: { kcal: 1.30, p: 0.027, c: 0.28, f: 0.003 } } },
  { id: 'cooked_brown_rice', name: 'Cooked Brown Rice', category: 'Grains & Carbs', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 165, p: 3.5, c: 35, f: 1.5, weightG: 150 }, g: { kcal: 1.10, p: 0.023, c: 0.23, f: 0.01 } } },
  { id: 'rolled_oats', name: 'Rolled Oats (Raw dry weight)', category: 'Grains & Carbs', defaultUnit: 'g', units: ['g', 'bowl'], defaultQty: 50, perUnit: { g: { kcal: 3.80, p: 0.136, c: 0.68, f: 0.07 }, bowl: { kcal: 190, p: 6.8, c: 34, f: 3.5, weightG: 50 } } },
  { id: 'bread_slice', name: 'Bread Slice (Brown or White)', category: 'Grains & Carbs', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 2, perUnit: { piece: { kcal: 70, p: 3, c: 13, f: 0.9, weightG: 30 }, g: { kcal: 2.33, p: 0.10, c: 0.43, f: 0.03 } } },
  { id: 'sweet_potato', name: 'Sweet Potato (Boiled)', category: 'Grains & Carbs', defaultUnit: 'g', units: ['g', 'piece'], defaultQty: 150, perUnit: { g: { kcal: 0.86, p: 0.016, c: 0.20, f: 0.001 }, piece: { kcal: 130, p: 2.3, c: 30, f: 0.2, weightG: 150 } } },
  { id: 'potato_boiled', name: 'Potato (Aloo, Boiled)', category: 'Grains & Carbs', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 1, perUnit: { piece: { kcal: 130, p: 3, c: 30, f: 0.2, weightG: 150 }, g: { kcal: 0.87, p: 0.02, c: 0.20, f: 0.001 } } },

  // 🍎 Fruits, Nuts & Healthy Fats
  { id: 'banana', name: 'Banana (Fresh Medium)', category: 'Fruits & Fats', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 1, perUnit: { piece: { kcal: 105, p: 1.3, c: 27, f: 0.3, weightG: 118 }, g: { kcal: 0.89, p: 0.011, c: 0.23, f: 0.003 } } },
  { id: 'apple', name: 'Apple (Medium)', category: 'Fruits & Fats', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 1, perUnit: { piece: { kcal: 95, p: 0.5, c: 25, f: 0.3, weightG: 180 }, g: { kcal: 0.52, p: 0.003, c: 0.14, f: 0.002 } } },
  { id: 'peanut_butter', name: 'Peanut Butter', category: 'Fruits & Fats', defaultUnit: 'tbsp', units: ['tbsp', 'g'], defaultQty: 1, perUnit: { tbsp: { kcal: 95, p: 4, c: 3.5, f: 8, weightG: 16 }, g: { kcal: 5.9, p: 0.25, c: 0.22, f: 0.50 } } },
  { id: 'almonds', name: 'Almonds (Badam)', category: 'Fruits & Fats', defaultUnit: 'piece', units: ['piece', 'g'], defaultQty: 10, perUnit: { piece: { kcal: 7, p: 0.25, c: 0.25, f: 0.6, weightG: 1.2 }, g: { kcal: 5.8, p: 0.21, c: 0.21, f: 0.50 } } },
  { id: 'desi_ghee', name: 'Desi Ghee / Cooking Oil', category: 'Fruits & Fats', defaultUnit: 'tsp', units: ['tsp', 'tbsp', 'g'], defaultQty: 1, perUnit: { tsp: { kcal: 45, p: 0, c: 0, f: 5, weightG: 5 }, tbsp: { kcal: 135, p: 0, c: 0, f: 15, weightG: 15 }, g: { kcal: 9.0, p: 0, c: 0, f: 1.0 } } },
  { id: 'makhana', name: 'Roasted Makhana (Foxnuts)', category: 'Fruits & Fats', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 105, p: 3, c: 20, f: 0.3, weightG: 30 }, g: { kcal: 3.5, p: 0.10, c: 0.67, f: 0.01 } } },
  { id: 'roasted_chana', name: 'Roasted Chana (With Skin)', category: 'Fruits & Fats', defaultUnit: 'bowl', units: ['bowl', 'g'], defaultQty: 1, perUnit: { bowl: { kcal: 150, p: 8, c: 23, f: 2.5, weightG: 40 }, g: { kcal: 3.75, p: 0.20, c: 0.57, f: 0.06 } } }
];

function calculateItemMacros(foodItem, qty, unit) {
  const q = parseFloat(qty) || 0;
  if (!foodItem || q <= 0) return null;
  const unitData = foodItem.perUnit?.[unit] || foodItem.perUnit?.[foodItem.defaultUnit];
  if (!unitData) return null;
  return {
    kcal: Math.round(unitData.kcal * q),
    protein: Math.round(unitData.p * q * 10) / 10,
    carbs: Math.round(unitData.c * q * 10) / 10,
    fat: Math.round(unitData.f * q * 10) / 10
  };
}

const UNIT_LABELS = {
  piece: 'piece(s) / eggs / rotis',
  g: 'grams (g) — weight scale',
  bowl: 'bowl / katori (~150-180g)',
  cup: 'cup (~150g)',
  glass: 'glass (~250ml)',
  ml: 'milliliters (ml)',
  scoop: 'scoop (~30g)',
  tbsp: 'tablespoon (tbsp)',
  tsp: 'teaspoon (tsp)',
  serving: 'serving'
};

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
  const [selectedFoodId, setSelectedFoodId] = useState('roti_chapati');
  const [customTitle, setCustomTitle] = useState('Roti / Chapati (Whole Wheat)');
  const [customQty, setCustomQty] = useState(2);
  const [customUnit, setCustomUnit] = useState('piece');
  const [customKcal, setCustomKcal] = useState('210');
  const [customProtein, setCustomProtein] = useState('7');
  const [customCarbs, setCustomCarbs] = useState('40');
  const [customFat, setCustomFat] = useState('3');

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
          title: meal.title || meal.n || 'Recommended Meal',
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

  // Open food logging modal initialized
  const handleOpenFoodModal = () => {
    setShowCustomModal(true);
    if (!selectedFoodId || selectedFoodId === 'custom') {
      handleSelectFood('roti_chapati');
    }
  };

  const handleSelectFood = (foodId) => {
    setSelectedFoodId(foodId);
    if (foodId === 'custom') {
      setCustomTitle('');
      setCustomUnit('serving');
      setCustomQty(1);
      setCustomKcal('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFat('');
      return;
    }
    const food = COMMON_FOODS.find(f => f.id === foodId);
    if (!food) return;
    setCustomTitle(food.name);
    setCustomUnit(food.defaultUnit);
    setCustomQty(food.defaultQty);
    const m = calculateItemMacros(food, food.defaultQty, food.defaultUnit);
    if (m) {
      setCustomKcal(String(m.kcal));
      setCustomProtein(String(m.protein));
      setCustomCarbs(String(m.carbs));
      setCustomFat(String(m.fat));
    }
  };

  const handleQtyChange = (val) => {
    setCustomQty(val);
    if (selectedFoodId !== 'custom') {
      const food = COMMON_FOODS.find(f => f.id === selectedFoodId);
      const m = calculateItemMacros(food, val, customUnit);
      if (m) {
        setCustomKcal(String(m.kcal));
        setCustomProtein(String(m.protein));
        setCustomCarbs(String(m.carbs));
        setCustomFat(String(m.fat));
      }
    }
  };

  const handleUnitChange = (newUnit) => {
    setCustomUnit(newUnit);
    if (selectedFoodId !== 'custom') {
      const food = COMMON_FOODS.find(f => f.id === selectedFoodId);
      let newQty = customQty;
      const currentUnitData = food?.perUnit?.[customUnit];
      if (newUnit === 'g' && currentUnitData?.weightG) {
        newQty = Math.round(customQty * currentUnitData.weightG);
        setCustomQty(newQty);
      } else if (customUnit === 'g' && food?.perUnit?.[newUnit]?.weightG) {
        newQty = Math.max(1, Math.round(customQty / food.perUnit[newUnit].weightG));
        setCustomQty(newQty);
      }
      const m = calculateItemMacros(food, newQty, newUnit);
      if (m) {
        setCustomKcal(String(m.kcal));
        setCustomProtein(String(m.protein));
        setCustomCarbs(String(m.carbs));
        setCustomFat(String(m.fat));
      }
    }
  };

  const handleStepQty = (delta) => {
    const isWeight = customUnit === 'g' || customUnit === 'ml';
    const step = isWeight ? 25 : 1;
    const current = parseFloat(customQty) || 0;
    const nextVal = Math.max(isWeight ? 10 : 0.5, isWeight ? Math.round((current + (delta * step)) / step) * step : current + (delta * step));
    handleQtyChange(nextVal);
  };

  // Add Detailed Custom Food / Meal
  const handleAddCustomMeal = () => {
    const k = parseInt(customKcal, 10) || 0;
    const p = parseFloat(customProtein) || 0;
    const c = parseFloat(customCarbs) || 0;
    const f = parseFloat(customFat) || 0;

    let title = customTitle.trim();
    if (!title && selectedFoodId !== 'custom') {
      title = COMMON_FOODS.find(x => x.id === selectedFoodId)?.name || '';
    }
    if (!title) { toast('Please enter a food or meal name'); return; }

    const portionLabel = `${customQty} ${UNIT_LABELS[customUnit] || customUnit || ''}`;

    if (k <= 0 && (p > 0 || c > 0 || f > 0)) {
      const calcK = Math.round((p * 4) + (c * 4) + (f * 9));
      logItemWithKcal(title, portionLabel, calcK, p, c, f);
      return;
    }
    if (k <= 0) { toast('Please enter quantity or calories'); return; }

    logItemWithKcal(title, portionLabel, k, p, c, f);
  };

  const logItemWithKcal = (title, portion, k, p, c, f) => {
    update(s => {
      if (!s.loggedMeals) s.loggedMeals = {};
      if (!s.loggedMeals[today]) s.loggedMeals[today] = [];

      s.loggedMeals[today].push({
        id: 'c_' + Date.now() + Math.random().toString(36).substring(2, 5),
        slot: customMealType,
        title: title,
        portion: portion,
        kcal: k,
        protein: p,
        carbs: c,
        fat: f,
        completed: true,
        loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    toast(`✓ Logged ${title} (+${k} kcal, +${p}g protein)`);
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
    toast('✓ Custom Meal Plan Saved & Active!');
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
    toast('✓ Reset to Recommended Meal Plan');
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
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--label)' }}
            aria-label="Back"
          >
            <Icon name="chevronLeft" />
          </button>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
              {S.customDiet ? 'Custom Diet' : 'Coach Tailored'}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: 'var(--label)', letterSpacing: '-0.6px' }}>
              {t('Nutrition & Macros')}
            </h1>
          </div>
        </div>
        <button
          onClick={handleOpenFoodModal}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--btn-pri-bg)', border: 'none', borderRadius: '99px', padding: '9px 16px', color: 'var(--btn-pri-color)', fontSize: '12.5px', fontWeight: '900', cursor: 'pointer', boxShadow: 'var(--btn-pri-shadow)' }}
        >
          <span style={{ fontSize: '14px' }}>+</span>
          <span>Log Food</span>
        </button>
      </div>

      {/* ── CALORIE COCKPIT HERO CARD ───────────────────────────── */}
      <div style={{ background: 'var(--card-gradient, var(--card-bg))', border: '1px solid var(--card-border)', borderTop: '1px solid var(--card-border-top)', borderRadius: '28px', padding: '22px 20px 20px', marginBottom: '14px', boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient subtle glow matching Home hero */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'radial-gradient(circle,rgba(56,189,248,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, background: 'radial-gradient(circle,rgba(52,211,153,0.10) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* Calorie numbers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--acc)', marginBottom: '4px' }}>Daily Fuel Target</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '38px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-1.5px', lineHeight: 1 }}>{consumedKcal}</span>
              <span style={{ fontSize: '14px', color: 'var(--label-3)', fontWeight: '600' }}>/ {targetKcal} kcal</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'var(--label-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Remaining</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: remainingKcal > 0 ? '#34d399' : '#f87171', letterSpacing: '-0.8px' }}>
              {Math.max(0, remainingKcal)} <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--label-3)' }}>kcal</span>
            </div>
          </div>
        </div>

        {/* Calorie progress bar with Home Screen signature gradient */}
        <div style={{ width: '100%', height: '6px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: `${Math.min(kcalPercent, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #34d399 100%)', borderRadius: '99px', transition: 'width 0.4s ease', boxShadow: '0 0 10px rgba(56,189,248,0.4)' }} />
        </div>

        {/* 3 Macro Cards with Home Screen Colors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Protein', consumed: consumedProtein, target: targetProtein, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)' },
            { label: 'Carbs', consumed: consumedCarbs, target: targetCarbs, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.22)' },
            { label: 'Fats', consumed: consumedFat, target: targetFat, color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.22)' },
          ].map(({ label, consumed, target, color, bg, border }) => {
            const pct = Math.min(100, Math.round((consumed / target) * 100)) || 0
            return (
              <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderTop: `2px solid ${color}`, borderRadius: '16px', padding: '12px 10px', textAlign: 'center', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '9.5px', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '2px' }}>
                  {consumed}<span style={{ fontSize: '10px', color: 'var(--label-3)', fontWeight: '600' }}>g</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--label-3)', marginBottom: '8px', fontWeight: '600' }}>/ {target}g</div>
                <div style={{ height: '3.5px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CREATINE MONOHYDRATE DAILY TRACKER (CLEAN HOME SCREEN PALETTE) ── */}
      {(() => {
        const isCreatineTaken = !!(S.creatineLogs && S.creatineLogs[today])
        const toggleCreatine = () => {
          update(s => {
            if (!s.creatineLogs) s.creatineLogs = {}
            s.creatineLogs[today] = !s.creatineLogs[today]
          })
          toast(!isCreatineTaken ? 'Creatine logged (5g). Stay hydrated.' : 'Creatine unlogged')
        }

        return (
          <div style={{
            background: 'var(--card-gradient, var(--card-bg))',
            border: isCreatineTaken ? '1px solid rgba(52,211,153,0.25)' : '1px solid var(--card-border)',
            borderTop: isCreatineTaken ? '2px solid #34d399' : '2px solid var(--acc)',
            borderRadius: '22px', padding: '18px 20px', marginBottom: '18px',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: isCreatineTaken ? 'rgba(52,211,153,0.12)' : 'var(--acc-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', color: isCreatineTaken ? '#34d399' : 'var(--acc)'
                }}>
                  <Icon name="sparkles" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: isCreatineTaken ? '#34d399' : 'var(--acc)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
                    Daily Supplement
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--label)', letterSpacing: '-0.3px' }}>
                    Creatine Monohydrate (5g)
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: '800',
                color: isCreatineTaken ? '#34d399' : '#fbbf24',
                background: isCreatineTaken ? 'rgba(52,211,153,0.10)' : 'rgba(251,191,36,0.10)',
                border: isCreatineTaken ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(251,191,36,0.25)',
                padding: '4px 10px', borderRadius: '99px'
              }}>
                {isCreatineTaken ? 'Taken Today ✓' : 'Pending'}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--label-2)', lineHeight: 1.45, marginBottom: '14px' }}>
              {isCreatineTaken
                ? 'Muscles replenished with energy. Drink 3.5L+ water today to stay well hydrated.'
                : 'Standard 5g daily dose for strength, power, and muscle recovery. Best taken with water.'}
            </div>

            <button
              onClick={toggleCreatine}
              style={{
                width: '100%',
                background: isCreatineTaken ? 'rgba(52,211,153,0.12)' : 'var(--acc-soft)',
                border: isCreatineTaken ? '1px solid rgba(52,211,153,0.35)' : '1px solid var(--acc-line)',
                color: isCreatineTaken ? '#34d399' : 'var(--acc)',
                borderRadius: '12px', padding: '12px',
                fontSize: '13.5px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: isCreatineTaken ? 'none' : '0 4px 16px rgba(56,189,248,0.15)'
              }}
            >
              <span>{isCreatineTaken ? '✓ Logged (Tap to Undo)' : '⚡ Log 5g Creatine'}</span>
            </button>
          </div>
        )
      })()}

      {/* ── MEAL BLUEPRINT SECTION ─────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '3px' }}>
              {S.customDiet ? 'Custom Diet' : 'Coach Recommended'}
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--label)', margin: 0, letterSpacing: '-0.4px' }}>
              {S.customDiet ? 'My Diet Plan' : "Today's Meal Plan"}
            </h2>
          </div>
          <button
            onClick={handleOpenDietEditor}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)', borderRadius: '99px', padding: '8px 15px', fontSize: '12px', fontWeight: '700', color: 'var(--label-2)', cursor: 'pointer' }}
          >
            Customize
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
                  background: isDone ? 'var(--surface-2)' : 'var(--card-gradient, var(--card-bg))',
                  border: '1px solid var(--card-border)',
                  borderTop: '1px solid var(--card-border-top)',
                  borderRadius: '20px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: isDone ? 'var(--label)' : 'var(--label-2)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {meal.slot || meal.n}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--label-3)', fontWeight: '600' }}>· {meal.time || meal.t || ''}</span>
                    {isDone && <span style={{ fontSize: '10px', fontWeight: '800', color: '#34d399', marginLeft: 'auto' }}>✓ Logged</span>}
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--label)', marginBottom: '4px', letterSpacing: '-0.2px' }}>
                    {meal.title || meal.n}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--label-2)', lineHeight: 1.4, marginBottom: '8px' }}>
                    {meal.note || meal.d}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.22)', padding: '3px 8px', borderRadius: '99px' }}>
                      {mealKcal} kcal
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.22)', padding: '3px 8px', borderRadius: '99px' }}>
                      {mealProtein}g Protein
                    </span>
                    {mealCarbs > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.22)', padding: '3px 8px', borderRadius: '99px' }}>
                        {mealCarbs}g Carbs
                      </span>
                    )}
                    {mealFat > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8', background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.22)', padding: '3px 8px', borderRadius: '99px' }}>
                        {mealFat}g Fat
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleSuggestedMeal(meal)}
                  style={{
                    background: isDone ? 'rgba(52,211,153,0.12)' : 'var(--surface-2)',
                    border: isDone ? '1px solid rgba(52,211,153,0.3)' : '1px solid var(--card-border)',
                    color: isDone ? '#34d399' : 'var(--label)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    flexShrink: 0
                  }}
                  title={isDone ? 'Meal logged' : 'Log this meal'}
                >
                  {isDone ? '✓' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TODAY'S AUDIT LOG SECTION ───────────────────────────── */}
      {todayLogs.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '2px' }}>Audit</div>
              <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--label)', margin: 0, letterSpacing: '-0.3px' }}>
                {t("Today's Food Log")} ({todayLogs.length})
              </h2>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--label-3)' }}>
              Total: {consumedKcal} kcal · {consumedProtein}g Protein
            </span>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {todayLogs.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--card-gradient, var(--card-bg))',
                  border: '1px solid var(--card-border)',
                  borderTop: '1px solid var(--card-border-top)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--label-2)', textTransform: 'uppercase', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: '99px' }}>
                      {item.slot}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--label-3)' }}>{item.loggedAt || ''}</span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--label)' }}>
                    {item.title}
                  </div>
                  {item.portion && (
                    <div style={{ fontSize: '11px', color: 'var(--label-2)', marginTop: '2px' }}>
                      Portion: {item.portion}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--label-2)' }}>{item.kcal} kcal</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--label-4)' }}>·</span>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--label-2)' }}>{item.protein || 0}g Protein</span>
                    {item.carbs > 0 && <>
                      <span style={{ fontSize: '10.5px', color: 'var(--label-4)' }}>·</span>
                      <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--label-3)' }}>{item.carbs}g Carbs</span>
                    </>}
                    {item.fat > 0 && <>
                      <span style={{ fontSize: '10.5px', color: 'var(--label-4)' }}>·</span>
                      <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--label-3)' }}>{item.fat}g Fat</span>
                    </>}
                  </div>
                </div>

                <button
                  onClick={() => removeLoggedItem(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--label-4)',
                    fontSize: '15px',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HIGH-PROTEIN RECIPE REFERENCE STUDIO (CLEAN APPLE/GOOGLE HEALTH STYLE) ── */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '3px' }}>
            Recipe Studio
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--label)', margin: 0, letterSpacing: '-0.4px' }}>
            {t('Curated High-Protein Recipes')}
          </h2>
          <div style={{ fontSize: '11px', color: 'var(--label-3)', marginTop: '2px' }}>
            {t('Nutrient-dense reference meals tailored to your diet')}
          </div>
        </div>

        {/* Filter Pills - Clean, elegant, no cartoon emojis */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'All Recipes' },
            { id: 'nonveg', label: 'High-Protein Non-Veg' },
            { id: 'veg', label: 'Indian Vegetarian' },
            { id: 'snack', label: 'Quick Fuel / Snacks' }
          ].map(tab => {
            const isActive = recipeFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setRecipeFilter(tab.id)}
                style={{
                  background: isActive ? 'var(--btn-pri-bg)' : 'var(--surface-2)',
                  color: isActive ? 'var(--btn-pri-color)' : 'var(--label-2)',
                  border: isActive ? 'none' : '1px solid var(--card-border)',
                  borderRadius: '99px',
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: isActive ? '800' : '600',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: isActive ? 'var(--btn-pri-shadow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Recipe Cards */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredRecipes.map(recipe => {
            const isExpanded = expandedRecipe === recipe.id;
            return (
              <div
                key={recipe.id}
                style={{
                  background: 'var(--card-gradient, var(--card-bg))',
                  border: '1px solid var(--card-border)',
                  borderTop: '1px solid var(--card-border-top)',
                  borderRadius: '20px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  boxShadow: 'var(--card-shadow)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', background: 'var(--surface-2)', border: '1px solid var(--card-border)', color: 'var(--label-2)', padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {recipe.time}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--label)', margin: '8px 0 6px', letterSpacing: '-0.3px' }}>
                      {recipe.title}
                    </h3>
                  </div>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'var(--surface-2)', border: '1px solid var(--card-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--label-2)', fontSize: '15px', fontWeight: '700'
                  }}>
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>

                {/* Macro summary row */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.22)', padding: '3px 9px', borderRadius: '99px' }}>
                    {recipe.kcal} kcal
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.22)', padding: '3px 9px', borderRadius: '99px' }}>
                    {recipe.protein}g Protein
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.22)', padding: '3px 9px', borderRadius: '99px' }}>
                    {recipe.carbs}g Carbs
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8', background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.22)', padding: '3px 9px', borderRadius: '99px' }}>
                    {recipe.fat}g Fat
                  </span>
                </div>

                {/* Expanded ingredients & preparation steps */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                      Ingredients
                    </div>
                    <ul style={{ margin: '0 0 16px 18px', padding: 0, fontSize: '12.5px', color: 'var(--label-2)', lineHeight: 1.6 }}>
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>

                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                      Preparation Steps
                    </div>
                    <ol style={{ margin: '0 0 0 18px', padding: 0, fontSize: '12.5px', color: 'var(--label-2)', lineHeight: 1.6 }}>
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

      {/* ── CLEAN FOOD LOGGING MODAL (AUTOMATIC QUANTITY MACRO CALCULATION) ── */}
      {showCustomModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-el)', border: '1px solid var(--card-border)',
            borderRadius: '24px', padding: '22px', width: '100%', maxWidth: '480px',
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--label)' }}>+ Log Food / Meal</h3>
                <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--label-2)' }}>
                  Add your food and quantity to calculate calories &amp; macros
                </p>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: 'var(--label-2)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Entry Form */}
            <div style={{ display: 'grid', gap: '14px' }}>
              {/* Meal Slot */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Meal Slot
                </label>
                <select
                  value={customMealType}
                  onChange={e => setCustomMealType(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '10px 12px', color: 'var(--label)', fontSize: '13.5px', fontWeight: '700' }}
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

              {/* Food Item Selection */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Food Item
                </label>
                <select
                  value={selectedFoodId}
                  onChange={e => handleSelectFood(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '10px 12px', color: 'var(--label)', fontSize: '13.5px', fontWeight: '700' }}
                >
                  <optgroup label="🥚 Eggs & Dairy">
                    {COMMON_FOODS.filter(f => f.category === 'Eggs & Dairy').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🍗 Meat & Fish">
                    {COMMON_FOODS.filter(f => f.category === 'Meat & Fish').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🫘 Plant Protein & Supplements">
                    {COMMON_FOODS.filter(f => f.category === 'Plant Protein').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🍚 Grains, Rotis & Rice">
                    {COMMON_FOODS.filter(f => f.category === 'Grains & Carbs').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🍎 Fruits, Nuts & Fats">
                    {COMMON_FOODS.filter(f => f.category === 'Fruits & Fats').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                  <option value="custom">✏️ Other / Custom Food...</option>
                </select>
              </div>

              {/* Custom Food Name Input if custom selected */}
              {selectedFoodId === 'custom' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Custom Food Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Dosa with Sambar / Paneer Roll"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '10px 12px', color: 'var(--label)', fontSize: '13px' }}
                  />
                </div>
              )}

              {/* Quantity & Serving Unit */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label-2)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quantity &amp; Serving Size
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Stepper with input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleStepQty(-1)}
                      style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: 'var(--surface-2)', border: '1px solid var(--sep)',
                        color: 'var(--label)', fontSize: '18px', fontWeight: '800',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={customQty}
                      onChange={e => handleQtyChange(e.target.value)}
                      style={{
                        width: '74px', height: '38px', background: 'var(--surface-2)',
                        border: '1px solid var(--sep)', borderRadius: '10px', padding: '0 6px',
                        color: 'var(--label)', fontSize: '15px', fontWeight: '800', textAlign: 'center'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleStepQty(1)}
                      style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: 'var(--surface-2)', border: '1px solid var(--sep)',
                        color: 'var(--label)', fontSize: '18px', fontWeight: '800',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Unit Selector */}
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <select
                      value={customUnit}
                      onChange={e => handleUnitChange(e.target.value)}
                      style={{
                        width: '100%', height: '38px', background: 'var(--surface-2)',
                        border: '1px solid var(--sep)', borderRadius: '10px', padding: '0 10px',
                        color: 'var(--label)', fontSize: '12.5px', fontWeight: '700'
                      }}
                    >
                      {((COMMON_FOODS.find(f => f.id === selectedFoodId)?.units) || ['g', 'piece', 'bowl', 'serving']).map(u => (
                        <option key={u} value={u}>
                          {UNIT_LABELS[u] || u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 💡 Approximate Calculation & Weight Scale Advisory */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                padding: '12px 14px',
                fontSize: '12px',
                lineHeight: 1.55
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>⚡</span> Approx: ~{customKcal || 0} kcal
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--label-3)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '99px', fontWeight: '700' }}>
                    Estimated
                  </span>
                </div>
                <div style={{ color: 'var(--label-2)', fontSize: '11.5px', marginTop: '4px' }}>
                  💡 <strong>Portions are approximate:</strong> Sizes like bowls, rotis, or pieces give a good estimate. For exact calories (especially for paneer, chicken, rice, or cooking oils), use a <strong>kitchen weight scale</strong> to weigh in grams.
                </div>
              </div>

              {/* Calculated / Editable Macro Grid Inputs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--label-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Macro Breakdown
                  </label>
                  <span style={{ fontSize: '10.5px', color: 'var(--label-3)' }}>Editable</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '8px', textAlign: 'center' }}>
                    <label style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--label-3)', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Calories</label>
                    <input
                      type="number"
                      placeholder="kcal"
                      value={customKcal}
                      onChange={e => setCustomKcal(e.target.value)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--label)', fontSize: '14px', textAlign: 'center', fontWeight: '800', padding: 0 }}
                    />
                    <span style={{ fontSize: '9.5px', color: 'var(--label-3)' }}>kcal</span>
                  </div>

                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '8px', textAlign: 'center' }}>
                    <label style={{ fontSize: '9.5px', fontWeight: '800', color: '#38bdf8', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Protein</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={customProtein}
                      onChange={e => setCustomProtein(e.target.value)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '14px', textAlign: 'center', fontWeight: '800', padding: 0 }}
                    />
                    <span style={{ fontSize: '9.5px', color: 'var(--label-3)' }}>grams</span>
                  </div>

                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '8px', textAlign: 'center' }}>
                    <label style={{ fontSize: '9.5px', fontWeight: '800', color: '#fb923c', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Carbs</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={customCarbs}
                      onChange={e => setCustomCarbs(e.target.value)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#fb923c', fontSize: '14px', textAlign: 'center', fontWeight: '800', padding: 0 }}
                    />
                    <span style={{ fontSize: '9.5px', color: 'var(--label-3)' }}>grams</span>
                  </div>

                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--sep)', borderRadius: '12px', padding: '8px', textAlign: 'center' }}>
                    <label style={{ fontSize: '9.5px', fontWeight: '800', color: '#a78bfa', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Fats</label>
                    <input
                      type="number"
                      placeholder="g"
                      value={customFat}
                      onChange={e => setCustomFat(e.target.value)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#a78bfa', fontSize: '14px', textAlign: 'center', fontWeight: '800', padding: 0 }}
                    />
                    <span style={{ fontSize: '9.5px', color: 'var(--label-3)' }}>grams</span>
                  </div>
                </div>
              </div>

              {/* Auto Calculate Kcal helper button */}
              {(customProtein || customCarbs || customFat) && (
                <button
                  type="button"
                  onClick={() => {
                    const p = parseFloat(customProtein) || 0;
                    const c = parseFloat(customCarbs) || 0;
                    const f = parseFloat(customFat) || 0;
                    const total = Math.round((p * 4) + (c * 4) + (f * 9));
                    setCustomKcal(String(total));
                  }}
                  style={{
                    background: 'none',
                    border: '1px dashed var(--sep)',
                    borderRadius: '10px',
                    padding: '8px',
                    fontSize: '11px',
                    color: 'var(--label-2)',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ⚡ Recalculate Calories from macros (P*4 + C*4 + F*9)
                </button>
              )}

              {/* Log Meal Button */}
              <button
                onClick={handleAddCustomMeal}
                style={{
                  background: 'var(--btn-pri-bg)', color: 'var(--btn-pri-color)', border: '1px solid var(--btn-pri-border)',
                  borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: '900',
                  marginTop: '4px', cursor: 'pointer', boxShadow: 'var(--btn-pri-shadow)'
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
                  ⚡ Reset to Recommended Plan
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
