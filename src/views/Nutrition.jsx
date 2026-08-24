import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import Icon from '../components/Icon.jsx';

export default function Nutrition() {
  const S = useStore(s => s.S);
  const update = useStore(s => s.update);
  const user = useStore(s => s.user);

  // Nutrition state stored locally in Fit Ninja store or fallback
  const [weight, setWeight] = useState(() => S.nutritionWeight || 75);
  const [height, setHeight] = useState(() => S.nutritionHeight || 175);
  const [age, setAge] = useState(() => S.nutritionAge || 26);
  const [gender, setGender] = useState(() => S.nutritionGender || 'male');
  const [activity, setActivity] = useState(() => S.nutritionActivity || 'moderate');
  const [goal, setGoal] = useState(() => S.nutritionGoal || 'fat_loss');
  const [dietType, setDietType] = useState(() => S.nutritionDietType || 'high_protein');
  const [waterGlasses, setWaterGlasses] = useState(() => {
    try {
      const saved = localStorage.getItem(`fit_ninja_water_${new Date().toDateString()}`);
      return saved ? parseInt(saved, 10) : 4;
    } catch { return 4; }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Save water tracker
  const logWater = (delta) => {
    const next = Math.max(0, Math.min(20, waterGlasses + delta));
    setWaterGlasses(next);
    try { localStorage.setItem(`fit_ninja_water_${new Date().toDateString()}`, next.toString()); } catch {}
  };

  // Calculate BMR (Mifflin-St Jeor)
  const bmr = gender === 'male'
    ? Math.round(10 * weight + 6.25 * height - 5 * age + 5)
    : Math.round(10 * weight + 6.25 * height - 5 * age - 161);

  // Activity multipliers
  const actMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };
  const tdee = Math.round(bmr * (actMultipliers[activity] || 1.55));

  // Goal adjustments
  let targetCalories = tdee;
  if (goal === 'fat_loss') targetCalories = Math.round(tdee - 500);
  else if (goal === 'muscle_gain') targetCalories = Math.round(tdee + 300);
  else if (goal === 'recomp') targetCalories = Math.round(tdee - 200);

  // Macronutrient breakdown (grams)
  // Protein: 2.0g to 2.2g per kg of bodyweight
  const proteinGrams = Math.round(weight * 2.2);
  const proteinCalories = proteinGrams * 4;

  // Fats: ~25% of total calories
  const fatCalories = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatCalories / 9);

  // Remaining calories to Carbs
  const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const carbGrams = Math.round(carbCalories / 4);

  // Save changes to Fit Ninja user store
  const handleSavePreferences = () => {
    update(s => {
      s.nutritionWeight = weight;
      s.nutritionHeight = height;
      s.nutritionAge = age;
      s.nutritionGender = gender;
      s.nutritionActivity = activity;
      s.nutritionGoal = goal;
      s.nutritionDietType = dietType;
      s.targetCalories = targetCalories;
      s.targetProtein = proteinGrams;
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Sample meal suggestions based on diet type
  const getMeals = () => {
    if (dietType === 'indian_veg') {
      return [
        { meal: 'Breakfast (8:30 AM)', title: 'Paneer Bhurji & Multigrain Toast', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.25), items: '150g Low-fat Paneer, 2 Slices Whole Grain Toast, Spinach, Black Coffee' },
        { meal: 'Lunch (1:30 PM)', title: 'Soya Chunks & Dal Tadka Bowl', kcal: Math.round(targetCalories * 0.35), p: Math.round(proteinGrams * 0.35), items: '50g Soya Chunks Curry, 1 Bowl Yellow Dal, 100g Cooked Brown Rice, Green Salad' },
        { meal: 'Pre-Workout Fuel (5:00 PM)', title: 'Whey Isolate & Banana', kcal: Math.round(targetCalories * 0.15), p: Math.round(proteinGrams * 0.2), items: '1 Scoop Whey Protein with Water, 1 Medium Banana, 10 Almonds' },
        { meal: 'Dinner (8:30 PM)', title: 'Tofu/Paneer Stir-Fry & Roti', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.2), items: '150g Grilled Tofu or Paneer, Mixed Peppers & Broccoli, 1 Multigrain Chapati' },
      ];
    }
    if (dietType === 'keto') {
      return [
        { meal: 'Breakfast (8:30 AM)', title: 'Scrambled Eggs with Avocado & Butter', kcal: Math.round(targetCalories * 0.3), p: Math.round(proteinGrams * 0.3), items: '3 Whole Eggs cooked in Grass-fed Butter, 1/2 Avocado, Black Coffee' },
        { meal: 'Lunch (1:30 PM)', title: 'Grilled Chicken Caesar Salad', kcal: Math.round(targetCalories * 0.35), p: Math.round(proteinGrams * 0.4), items: '200g Grilled Chicken Breast, Romaine Lettuce, Olive Oil, Parmesan' },
        { meal: 'Snack (5:00 PM)', title: 'Walnuts & Dark Chocolate', kcal: Math.round(targetCalories * 0.1), p: Math.round(proteinGrams * 0.05), items: '30g Walnuts, 1 Square 90% Dark Chocolate' },
        { meal: 'Dinner (8:30 PM)', title: 'Pan-Seared Salmon & Asparagus', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.25), items: '180g Wild Salmon, Asparagus spears sautéed in Garlic Ghee' },
      ];
    }
    // High protein standard
    return [
      { meal: 'Breakfast (8:30 AM)', title: 'Egg White Omelette & Rolled Oats', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.25), items: '4 Egg Whites + 1 Whole Egg, 50g Rolled Oats with Berries & Cinnamon' },
      { meal: 'Lunch (1:30 PM)', title: 'Lean Chicken Breast & Sweet Potato', kcal: Math.round(targetCalories * 0.35), p: Math.round(proteinGrams * 0.35), items: '200g Grilled Chicken Breast, 150g Baked Sweet Potato, Steamed Broccoli' },
      { meal: 'Pre-Workout Fuel (5:00 PM)', title: 'Greek Yogurt & Whey Protein', kcal: Math.round(targetCalories * 0.15), p: Math.round(proteinGrams * 0.2), items: '150g Non-fat Greek Yogurt, 1/2 Scoop Whey, 1 Rice Cake with Honey' },
      { meal: 'Dinner (8:30 PM)', title: 'White Fish / Grilled Paneer & Veggies', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.2), items: '200g Tilapia or Low-fat Paneer, Large Mixed Garden Salad with Lemon Dressing' },
    ];
  };

  const meals = getMeals();

  return (
    <div className="view-content" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--label-1, #fff)', letterSpacing: '-0.5px' }}>
            AI Nutrition & Macros
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--label-3, #888)', margin: '4px 0 0' }}>
            Fit Ninja Energy & Protein Engine
          </p>
        </div>
        <button
          onClick={handleSavePreferences}
          style={{
            background: savedSuccess ? '#10b981' : 'var(--accent, #f59e0b)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 16px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {savedSuccess ? '✓ Saved!' : 'Save Plan'}
        </button>
      </div>

      {/* Target Macros Cockpit Card */}
      <div style={{
        background: 'var(--card-bg, #11141d)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
        borderRadius: '18px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent, #f59e0b)' }}>
              Daily Target Calories
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff', lineHeight: 1.1, marginTop: '4px' }}>
              {targetCalories} <span style={{ fontSize: '16px', color: 'var(--label-3, #888)', fontWeight: '500' }}>kcal</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--label-3, #888)' }}>BMR: {bmr} kcal</div>
            <div style={{ fontSize: '11px', color: 'var(--label-3, #888)' }}>TDEE: {tdee} kcal</div>
          </div>
        </div>

        {/* Macro Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
          
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase' }}>Protein</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{proteinGrams}g</div>
            <div style={{ fontSize: '10px', color: '#888' }}>{proteinCalories} kcal (40%)</div>
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>Carbs</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{carbGrams}g</div>
            <div style={{ fontSize: '10px', color: '#888' }}>{carbCalories} kcal (35%)</div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#f43f5e', textTransform: 'uppercase' }}>Fats</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{fatGrams}g</div>
            <div style={{ fontSize: '10px', color: '#888' }}>{fatCalories} kcal (25%)</div>
          </div>

        </div>
      </div>

      {/* Hydration / Water Tracker */}
      <div style={{
        background: 'var(--card-bg, #11141d)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '26px' }}>💧</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Hydration Tracker</div>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
              {waterGlasses} / 8 Glasses ({Math.round(waterGlasses * 250)} ml)
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => logWater(-1)}
            style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
          >-</button>
          <button
            onClick={() => logWater(1)}
            style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#38bdf8', border: 'none', color: '#000', fontWeight: '700', cursor: 'pointer' }}
          >+</button>
        </div>
      </div>

      {/* User Body & Goal Configuration */}
      <div style={{
        background: 'var(--card-bg, #11141d)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
        borderRadius: '18px',
        padding: '18px',
        marginBottom: '16px'
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', marginBottom: '14px' }}>
          Body Parameters & Objective
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Body Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Primary Goal</label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              style={{ width: '100%', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
            >
              <option value="fat_loss">Fat Loss (-500 kcal)</option>
              <option value="recomp">Body Recomp (-200 kcal)</option>
              <option value="maintenance">Maintenance</option>
              <option value="muscle_gain">Hypertrophy Bulking (+300 kcal)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Diet Architecture</label>
            <select
              value={dietType}
              onChange={e => setDietType(e.target.value)}
              style={{ width: '100%', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px' }}
            >
              <option value="high_protein">High Protein (Chicken, Eggs, Fish)</option>
              <option value="indian_veg">Indian Vegetarian (Paneer, Soya, Dal)</option>
              <option value="keto">Ketogenic Low-Carb</option>
              <option value="vegan">Plant-Based Vegan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggested Daily Meal Schedule */}
      <div style={{
        background: 'var(--card-bg, #11141d)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
        borderRadius: '18px',
        padding: '18px',
        marginBottom: '16px'
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', marginBottom: '14px' }}>
          Suggested Daily Meal Breakdown
        </h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          {meals.map((m, idx) => (
            <div key={idx} style={{ background: '#0a0d14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent, #f59e0b)' }}>{m.meal}</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#34d399' }}>{m.kcal} kcal · {m.p}g P</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>{m.title}</div>
              <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.4 }}>{m.items}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
