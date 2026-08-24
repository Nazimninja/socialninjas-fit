import React, { useState } from 'react';
import { useStore } from '../store/useStore.js';
import Icon from '../components/Icon.jsx';
import { useUI } from '../store/useUI.js';

export default function Nutrition() {
  const S = useStore(s => s.S);
  const update = useStore(s => s.update);
  const toast = msg => useUI.getState().toast(msg);

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
  const [checkedGrocery, setCheckedGrocery] = useState({});

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
  const proteinGrams = Math.round(weight * 2.2);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatCalories / 9);

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
    toast('✓ Fit Ninja Nutrition Plan Saved');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Daily Meal Schedule
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
    if (dietType === 'vegan') {
      return [
        { meal: 'Breakfast (8:30 AM)', title: 'Tofu Scramble & Oatmeal', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.25), items: '150g Firm Tofu Scramble, 50g Oats with Chia Seeds & Almond Milk' },
        { meal: 'Lunch (1:30 PM)', title: 'Soya Chunks & Chickpea Buddha Bowl', kcal: Math.round(targetCalories * 0.35), p: Math.round(proteinGrams * 0.35), items: '60g Soya Chunks, 100g Boiled Chickpeas, Quinoa & Steamed Vegetables' },
        { meal: 'Pre-Workout Fuel (5:00 PM)', title: 'Plant Protein & Peanut Butter Toast', kcal: Math.round(targetCalories * 0.15), p: Math.round(proteinGrams * 0.2), items: '1 Scoop Pea/Rice Protein, 1 Slice Whole Grain Toast with 1 tbsp Natural Peanut Butter' },
        { meal: 'Dinner (8:30 PM)', title: 'Lentil Dal & Brown Rice Bowl', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.2), items: '1 Big Bowl Mixed Lentil Dal, 100g Cooked Brown Rice, Roasted Broccoli' },
      ];
    }
    // High protein standard (Non-Veg)
    return [
      { meal: 'Breakfast (8:30 AM)', title: 'Egg White Omelette & Rolled Oats', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.25), items: '4 Egg Whites + 1 Whole Egg, 50g Rolled Oats with Berries & Cinnamon' },
      { meal: 'Lunch (1:30 PM)', title: 'Lean Chicken Breast & Sweet Potato', kcal: Math.round(targetCalories * 0.35), p: Math.round(proteinGrams * 0.35), items: '200g Grilled Chicken Breast, 150g Baked Sweet Potato, Steamed Broccoli' },
      { meal: 'Pre-Workout Fuel (5:00 PM)', title: 'Greek Yogurt & Whey Protein', kcal: Math.round(targetCalories * 0.15), p: Math.round(proteinGrams * 0.2), items: '150g Non-fat Greek Yogurt, 1/2 Scoop Whey, 1 Rice Cake with Honey' },
      { meal: 'Dinner (8:30 PM)', title: 'White Fish / Grilled Paneer & Veggies', kcal: Math.round(targetCalories * 0.25), p: Math.round(proteinGrams * 0.2), items: '200g Tilapia or Low-fat Paneer, Large Mixed Garden Salad with Lemon Dressing' },
    ];
  };

  // Weekly Grocery Shopping List Generator
  const getGroceryList = () => {
    if (dietType === 'indian_veg') {
      return [
        { cat: '🥩 Protein Staples', items: ['Low-fat Paneer (1.5 kg)', 'Soya Chunks / Soya Granules (1 kg)', 'Firm Organic Tofu (500g)', 'Yellow Moong Dal & Toor Dal (1 kg)', 'Whey Isolate Protein Powder (1 Tub)'] },
        { cat: '🍚 Complex Carbs', items: ['Rolled Oats (1 kg)', 'Brown Rice / Red Rice (1 kg)', 'Multigrain Atta / Chapati (2 kg)', 'Moong Sprouts (500g)'] },
        { cat: '🥑 Healthy Fats & Nuts', items: ['Desi Ghee (250g)', 'Natural Peanut Butter (500g)', 'Raw Almonds & Walnuts (250g)', 'Chia Seeds (200g)'] },
        { cat: '🥦 Fresh Produce', items: ['Fresh Palak / Spinach (3 Bunches)', 'Broccoli (2 Heads)', 'Green & Yellow Bell Peppers (1 kg)', 'Cucumbers & Tomatoes (2 kg)', 'Lemons & Garlic'] }
      ];
    }
    if (dietType === 'keto') {
      return [
        { cat: '🥩 Protein & Healthy Fats', items: ['Whole Eggs (3 Dozen)', 'Grass-fed Butter (500g)', 'Chicken Thighs / Breast (2 kg)', 'Salmon Fillets (1 kg)', 'Full-fat Cottage Cheese / Paneer (1 kg)'] },
        { cat: '🥑 Keto Oils & Nuts', items: ['Avocados (6 Units)', 'Extra Virgin Olive Oil (500ml)', 'Walnuts & Pecans (300g)', 'Heavy Whipping Cream (250ml)', '90% Dark Chocolate'] },
        { cat: '🥦 Low-Carb Veggies', items: ['Asparagus Spears (500g)', 'Fresh Spinach (3 Bunches)', 'Broccoli & Cauliflower (2 Heads)', 'Romaine Lettuce'] }
      ];
    }
    if (dietType === 'vegan') {
      return [
        { cat: '🥗 Plant Protein Staples', items: ['Firm Tofu (2 kg)', 'Soya Chunks (1.5 kg)', 'Boiled Chickpeas & Black Beans (1 kg)', 'Lentils (Moong, Masoor, Chana Dal) (2 kg)', 'Pea/Rice Plant Protein Powder'] },
        { cat: '🍚 Grains & Complex Carbs', items: ['Organic Quinoa (500g)', 'Rolled Oats (1 kg)', 'Sweet Potatoes (1.5 kg)', 'Brown Rice (1 kg)'] },
        { cat: '🥑 Healthy Fats & Seeds', items: ['Natural Peanut Butter (1 kg)', 'Flax Seeds & Chia Seeds (500g)', 'Walnuts & Almonds (300g)', 'Unsweetened Almond Milk (2L)'] }
      ];
    }
    // High protein standard (Non-Veg)
    return [
      { cat: '🥩 High Protein Staples', items: ['Boneless Chicken Breast (2 kg)', 'Whole Eggs (2 Dozen)', 'Egg Whites Carton (1L)', 'Tilapia / Fish Fillets (1 kg)', 'Whey Isolate Protein (1 Tub)'] },
      { cat: '🍚 Complex Carbs', items: ['Rolled Oats (1 kg)', 'Sweet Potatoes (1.5 kg)', 'Whole Grain Multigrain Bread (1 Loaf)', 'Brown Rice (1 kg)'] },
      { cat: '🥑 Healthy Fats & Nuts', items: ['Raw Almonds (300g)', 'Natural Peanut Butter (500g)', 'Extra Virgin Olive Oil (500ml)', 'Chia Seeds'] },
      { cat: '🥦 Fresh Produce & Dairy', items: ['Non-fat Greek Yogurt (1 kg)', 'Fresh Broccoli (2 Heads)', 'Spinach & Salad Greens (3 Bunches)', 'Lemons & Garlic'] }
    ];
  };

  const meals = getMeals();
  const grocery = getGroceryList();

  const toggleGroceryItem = (item) => {
    setCheckedGrocery(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const copyGroceryListText = () => {
    let text = `🛒 FIT NINJAS WEEKLY GROCERY SHOPPING LIST\nTarget: ${targetCalories} kcal | Protein: ${proteinGrams}g\n\n`;
    grocery.forEach(g => {
      text += `${g.cat}:\n`;
      g.items.forEach(i => { text += `  [${checkedGrocery[i] ? 'X' : ' '}] ${i}\n`; });
      text += `\n`;
    });
    navigator.clipboard.writeText(text).then(() => toast('📋 Grocery list copied to clipboard!'));
  };

  return (
    <div className="view-content" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '90px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--label-1, #fff)', letterSpacing: '-0.5px' }}>
            AI Nutrition &amp; Diet Plans
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--label-3, #888)', margin: '4px 0 0' }}>
            Fit Ninja Energy, Macros &amp; Grocery Engine
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
          Body Parameters &amp; Objective
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
              <option value="high_protein">High Protein Non-Veg (Chicken, Eggs, Fish)</option>
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

      {/* Fit Ninjas Weekly Grocery Shopping List Card */}
      <div style={{
        background: 'var(--card-bg, #11141d)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
        borderRadius: '18px',
        padding: '18px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#fff', margin: 0 }}>
              🛒 Weekly Grocery Shopping List
            </h3>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
              Tailored for {dietType === 'indian_veg' ? 'Indian Vegetarian' : dietType === 'keto' ? 'Keto' : dietType === 'vegan' ? 'Vegan' : 'High Protein Non-Veg'}
            </div>
          </div>
          <button
            onClick={copyGroceryListText}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            📋 Copy List
          </button>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          {grocery.map((g, idx) => (
            <div key={idx} style={{ background: '#0a0d14', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent, #f59e0b)', marginBottom: '8px' }}>
                {g.cat}
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {g.items.map((item, i) => {
                  const isChecked = !!checkedGrocery[item];
                  return (
                    <div
                      key={i}
                      onClick={() => toggleGroceryItem(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: isChecked ? '#64748b' : '#e2e8f0',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        cursor: 'pointer',
                        padding: '2px 0'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: isChecked ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.2)',
                        background: isChecked ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#000',
                        fontWeight: '900'
                      }}>
                        {isChecked ? '✓' : ''}
                      </div>
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
