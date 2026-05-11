// ═══════════════════════════════════════════════
// MEAL PLANS — fully separated by diet type & goal
// ═══════════════════════════════════════════════
var MEAL_PLANS = {

  // ── NON-VEG ──────────────────────────────────
  nonveg: {
    muscle: [
      {t:'6:00 AM',n:'Pre-workout fuel',d:'Banana (1 medium) + soaked black chana ½ cup + 500ml water',i:'🍌',k:280,p:18,note:'Fast carbs + slow protein prevents muscle catabolism during training.'},
      {t:'8:00 AM',n:'Post-workout breakfast',d:'3 whole eggs + 2 egg whites scrambled + 3 rotis or 1 cup rice + 2 tbsp masala sauce',i:'🍳',k:620,p:46,note:'45-min post-workout window — highest muscle protein synthesis of the day. Never skip.'},
      {t:'11:00 AM',n:'Mid-morning snack',d:'Air-fried chana + peanuts 50g + fruit salad bowl (banana, papaya, guava)',i:'🥗',k:310,p:14,note:'Keeps amino acids in blood continuously. Peanuts provide arginine for blood flow.'},
      {t:'1:30 PM',n:'Lunch + sandwich option',d:'Masala chicken 200g or egg curry (3 eggs) + rice 1 cup or 3 rotis + dal 1 cup + salad. Use leftovers in whole wheat sandwich with chutney.',i:'🥙',k:740,p:55,note:'Biggest meal. Chicken provides complete amino acid profile. Dal doubles protein.'},
      {t:'5:00 PM',n:'Evening snack',d:'Air fryer sweet potato wedges + full-fat curd 200g + 1 seasonal fruit',i:'🍠',k:320,p:12,note:'Sweet potato GI 54 = sustained energy. Casein in curd is anti-catabolic overnight.'},
      {t:'8:30 PM',n:'Dinner + haldi milk',d:'Chicken/fish/eggs 180g + 2–3 rotis + seasonal sabzi + haldi milk before sleep',i:'🍛',k:560,p:44,note:'Haldi curcumin reduces muscle soreness. Feeds overnight repair during deep sleep.'}
    ],
    fat_loss: [
      {t:'7:00 AM',n:'Morning detox + protein',d:'Warm lemon water + jeera + 2 boiled eggs + black coffee (no sugar)',i:'🌅',k:210,p:14,note:'Eggs at breakfast reduce ghrelin (hunger hormone) for 4+ hours.'},
      {t:'9:00 AM',n:'Breakfast',d:'Chicken 120g or 2 egg omelette (minimal oil) + 1 roti or oats 50g + cucumber',i:'🍳',k:380,p:32,note:'High protein breakfast is the most powerful fat-loss habit. Reduces total daily intake.'},
      {t:'12:30 PM',n:'Lunch — biggest meal',d:'Chicken/fish 180g + brown rice ½ cup or 2 rotis + big salad with lemon dressing + sabzi',i:'🥗',k:520,p:42,note:'Carbs at midday when insulin sensitivity is highest. Reduce significantly at dinner.'},
      {t:'3:30 PM',n:'Snack',d:'Boiled egg (1) + roasted chana 30g + apple or guava',i:'🍎',k:220,p:14,note:'Prevents evening binge. Protein + fibre = 3 hours of satiety.'},
      {t:'7:00 PM',n:'Dinner — light carb',d:'Egg curry (2 eggs) or chicken soup + 1 roti or sweet potato + steamed vegetables',i:'🍛',k:380,p:32,note:'Reduce carbs at dinner. Activity drops — body does not need them.'},
      {t:'9:30 PM',n:'Before bed',d:'Haldi toned milk (not full fat) + 5 almonds',i:'🌙',k:160,p:8,note:'Casein overnight without excess calories. Haldi reduces inflammation.'}
    ],
    weight_gain: [
      {t:'7:00 AM',n:'Morning calorie bomb — non-negotiable',d:'Full-fat milk 300ml + 2 tbsp peanut butter + 1 banana blended',i:'🥛',k:480,p:18,note:'Stops overnight catabolism. 480 kcal in 3 minutes. Never skip this.'},
      {t:'9:00 AM',n:'Breakfast — double protein',d:'3 whole eggs + poha 1 bowl or 2 rotis with 1 tsp ghee + full-fat curd 150g',i:'🍳',k:520,p:30,note:'Ghee is medicine at your weight. Butyrate heals gut = better absorption of everything.'},
      {t:'12:00 PM',n:'Lunch — maximum density',d:'Chicken 200g or 3 eggs + rice 1.5 cups or 4 rotis with ghee + dal 1 cup + salad + sandwich with leftover protein',i:'🥙',k:820,p:52,note:'Most important meal. Add extra ghee to rotis. Use leftover protein in sandwich.'},
      {t:'3:30 PM',n:'Calorie dense snack',d:'Banana + 1.5 tbsp peanut butter on roti + 5 dates + glass of full-fat milk',i:'🍌',k:480,p:14,note:'Dates: highest calorie whole food in India. Eat 5 daily without exception.'},
      {t:'6:30 PM',n:'Evening fuel',d:'Air fryer sweet potato + full-fat curd 200g + air fryer eggs (2) or chicken 120g + fruit',i:'🍠',k:420,p:22,note:'Second protein dose. Casein through the night prevents muscle breakdown.'},
      {t:'9:00 PM',n:'Dinner + bedtime ritual',d:'Chicken 180g or egg curry + 3 rotis with ghee + sabzi + full-fat haldi milk + 1 tbsp peanut butter before sleep',i:'🍛',k:620,p:46,note:'Peanut butter before sleep prevents blood sugar drop and muscle catabolism overnight.'}
    ],
    general: [
      {t:'7:00 AM',n:'Morning fuel',d:'2 boiled eggs + banana + warm water',i:'🍌',k:280,p:16,note:'Simple, complete start to the day.'},
      {t:'9:00 AM',n:'Breakfast',d:'Egg omelette (2 eggs) + 2 rotis or poha 1 bowl + chai (low sugar)',i:'🍳',k:440,p:22,note:'Balanced protein + carb for sustained morning energy.'},
      {t:'12:30 PM',n:'Lunch',d:'Chicken 150g or egg curry + rice 1 cup or 2 rotis + dal + salad',i:'🥗',k:620,p:40,note:'Complete meal. Dal + animal protein = all amino acids covered.'},
      {t:'4:00 PM',n:'Snack',d:'Roasted chana 50g + seasonal fruit + curd 100g',i:'🥗',k:280,p:12,note:'Healthy and filling. Prevents overeating at dinner.'},
      {t:'7:30 PM',n:'Dinner',d:'Chicken/eggs 150g + 2 rotis + seasonal sabzi + curd',i:'🍛',k:500,p:36,note:'Light on carbs at night. Protein-forward.'},
      {t:'9:30 PM',n:'Before bed',d:'Haldi milk + 5 almonds',i:'🌙',k:180,p:6,note:'Anti-inflammatory. Helps sleep quality.'}
    ]
  },

  // ── EGG (EGGETARIAN) ──────────────────────────
  egg: {
    muscle: [
      {t:'6:00 AM',n:'Pre-workout fuel',d:'Banana (1) + soaked moong dal 3 tbsp + water 500ml',i:'🍌',k:270,p:16,note:'Moong dal is fastest-digesting plant protein. Fuels training without heaviness.'},
      {t:'8:00 AM',n:'Post-workout breakfast',d:'4 whole eggs scrambled + 3 rotis or 1 cup rice + 2 tbsp peanut butter on the side',i:'🍳',k:640,p:44,note:'4 eggs post-workout is optimal for leucine threshold — the switch that turns on muscle synthesis.'},
      {t:'11:00 AM',n:'Mid-morning snack',d:'Hard boiled eggs (2) + air-fried chana 40g + fruit salad bowl',i:'🥗',k:320,p:20,note:'Continuous amino acid supply between meals.'},
      {t:'1:30 PM',n:'Lunch + sandwich',d:'Egg curry (3 eggs) + rajma 1 cup + rice 1 cup or 3 rotis + salad. Egg bhurji sandwich with peanut chutney.',i:'🥙',k:720,p:48,note:'Egg + rajma together provide complete amino acid profile equal to meat.'},
      {t:'5:00 PM',n:'Evening snack',d:'Air fryer sweet potato + full-fat curd 200g + 1 fruit + 5 almonds',i:'🍠',k:330,p:12,note:'Casein from curd is slow-digesting. Feeds muscle for hours.'},
      {t:'8:30 PM',n:'Dinner + haldi milk',d:'Egg bhurji (3 eggs) or boiled eggs (3) + 3 rotis + paneer sabzi 100g + haldi milk',i:'🍛',k:560,p:44,note:'Paneer adds slow-release protein to overnight recovery.'}
    ],
    fat_loss: [
      {t:'7:00 AM',n:'Morning protein start',d:'2 boiled eggs + green tea (no sugar) + warm lemon water',i:'🌅',k:160,p:12,note:'Protein first thing suppresses hunger hormones for most of the morning.'},
      {t:'9:00 AM',n:'Breakfast',d:'2 egg omelette with vegetables (1 tsp oil) + 1 roti + cucumber slices',i:'🍳',k:340,p:22,note:'Low oil cooking essential on fat loss. Air fry or use non-stick pan.'},
      {t:'12:30 PM',n:'Lunch',d:'3 egg curry (no coconut oil) + moong dal 1 cup + 1 roti + large salad with lemon dressing',i:'🥗',k:480,p:36,note:'Eggs + moong dal = complete protein. Large salad creates volume without calories.'},
      {t:'3:30 PM',n:'Snack',d:'1 boiled egg + roasted chana 30g + guava or apple',i:'🍎',k:200,p:12,note:'Low-calorie, high-satiety. Prevents afternoon cravings.'},
      {t:'7:00 PM',n:'Dinner',d:'Egg bhurji (2 eggs, minimal oil) + 1 roti or sweet potato + steamed sabzi',i:'🍛',k:360,p:22,note:'Reduce carbs at dinner. More vegetables, less rice.'},
      {t:'9:30 PM',n:'Before bed',d:'Toned haldi milk + 4 almonds',i:'🌙',k:150,p:7,note:'Casein without excess fat for fat loss.'}
    ],
    weight_gain: [
      {t:'7:00 AM',n:'Morning calorie drink',d:'Full-fat milk 300ml + 2 tbsp peanut butter + banana + 2 raw eggs blended (pasteurized)',i:'🥛',k:580,p:30,note:'Raw pasteurized eggs in smoothie absorb faster than cooked. High-calorie morning.'},
      {t:'9:00 AM',n:'Breakfast — dense',d:'4 whole eggs (any style) + poha 1 bowl or 2 rotis with ghee + full-fat curd',i:'🍳',k:580,p:36,note:'4 eggs for breakfast is optimal when gaining weight. Yolks contain all the fat and vitamins.'},
      {t:'12:00 PM',n:'Lunch',d:'Egg curry (4 eggs) or paneer 150g + rice 1.5 cups or 4 rotis with ghee + dal 1 cup + salad',i:'🥙',k:780,p:46,note:'Biggest meal. Ghee on every roti — adds 45 kcal per tsp and heals your gut.'},
      {t:'3:30 PM',n:'Calorie dense snack',d:'Banana + peanut butter 2 tbsp on roti + 5 dates + full-fat milk 250ml',i:'🍌',k:500,p:16,note:'Dates + banana + peanut butter = fastest calorie-dense combination.'},
      {t:'6:30 PM',n:'Evening fuel',d:'Boiled eggs (3) + air fryer sweet potato + curd 200g + fruit',i:'🍠',k:420,p:28,note:'Third protein hit of the day. Important for continuous muscle synthesis.'},
      {t:'9:00 PM',n:'Dinner + bedtime',d:'Egg bhurji (4 eggs) + 3 rotis with ghee + paneer sabzi + haldi full-fat milk + peanut butter',i:'🍛',k:680,p:44,note:'Paneer + eggs together gives casein + whey-like effect for overnight recovery.'}
    ],
    general: [
      {t:'7:00 AM',n:'Morning',d:'2 boiled eggs + banana + warm water',i:'🍌',k:260,p:14,note:''},
      {t:'9:00 AM',n:'Breakfast',d:'Omelette (2 eggs) + 2 rotis + chai (less sugar)',i:'🍳',k:420,p:20,note:''},
      {t:'12:30 PM',n:'Lunch',d:'Egg curry (2–3 eggs) + rice 1 cup + dal + salad',i:'🥗',k:580,p:34,note:''},
      {t:'4:00 PM',n:'Snack',d:'Hard boiled egg + roasted chana + fruit',i:'🥗',k:250,p:14,note:''},
      {t:'7:30 PM',n:'Dinner',d:'Egg bhurji (2 eggs) + 2 rotis + sabzi + curd',i:'🍛',k:460,p:28,note:''},
      {t:'9:30 PM',n:'Before bed',d:'Haldi milk + 5 almonds',i:'🌙',k:180,p:6,note:''}
    ]
  },

  // ── VEGETARIAN ────────────────────────────────
  veg: {
    muscle: [
      {t:'6:00 AM',n:'Pre-workout fuel',d:'Banana (1) + soaked overnight moong dal 4 tbsp + water',i:'🍌',k:260,p:14,note:'Moong dal is the fastest-digesting plant protein. Pre-workout protein prevents muscle breakdown.'},
      {t:'8:00 AM',n:'Post-workout breakfast',d:'Paneer bhurji 150g (low oil) + 3 rotis or 1 cup rice + 2 tbsp peanut butter',i:'🍛',k:620,p:38,note:'Paneer + peanut butter together hit the leucine threshold needed to switch on muscle synthesis.'},
      {t:'11:00 AM',n:'Mid-morning snack',d:'Air-fried chana + peanuts 60g + fruit salad bowl (banana, papaya, guava)',i:'🥗',k:330,p:16,note:'Continuous protein. Peanuts provide arginine — increases blood flow to muscles.'},
      {t:'1:30 PM',n:'Lunch + sandwich',d:'Rajma 1.5 cups or chole 1.5 cups + rice 1 cup or 4 rotis + sabzi + big salad. Smash rajma into roti for kathi roll.',i:'🥙',k:740,p:36,note:'Rajma + roti = complete protein. All 9 essential amino acids together.'},
      {t:'5:00 PM',n:'Evening snack',d:'Air fryer sweet potato + full-fat curd 200g + mixed nuts 30g (almonds, walnuts)',i:'🍠',k:380,p:14,note:'Walnuts: omega-3 reduces inflammation. Curd casein is slow-digesting protein.'},
      {t:'8:30 PM',n:'Dinner + haldi milk',d:'Paneer sabzi 200g or tofu bhurji + 3 rotis with ghee + dal 1 cup + haldi milk',i:'🍲',k:600,p:38,note:'Paneer + dal = complete protein evening combination. Haldi curcumin reduces soreness.'}
    ],
    fat_loss: [
      {t:'7:00 AM',n:'Morning protein start',d:'Warm lemon water + green tea + handful almonds (10) + 1 fruit',i:'🌅',k:200,p:6,note:'Almonds raise metabolism through thermic effect. Green tea increases fat oxidation.'},
      {t:'9:00 AM',n:'Breakfast',d:'Paneer 100g (grilled or air fried, minimal oil) + moong dal chilla 2 pieces + cucumber',i:'🍳',k:380,p:24,note:'Moong dal chilla = high-protein pancake. Paneer + dal = complete amino acids.'},
      {t:'12:30 PM',n:'Lunch',d:'Rajma or chole 1 cup + 1 roti or brown rice ½ cup + large sabzi + big salad with lemon',i:'🥗',k:460,p:20,note:'Legumes are fat-loss friendly: high fibre fills the stomach, slow digestion reduces hunger.'},
      {t:'3:30 PM',n:'Snack',d:'Roasted chana 40g + guava or apple + curd 100g (fat-free or low fat)',i:'🍎',k:210,p:12,note:''},
      {t:'7:00 PM',n:'Dinner',d:'Paneer 120g (grilled) + 1 roti + moong dal 1 cup + steamed sabzi',i:'🍛',k:400,p:24,note:'Light carb dinner. Protein-heavy to preserve muscle during deficit.'},
      {t:'9:30 PM',n:'Before bed',d:'Toned haldi milk (no sugar) + 5 almonds',i:'🌙',k:160,p:7,note:''}
    ],
    weight_gain: [
      {t:'7:00 AM',n:'Morning calorie bomb',d:'Full-fat milk 300ml + 3 tbsp peanut butter + banana + 1 tsp ghee — blend',i:'🥛',k:550,p:18,note:'This drink alone can add 0.3kg/month. Do it every single day.'},
      {t:'9:00 AM',n:'Breakfast — dense',d:'Paneer bhurji 200g + 2 rotis with ghee + full-fat curd 150g + 5 dates',i:'🍛',k:580,p:30,note:'Ghee on every roti. Dates = iron + magnesium + 25 kcal each.'},
      {t:'12:00 PM',n:'Lunch',d:'Rajma or chole 2 cups + rice 1.5 cups or 4 rotis with ghee + dal 1 cup + salad + rajma kathi roll',i:'🥙',k:820,p:38,note:'Biggest meal. Double legume serves. Ghee on everything.'},
      {t:'3:30 PM',n:'Calorie snack',d:'Banana + 2 tbsp peanut butter on roti + 5 dates + full-fat milk 250ml',i:'🍌',k:520,p:16,note:''},
      {t:'6:30 PM',n:'Evening fuel',d:'Paneer 150g (air fried with spices) + air fryer sweet potato + curd 200g + fruit',i:'🍠',k:480,p:24,note:'Third protein hit. Essential for continuous muscle synthesis.'},
      {t:'9:00 PM',n:'Dinner + bedtime',d:'Paneer sabzi 200g + 3 rotis with ghee + dal makhani 1 cup + full-fat haldi milk + peanut butter 1 tbsp',i:'🍲',k:700,p:40,note:'Dal makhani is calorically dense and high protein — best weight-gain dal.'}
    ],
    general: [
      {t:'7:00 AM',n:'Morning',d:'Warm water + banana + 10 almonds',i:'🍌',k:230,p:6,note:''},
      {t:'9:00 AM',n:'Breakfast',d:'Moong dal chilla 2 + curd + chai (low sugar)',i:'🍳',k:380,p:18,note:''},
      {t:'12:30 PM',n:'Lunch',d:'Rajma or dal + rice 1 cup + sabzi + salad',i:'🥗',k:560,p:22,note:''},
      {t:'4:00 PM',n:'Snack',d:'Roasted chana + fruit + curd 100g',i:'🥗',k:250,p:10,note:''},
      {t:'7:30 PM',n:'Dinner',d:'Paneer sabzi 150g + 2 rotis + dal + curd',i:'🍛',k:520,p:26,note:''},
      {t:'9:30 PM',n:'Before bed',d:'Haldi milk + 5 almonds',i:'🌙',k:180,p:6,note:''}
    ]
  },

  // ── VEGAN ─────────────────────────────────────
  vegan: {
    muscle: [
      {t:'6:00 AM',n:'Pre-workout fuel',d:'Banana + soaked overnight black chana ½ cup + coconut water 300ml',i:'🍌',k:280,p:14,note:'Coconut water provides electrolytes for performance. Black chana is the highest plant protein legume.'},
      {t:'8:00 AM',n:'Post-workout breakfast',d:'Tofu scramble 200g (with haldi + capsicum) + 3 rotis or rice 1 cup + 3 tbsp peanut butter',i:'🍛',k:600,p:38,note:'Tofu provides leucine. Peanut butter adds fat and protein. Together they approach leucine threshold.'},
      {t:'11:00 AM',n:'Mid-morning snack',d:'Air-fried chana + peanuts 60g + fruit salad bowl + coconut yogurt 150g',i:'🥗',k:340,p:16,note:'Coconut yogurt provides probiotics. Plant protein throughout the day is essential.'},
      {t:'1:30 PM',n:'Lunch + roll',d:'Chole 1.5 cups + rice 1 cup or 4 rotis + moong dal 1 cup + salad. Chole-roti kathi roll with onion.',i:'🥙',k:720,p:34,note:'Chole + roti + moong dal = nearly complete amino acid profile. Best vegan protein lunch.'},
      {t:'5:00 PM',n:'Evening snack',d:'Air fryer sweet potato + cashew curd 200g + mixed nuts 35g + 1 fruit',i:'🍠',k:400,p:12,note:'Cashew curd (DIY or store) provides plant-based slow protein. Nuts provide essential fats.'},
      {t:'8:30 PM',n:'Dinner + golden milk',d:'Tofu sabzi 200g or rajma 1.5 cups + 3 rotis with coconut oil + dal makhani (vegan) + plant golden milk',i:'🍲',k:620,p:36,note:'Rajma + tofu together approach complete protein. Plant golden milk: oat milk + haldi + black pepper.'}
    ],
    fat_loss: [
      {t:'7:00 AM',n:'Morning',d:'Warm lemon water + green tea + 10 almonds + 1 fruit',i:'🌅',k:190,p:5,note:''},
      {t:'9:00 AM',n:'Breakfast',d:'Tofu scramble 150g (minimal oil) + 1 roti + moong dal chilla 1',i:'🍛',k:360,p:24,note:''},
      {t:'12:30 PM',n:'Lunch',d:'Chole or rajma 1 cup + 1 roti + big salad + steamed sabzi',i:'🥗',k:440,p:18,note:''},
      {t:'3:30 PM',n:'Snack',d:'Roasted chana 40g + guava + cashew curd 100g',i:'🍎',k:220,p:10,note:''},
      {t:'7:00 PM',n:'Dinner',d:'Tofu 150g (grilled) + 1 roti + moong dal + steamed vegetables',i:'🍛',k:380,p:24,note:''},
      {t:'9:30 PM',n:'Before bed',d:'Oat milk with haldi + 5 walnuts',i:'🌙',k:170,p:5,note:''}
    ],
    weight_gain: [
      {t:'7:00 AM',n:'Morning calorie bomb',d:'Oat milk 300ml + 3 tbsp peanut butter + banana + 1 tsp coconut oil — blend',i:'🥛',k:520,p:16,note:''},
      {t:'9:00 AM',n:'Breakfast dense',d:'Tofu scramble 200g + 2 rotis with coconut oil + cashew curd 150g + 5 dates',i:'🍛',k:560,p:28,note:''},
      {t:'12:00 PM',n:'Lunch',d:'Rajma + chole 2 cups + rice 1.5 cups or 4 rotis with coconut oil + dal + salad',i:'🥙',k:800,p:36,note:''},
      {t:'3:30 PM',n:'Snack',d:'Banana + peanut butter 2 tbsp on roti + 5 dates + oat milk 250ml',i:'🍌',k:510,p:14,note:''},
      {t:'6:30 PM',n:'Evening fuel',d:'Tofu 200g + air fryer sweet potato + cashew curd 200g + fruit',i:'🍠',k:480,p:24,note:''},
      {t:'9:00 PM',n:'Dinner + bedtime',d:'Tofu sabzi 200g + 3 rotis + dal makhani vegan + oat golden milk + peanut butter',i:'🍲',k:680,p:36,note:''}
    ],
    general: [
      {t:'7:00 AM',n:'Morning',d:'Warm water + banana + 10 almonds',i:'🍌',k:220,p:6,note:''},
      {t:'9:00 AM',n:'Breakfast',d:'Moong dal chilla 2 + coconut curd + chai oat milk',i:'🍳',k:360,p:16,note:''},
      {t:'12:30 PM',n:'Lunch',d:'Rajma or chole + rice 1 cup + sabzi + salad',i:'🥗',k:540,p:20,note:''},
      {t:'4:00 PM',n:'Snack',d:'Roasted chana + fruit + cashew curd',i:'🥗',k:260,p:10,note:''},
      {t:'7:30 PM',n:'Dinner',d:'Tofu bhurji 150g + 2 rotis + dal + cashew curd',i:'🍛',k:500,p:24,note:''},
      {t:'9:30 PM',n:'Before bed',d:'Oat milk haldi + walnuts',i:'🌙',k:170,p:5,note:''}
    ]
  }
};

// ═══════════════════════════════════════════════
// EXERCISE DATABASE WITH DEMO INFO
// ═══════════════════════════════════════════════
var EXERCISES = {
  // PUSH
  flat_bench: {n:'Flat bench press',b:'push',ytId:'SCVCLChPQgs',muscles:['Chest','Triceps','Front delts'],cues:['Grip slightly wider than shoulder-width','Lower bar to mid-chest, elbows at 45–75°','Drive feet into floor and arch naturally','Press bar up and slightly back toward face','Lock out at top without hyperextending']},
  incline_db: {n:'Incline dumbbell press',b:'push',ytId:'8iPEnn-ltC8',muscles:['Upper chest','Front delts','Triceps'],cues:['Set bench to 30–45°','Start with dumbbells at shoulder level','Rotate wrists slightly during press','Feel upper chest stretch at bottom','Squeeze for 1 second at top']},
  cable_flyes: {n:'Cable flyes',b:'push',ytId:'Iwe6AmxVf7o',muscles:['Chest (inner)','Front delts'],cues:['Stand centered between cables','Slight forward lean, slight elbow bend','Lead with elbows, not hands','Squeeze chest hard at the crossover point','Control the return — the stretch is where growth happens']},
  ohp: {n:'Overhead press',b:'push',ytId:'CnBmiBqp-AI',muscles:['Shoulders (all heads)','Triceps','Upper traps'],cues:['Grip just outside shoulder width','Brace core like you\'re about to be punched','Press bar in straight line overhead','Tuck chin as bar passes face','Lock out completely at top']},
  lateral_raise: {n:'Lateral raises',b:'push',ytId:'3VcKaXpzqRo',muscles:['Lateral deltoid'],cues:['Slight forward lean, slight elbow bend','Lead with elbows, not wrists','Stop when arms are parallel to floor','No swinging — control every inch','Pause at top for 1 second']},
  tricep_pushdown: {n:'Tricep pushdown',b:'push',ytId:'2-LAMcpzODU',muscles:['Triceps (all 3 heads)'],cues:['Elbows stay pinned at your sides','Only your forearms move','Push bar to full lockout','Control the return to 90°','Lean slightly forward for better angle']},
  dips: {n:'Dips',b:'push',ytId:'2z8JmcrW-As',muscles:['Chest','Triceps','Front delts'],cues:['Lean slightly forward for chest focus','Lower until upper arm is parallel','Keep elbows slightly flared','Drive through palms to press back up','Full lockout at top']},
  skull_crushers: {n:'Skull crushers',b:'push',ytId:'d_KZxkY_5cM',muscles:['Triceps (long head)'],cues:['Lower bar to forehead — not behind head','Keep elbows pointing at ceiling','Full stretch at bottom = maximum growth','Press back to full extension','Use lighter weight for safety']},
  // PULL
  deadlift: {n:'Deadlift',b:'pull',ytId:'op9kVnSso6Q',muscles:['Hamstrings','Glutes','Lower back','Traps','Forearms'],cues:['Bar over mid-foot (1 inch from shin)','Push floor away — don\'t think about pulling','Hips and shoulders rise at same rate','Keep bar dragging against your body','Lock hips forward at top — don\'t hyperextend']},
  lat_pulldown: {n:'Lat pulldown (wide grip)',b:'pull',ytId:'CAwf9n_RQRU',muscles:['Lats','Biceps','Rear delts'],cues:['Lean slightly back, chest up','Pull bar to upper chest — not behind neck','Squeeze shoulder blades at bottom','Control the return — don\'t let bar fly up','Feel the lat stretch at the top']},
  cable_row: {n:'Seated cable row',b:'pull',ytId:'GZbfZ033f74',muscles:['Mid back','Lats','Biceps'],cues:['Full stretch forward — hunch slightly','Pull handle to lower chest/upper abs','Drive elbows back, squeeze blades together','Don\'t lean excessively — torso control','Slow 2-second eccentric']},
  db_row: {n:'Single arm dumbbell row',b:'pull',ytId:'roCP452HZOI',muscles:['Lats','Rhomboids','Rear delts','Biceps'],cues:['Support with knee and hand on bench','Pull dumbbell to your hip — not shoulder','Lead with elbow, not hand','Full stretch at the bottom is critical','Rotate torso slightly for extra range']},
  face_pulls: {n:'Face pulls',b:'pull',ytId:'HSoHeSjFSJA',muscles:['Rear delts','Rotator cuff','Upper traps'],cues:['Set cable at face height','Grip rope handles with thumbs up','Pull toward face — spread the rope','External rotate — hands end up beside ears','Control the return — slow eccentric']},
  bicep_curl: {n:'Barbell curl',b:'pull',ytId:'kwG2ipFRgfo',muscles:['Biceps','Brachialis'],cues:['Elbows pinned at your sides','Full extension at the bottom — key for growth','Squeeze hard at the top','No swinging — pure arm curl','Try 3-second eccentric for extra gains']},
  pull_ups: {n:'Pull-ups / Weighted pull-ups',b:'pull',ytId:'eGo4IYlbE5g',muscles:['Lats','Biceps','Rear delts'],cues:['Start from dead hang — full extension','Initiate by depressing shoulder blades','Pull until chin clears the bar','Don\'t cross your feet — kip is cheating','Add weight when 12 reps feel easy']},
  face_pull2: {n:'Hammer curls',b:'pull',ytId:'TwD-YGVP4Bk',muscles:['Brachialis','Brachioradialis','Biceps'],cues:['Neutral grip (palms face each other)','Same strict form as bicep curl','Develops the width of the arm','Alternate arms for better focus','Great for forearm strength too']},
  // LEGS
  squat: {n:'Barbell back squat',b:'legs',ytId:'ultWZbUMPL8',muscles:['Quads','Glutes','Hamstrings','Core'],cues:['Bar on upper traps — not neck','Feet shoulder-width, toes slightly out','Break parallel — hip crease below knee cap','Keep chest up, don\'t round lower back','Drive knees out as you ascend']},
  rdl: {n:'Romanian deadlift (RDL)',b:'legs',ytId:'JCXUYuzwNrM',muscles:['Hamstrings','Glutes','Lower back'],cues:['Push hips back — it\'s a hip hinge','Keep bar close to body throughout','Feel hamstring stretch at the bottom','Slight knee bend — not a squat','Stop when lower back would round']},
  leg_press: {n:'Leg press',b:'legs',ytId:'IZxyjW7MPJQ',muscles:['Quads','Glutes','Hamstrings'],cues:['High foot position = more glute/hamstring','Never lock knees at the top','Full range — 90° knee angle at bottom','Control the weight down — 2 seconds','Don\'t let hips come off the pad']},
  leg_curl: {n:'Leg curl (machine)',b:'legs',ytId:'1Tq3QdYUuHs',muscles:['Hamstrings'],cues:['Adjust pad just above the ankle','Full range — squeeze at the top','Slow 3-second eccentric is key','Don\'t let hips rise off the bench','Plantarflex (point toes) for more range']},
  lunges: {n:'Walking lunges',b:'legs',ytId:'L8fvypPrzzs',muscles:['Quads','Glutes','Hamstrings','Balance'],cues:['Step far enough — knee stays behind toes','Lower back knee almost to the floor','Stay upright — don\'t lean forward','Push through front heel to stand','Add dumbbells when bodyweight is easy']},
  calf_raises: {n:'Standing calf raises',b:'legs',ytId:'gwLzBHcmqRM',muscles:['Gastrocnemius','Soleus'],cues:['Full stretch at the bottom every rep','Rise to tippy-toes at the top','Pause 1 second at top and bottom','Slow eccentric — 3 seconds down','Calves respond to high volume — 20+ reps']},
  // ABS
  plank: {n:'Plank',b:'abs',ytId:'pSHjTRCQxIw',muscles:['Core (all)','Shoulders'],cues:['Straight line from head to heel','Don\'t let hips sag or pike up','Breathe normally — don\'t hold breath','Squeeze glutes and abs together','Build to 60 seconds before adding time']},
  leg_raises: {n:'Hanging leg raises',b:'abs',ytId:'Pr1ieGZ5atk',muscles:['Lower abs','Hip flexors'],cues:['Start from dead hang','Breathe out as you raise legs','Control the descent — don\'t swing','Aim for 90° or higher','Posterior pelvic tilt for maximum abs engagement']},
  crunches: {n:'Cable crunch',b:'abs',ytId:'2fbujeH3F0E',muscles:['Rectus abdominis'],cues:['Keep hips still — only torso moves','Crunch toward your hips, not the floor','Exhale forcefully at the bottom','Control the return — don\'t let cable pull you up','Use weight that allows full range']},
  bicycle: {n:'Bicycle crunches',b:'abs',ytId:'1we3bh9uhqY',muscles:['Obliques','Rectus abdominis'],cues:['Don\'t pull your neck — hands are light support','Rotate from the torso, not the elbows','Extend the straight leg fully','Slow and controlled — not a race','Feel the oblique squeeze on each rotation']},
  // CARDIO
  hiit_treadmill: {n:'HIIT treadmill',b:'cardio',ytId:'fYB5h2Bv_EM',muscles:['Full body cardio'],cues:['Sprint at 80–85% max effort','If you can talk, you\'re not going hard enough','30-sec sprint, 90-sec walk — 7 rounds total','Hold sides of treadmill is cheating','Cool down with 5 min walk after']},
  // HOME
  bodyweight_squat: {n:'Bodyweight squats',b:'home',ytId:'YaXPRqUwItQ',muscles:['Quads','Glutes','Hamstrings'],cues:['Feet shoulder width, toes slightly out','Lower until thighs parallel to floor','Keep chest up and knees tracking over toes','2 sec down, 1 sec hold, 2 sec up','Add a jump when this becomes easy']},
  pushup: {n:'Push-ups',b:'home',ytId:'IODxDxX7oi4',muscles:['Chest','Triceps','Front delts','Core'],cues:['Hands slightly wider than shoulders','Lower chest to floor — full range only','Elbows at 45° — not flared or tucked','Keep core tight — straight body line','Progress: wall → incline → full → archer push-up']},
  glute_bridge: {n:'Glute bridge',b:'home',ytId:'OUgsJ8-Vi0E',muscles:['Glutes','Hamstrings','Core'],cues:['Feet flat, knees bent at 90°','Drive through heels — not toes','Squeeze glutes hard at the top for 1 second','Push knees outward — don\'t let them cave','Progress to single-leg version']},
  superman: {n:'Superman hold',b:'home',ytId:'z6PJMT2y8GQ',muscles:['Lower back','Glutes','Upper back'],cues:['Lift arms AND legs simultaneously','Hold for 2 seconds at the top','Don\'t strain your neck — look down','Start with 3 seconds up, 3 down','Most underrated bodyweight exercise for back health']}
};

// ═══════════════════════════════════════════════
// WORKOUT PROGRAMS — by location + days
// ═══════════════════════════════════════════════
var WORKOUT_PROGRAMS = {
  gym_5: [
    {n:'Mon',t:'Push',r:false,exKeys:['flat_bench','incline_db','cable_flyes','ohp','lateral_raise','tricep_pushdown','plank']},
    {n:'Tue',t:'Pull',r:false,exKeys:['deadlift','lat_pulldown','cable_row','db_row','face_pulls','bicep_curl','leg_raises']},
    {n:'Wed',t:'Legs',r:false,exKeys:['squat','rdl','leg_press','leg_curl','lunges','calf_raises','crunches']},
    {n:'Thu',t:'Push+HIIT',r:false,exKeys:['incline_db','ohp','cable_flyes','dips','skull_crushers','hiit_treadmill','bicycle']},
    {n:'Fri',t:'Pull+HIIT',r:false,exKeys:['pull_ups','cable_row','lat_pulldown','bicep_curl','face_pulls','hiit_treadmill','plank']},
    {n:'Sat',t:'Legs+Abs',r:false,exKeys:['squat','leg_press','leg_curl','plank','leg_raises','crunches','bicycle']},
    {n:'Sun',t:'Rest',r:true,exKeys:[]}
  ],
  gym_4: [
    {n:'Mon',t:'Upper A',r:false,exKeys:['flat_bench','ohp','lat_pulldown','cable_row','tricep_pushdown','bicep_curl','plank']},
    {n:'Tue',t:'Lower A',r:false,exKeys:['squat','rdl','leg_press','calf_raises','plank','leg_raises']},
    {n:'Wed',t:'Rest',r:true,exKeys:[]},
    {n:'Thu',t:'Upper B',r:false,exKeys:['incline_db','pull_ups','cable_flyes','face_pulls','dips','face_pull2','bicycle']},
    {n:'Fri',t:'Lower B',r:false,exKeys:['squat','leg_curl','lunges','calf_raises','crunches','bicycle']},
    {n:'Sat',t:'Rest',r:true,exKeys:[]},
    {n:'Sun',t:'Rest',r:true,exKeys:[]}
  ],
  gym_3: [
    {n:'Mon',t:'Full body A',r:false,exKeys:['flat_bench','squat','lat_pulldown','ohp','leg_press','plank']},
    {n:'Tue',t:'Rest',r:true,exKeys:[]},
    {n:'Wed',t:'Full body B',r:false,exKeys:['incline_db','rdl','cable_row','lateral_raise','calf_raises','leg_raises']},
    {n:'Thu',t:'Rest',r:true,exKeys:[]},
    {n:'Fri',t:'Full body C',r:false,exKeys:['deadlift','ohp','pull_ups','leg_curl','tricep_pushdown','bicycle']},
    {n:'Sat',t:'Rest',r:true,exKeys:[]},
    {n:'Sun',t:'Rest',r:true,exKeys:[]}
  ],
  home_4: [
    {n:'Mon',t:'Full body',r:false,exKeys:['bodyweight_squat','pushup','glute_bridge','superman','plank','bicycle']},
    {n:'Tue',t:'Walk 30min',r:true,exKeys:[]},
    {n:'Wed',t:'Lower body',r:false,exKeys:['bodyweight_squat','glute_bridge','lunges','calf_raises','leg_raises','plank']},
    {n:'Thu',t:'Rest',r:true,exKeys:[]},
    {n:'Fri',t:'Upper body',r:false,exKeys:['pushup','superman','plank','bicycle','crunches']},
    {n:'Sat',t:'Cardio+Core',r:false,exKeys:['bodyweight_squat','pushup','plank','leg_raises','bicycle']},
    {n:'Sun',t:'Rest',r:true,exKeys:[]}
  ],
  home_3: [
    {n:'Mon',t:'Full body A',r:false,exKeys:['bodyweight_squat','pushup','glute_bridge','plank']},
    {n:'Tue',t:'Rest / Walk',r:true,exKeys:[]},
    {n:'Wed',t:'Full body B',r:false,exKeys:['bodyweight_squat','superman','pushup','bicycle','leg_raises']},
    {n:'Thu',t:'Rest',r:true,exKeys:[]},
    {n:'Fri',t:'Full body C',r:false,exKeys:['lunges','pushup','glute_bridge','plank','crunches']},
    {n:'Sat',t:'Rest / Walk',r:true,exKeys:[]},
    {n:'Sun',t:'Rest',r:true,exKeys:[]}
  ]
};

// ═══════════════════════════════════════════════
// SET SCHEMES per muscle group
// ═══════════════════════════════════════════════
var SET_SCHEMES = {
  push: {sets:4, reps:'8–12', rest:'90 sec'},
  pull: {sets:4, reps:'6–12', rest:'90 sec'},
  legs: {sets:4, reps:'8–15', rest:'2 min'},
  abs:  {sets:3, reps:'15–20', rest:'45 sec'},
  cardio: {sets:1, reps:'15 min HIIT', rest:'—'},
  home: {sets:3, reps:'12–20 slow', rest:'60 sec'}
};

// ═══════════════════════════════════════════════
// RECIPES
// ═══════════════════════════════════════════════
var RECIPES = [
  {cat:'air',i:'🍗',n:'Crispy batch chicken',tag:'Air Fryer · 180°C · 22 min',tcls:'rgba(255,92,92,.14)',tc:'#FCA5A5',p:'42g / 200g',k:'220 kcal',d:'Dice 1kg boneless chicken evenly. Mix: 1 tsp haldi + 1 tsp red chilli + 1 tsp garlic powder + 1.5 tsp salt + 1 tbsp oil. Coat and marinate 20 min. Air fry 180°C 12 min, shake basket, 10 more min. Slice thin. Store 5 days in fridge. Use in curries, sandwiches, salads. Add masala base to reheat as curry.',dietTags:['nonveg']},
  {cat:'air',i:'🫙',n:'Air fryer paneer tikka',tag:'Air Fryer · 200°C · 14 min',tcls:'rgba(255,92,92,.14)',tc:'#FCA5A5',p:'28g / 200g',k:'320 kcal',d:'Cut 200g paneer into cubes. Marinate in curd (or coconut yogurt for vegan) + red chilli + haldi + salt + garam masala + 1 tsp oil. 30 min or overnight. Air fry 200°C 14 min. Highest protein air fryer option for veg/vegan.',dietTags:['veg','vegan','egg']},
  {cat:'air',i:'🍠',n:'Sweet potato wedges',tag:'Air Fryer · 200°C · 15 min',tcls:'rgba(255,184,0,.14)',tc:'#FCD34D',p:'3g',k:'150 kcal',d:'Cut sweet potato into wedges — no peeling needed. Toss with ½ tsp oil + salt + jeera powder. Single layer in basket. 200°C 15 min, shake at 8 min. GI of 54 vs white potato 80. Best complex carb for evening snack — sustained energy without blood sugar spike.',dietTags:['nonveg','egg','veg','vegan']},
  {cat:'air',i:'🌰',n:'Chana + peanut roast',tag:'Air Fryer · 180°C · 12 min',tcls:'rgba(255,184,0,.14)',tc:'#FCD34D',p:'16g / 50g',k:'200 kcal',d:'Raw chana + raw peanuts mixed. Toss with salt + red chilli + haldi. 180°C 12 min shaking halfway. Batch cook for the week. Stores at room temperature. Highest protein-per-rupee snack in India. 16g protein per 50g.',dietTags:['nonveg','egg','veg','vegan']},
  {cat:'batch',i:'🫙',n:'Master masala base',tag:'Batch · Pan · 20 min · 7-day fridge',tcls:'rgba(0,229,160,.14)',tc:'var(--ac)',p:'Base',k:'—',d:'Blend raw: 4 large tomatoes + 2 onions + 6 garlic + 1 inch ginger (no water). Heat 2 tbsp oil medium heat. Pour in blended mix — it will splatter, use lid. Cook 15 min stirring every 2 min until thick and dark and oil separates (this means it\'s done). Add: 1 tsp each haldi, coriander, red chilli, 1.5 tsp salt. Cook 5 more min. Store in glass jar. This eliminates daily cooking — add 3 tbsp to any protein + ½ cup water = curry in 10 min.',dietTags:['nonveg','egg','veg','vegan']},
  {cat:'batch',i:'🍗',n:'Masala chicken curry',tag:'Batch · Pressure cooker · 30 min',tcls:'rgba(0,229,160,.14)',tc:'var(--ac)',p:'35g / 200g',k:'280 kcal',d:'4 tbsp masala base + ½ cup water in pressure cooker. Add 1kg diced boneless chicken. 3 whistles on medium. Done. Store 5 days. Reheat 2 min. Most efficient way to cook protein for the week. Slice and use in sandwiches cold, or reheat for curry.',dietTags:['nonveg']},
  {cat:'batch',i:'🫘',n:'Rajma or chole curry',tag:'Batch · Pressure cooker · 35 min',tcls:'rgba(0,229,160,.14)',tc:'var(--ac)',p:'18g / cup',k:'240 kcal',d:'Soak 2 cups rajma or kabuli chana overnight (8 hours minimum — critical). Drain, rinse. Pressure cook 7–8 whistles. Add 4 tbsp masala base + ½ cup cooking water. Simmer 10 min. Fridge 5 days. Rajma + roti = complete protein with all essential amino acids. Best plant protein source.',dietTags:['nonveg','egg','veg','vegan']},
  {cat:'batch',i:'🍲',n:'Mixed dal (toor + chana)',tag:'Batch · Pressure cooker · 20 min',tcls:'rgba(0,229,160,.14)',tc:'var(--ac)',p:'18g / cup',k:'220 kcal',d:'1 cup toor dal + ½ cup chana dal + haldi + salt. Pressure cook 4 whistles. Reheat daily — stir 1 tbsp masala base into portion when heating. High in protein, folate, and iron. For vegan members: this is your primary daily protein alongside legumes.',dietTags:['nonveg','egg','veg','vegan']},
  {cat:'quick',i:'🥚',n:'Egg bhurji (8 min)',tag:'Quick · Pan · 8 min',tcls:'rgba(108,142,255,.14)',tc:'#A5B4FC',p:'28g for 3 eggs',k:'280 kcal',d:'Sauté ½ onion + ¼ capsicum + 1 tomato in 1 tsp oil, 3 min. Beat 3–4 eggs with haldi + salt. Pour in, scramble on medium. Remove while slightly wet. Use in sandwich or with rotis. 8 minutes from cold pan to eating. Best backup when nothing is prepped.',dietTags:['nonveg','egg']},
  {cat:'quick',i:'🍛',n:'Tofu scramble (vegan egg bhurji)',tag:'Quick · Pan · 10 min',tcls:'rgba(108,142,255,.14)',tc:'#A5B4FC',p:'18g / 200g',k:'220 kcal',d:'Crumble 200g firm tofu. Sauté ½ onion + capsicum + tomato 3 min. Add tofu + haldi + red chilli + salt + kala namak (gives egg flavor). Cook on medium 5 min stirring. Kala namak is the key ingredient — gives sulfurous egg-like taste. Works in sandwiches exactly like bhurji.',dietTags:['vegan','veg']},
  {cat:'quick',i:'🥜',n:'Peanut-coconut chutney',tag:'No cook · 5 min · 5-day fridge',tcls:'rgba(108,142,255,.14)',tc:'#A5B4FC',p:'8g / 3 tbsp',k:'180 kcal',d:'Roast 100g peanuts in air fryer 3 min. Blend: roasted peanuts + ½ cup coconut + 2 green chillies + 1 tsp salt + juice of 1 lemon + ¼ cup water. Smooth paste. Use on sandwiches, rotis, rice, sweet potato. Provides healthy fats + protein. Better than any store sauce.',dietTags:['nonveg','egg','veg','vegan']},
  {cat:'quick',i:'🧀',n:'Hung curd spread',tag:'30 min drain + 2 min mix',tcls:'rgba(108,142,255,.14)',tc:'#A5B4FC',p:'6g / 2 tbsp',k:'60 kcal',d:'Strain 300g full-fat curd in muslin cloth for 30 min. Mix with fresh mint + jeera powder + salt + lemon juice. Thick, creamy sandwich base. For vegan: strain coconut yogurt the same way. Better than any mayo. Use on all sandwiches.',dietTags:['nonveg','egg','veg']},
  {cat:'sandwich',i:'🥙',n:'Chicken protein club',tag:'Sandwich · 5 min assembly',tcls:'rgba(255,184,0,.14)',tc:'#FCD34D',p:'38g',k:'420 kcal',d:'Toast 2 slices whole wheat bread. Spread hung curd. Layer: shredded air fryer chicken + cucumber slices + tomato + red onion rings + chutney. Optional: air fry assembled sandwich 160°C 5 min for crispy edges. 38g protein in 5 minutes.',dietTags:['nonveg']},
  {cat:'sandwich',i:'🫘',n:'Rajma kathi roll',tag:'Sandwich · 5 min assembly',tcls:'rgba(255,184,0,.14)',tc:'#FCD34D',p:'22g',k:'400 kcal',d:'Warm wheat roti. Spread hung curd. Add ½ cup rajma (slightly smashed) + onion rings + lemon juice + chaat masala. Roll tight. Rajma + roti = complete protein — all amino acids without any meat. Best plant-based sandwich option.',dietTags:['nonveg','egg','veg','vegan']},
  {cat:'sandwich',i:'🥚',n:'Egg masala sandwich',tag:'Sandwich · 5 min assembly',tcls:'rgba(255,184,0,.14)',tc:'#FCD34D',p:'22g',k:'380 kcal',d:'Toast whole wheat bread. Peanut chutney on one side. Layer: sliced masala air-fryer eggs + onion rings + tomato + green chutney. Toast again for 2 min. For weight gain members: butter one side of bread before toasting.',dietTags:['nonveg','egg']},
  {cat:'sandwich',i:'🧀',n:'Paneer tikka sandwich',tag:'Sandwich · 5 min assembly',tcls:'rgba(255,184,0,.14)',tc:'#FCD34D',p:'26g',k:'420 kcal',d:'Toast whole wheat bread. Hung curd spread. Layer: air fryer paneer tikka pieces + capsicum strips + onion + green chutney. Air fry assembled sandwich 160°C 5 min. Best veg/vegan high-protein sandwich.',dietTags:['veg','vegan','egg']},
  {cat:'fruit',i:'🍓',n:'Daily fruit salad bowl',tag:'No cook · 5 min daily',tcls:'rgba(236,72,153,.14)',tc:'#F9A8D4',p:'3g',k:'160 kcal',d:'Chop: banana + papaya + guava + apple. Lemon squeeze + pinch chaat masala + pinch black salt. Eat within 20 min of cutting — vitamin C degrades with air. Nazim: large bowl. Wife: add 1 tsp honey. Contains guava (4× more vitamin C than orange), papaya (papain improves protein digestion 30%), and banana potassium. Eat this every single day.',dietTags:['nonveg','egg','veg','vegan']}
];

// ═══════════════════════════════════════════════
// GROCERY LIST
// ═══════════════════════════════════════════════
var GROCERY = {
  nonveg: [
    {cat:'Proteins',items:[{n:'Chicken boneless',q:'1.5 kg'},{n:'Eggs',q:'30 (2.5 dozen)'},{n:'Toor dal',q:'500g'},{n:'Rajma or kabuli chana',q:'500g — soak overnight'},{n:'Moong dal whole',q:'250g'},{n:'Full fat curd',q:'1 kg'},{n:'Full-fat milk',q:'2 litres'},{n:'Peanut butter',q:'1 jar'}]},
    {cat:'Carbs + Fats',items:[{n:'Whole wheat atta',q:'2 kg'},{n:'Basmati rice',q:'1 kg'},{n:'Rolled oats',q:'500g'},{n:'Whole wheat bread',q:'2 loaves'},{n:'Sweet potato',q:'1 kg'},{n:'Banana',q:'2 dozen'},{n:'Dates khajoor',q:'200g'},{n:'Ghee',q:'200g'},{n:'Almonds',q:'200g'},{n:'Peanuts raw',q:'250g'}]}
  ],
  egg: [
    {cat:'Proteins',items:[{n:'Eggs',q:'36 (3 dozen)'},{n:'Paneer',q:'300g'},{n:'Toor dal',q:'500g'},{n:'Rajma or chole',q:'500g'},{n:'Moong dal',q:'250g'},{n:'Full fat curd',q:'1 kg'},{n:'Full-fat milk',q:'2 litres'},{n:'Peanut butter',q:'1 jar'}]},
    {cat:'Carbs + Fats',items:[{n:'Whole wheat atta',q:'2 kg'},{n:'Basmati rice',q:'1 kg'},{n:'Rolled oats',q:'500g'},{n:'Whole wheat bread',q:'2 loaves'},{n:'Sweet potato',q:'1 kg'},{n:'Banana',q:'2 dozen'},{n:'Dates',q:'200g'},{n:'Ghee',q:'200g'},{n:'Almonds',q:'200g'},{n:'Peanuts raw',q:'250g'}]}
  ],
  veg: [
    {cat:'Proteins',items:[{n:'Paneer',q:'400g'},{n:'Toor dal',q:'500g'},{n:'Rajma',q:'500g'},{n:'Kabuli chana',q:'500g'},{n:'Moong dal whole',q:'500g'},{n:'Full fat curd',q:'1.5 kg'},{n:'Full-fat milk',q:'2 litres'},{n:'Peanut butter',q:'1 jar'},{n:'Almonds',q:'300g'},{n:'Peanuts raw',q:'300g'}]},
    {cat:'Carbs + Fats',items:[{n:'Whole wheat atta',q:'2 kg'},{n:'Basmati rice',q:'1 kg'},{n:'Rolled oats',q:'500g'},{n:'Whole wheat bread',q:'2 loaves'},{n:'Sweet potato',q:'1 kg'},{n:'Banana',q:'2 dozen'},{n:'Dates khajoor',q:'200g'},{n:'Ghee',q:'300g'},{n:'Walnuts',q:'150g'},{n:'Cashews (for curd)',q:'150g'}]}
  ],
  vegan: [
    {cat:'Proteins',items:[{n:'Tofu firm',q:'600g'},{n:'Rajma',q:'500g'},{n:'Kabuli chana',q:'500g'},{n:'Moong dal',q:'500g'},{n:'Toor dal',q:'500g'},{n:'Peanut butter',q:'2 jars'},{n:'Almonds',q:'300g'},{n:'Peanuts raw',q:'300g'},{n:'Cashews (for yogurt)',q:'200g'}]},
    {cat:'Carbs + Fats',items:[{n:'Whole wheat atta',q:'2 kg'},{n:'Basmati rice',q:'1 kg'},{n:'Rolled oats',q:'500g'},{n:'Whole wheat bread (vegan)',q:'2 loaves'},{n:'Sweet potato',q:'1 kg'},{n:'Banana',q:'2 dozen'},{n:'Dates khajoor',q:'200g'},{n:'Coconut oil',q:'200ml'},{n:'Walnuts',q:'200g'},{n:'Oat milk',q:'1 litre'},{n:'Coconut milk',q:'400ml'}]}
  ],
  common: [
    {cat:'Vegetables — from mandi',items:[{n:'Tomatoes',q:'1 kg'},{n:'Onions',q:'1 kg'},{n:'Cucumber',q:'5–6'},{n:'Carrot',q:'500g'},{n:'Spinach / palak',q:'500g'},{n:'Capsicum',q:'3–4'},{n:'Any 2 seasonal sabzi',q:'500g each'},{n:'Ginger, garlic, green chilli, lemon',q:'weekly'}]},
    {cat:'Fruits — daily',items:[{n:'Papaya',q:'1 medium'},{n:'Guava',q:'4–5'},{n:'Apple',q:'4–5'},{n:'Seasonal mix',q:'500g'}]},
    {cat:'Pantry — monthly',items:[{n:'Haldi, jeera, coriander, red chilli',q:'refill'},{n:'Garam masala, chaat masala',q:'refill'},{n:'Kala namak (for vegan)',q:'small pack'},{n:'Mustard seeds, hing',q:'refill'},{n:'Groundnut oil',q:'1 litre'},{n:'Salt, black pepper',q:'refill'}]}
  ]
};

// ═══════════════════════════════════════════════
// COACH TIPS — by goal
// ═══════════════════════════════════════════════
var COACH_TIPS = {
  muscle: ['Progressive overload is the only law of muscle building. Write down every weight you lift. Every 10–14 days, add 1.25–2.5 kg to your main lifts. If you lifted the same weight this week as last week, you did not grow.','Muscle is built during sleep, not in the gym. Growth hormone peaks in the first 90 minutes of deep sleep. 7–8 hours is not a recommendation — it is a biological requirement for muscle growth.','Your post-workout meal is the most important nutritional decision of your day. The 45-minute window after training is when muscle cell membranes are maximally permeable to protein and glucose. Never skip breakfast after training.','Protein timing matters as much as total protein. Spread your target across 6 meals — 20–40g per meal. One huge protein meal does not work the same way as 6 smaller doses throughout the day.','Water is 75% of muscle tissue. A 2% drop in hydration reduces strength by 10% and endurance by 20%. Drink your full daily target before making any other decisions about your training or nutrition.','Deload week every 8 weeks — reduce weight by 40%, keep all exercises. Your tendons and connective tissue lag 6–8 weeks behind your muscles. Skip deloads and you get injured and lose 6 weeks.','Track your lifts in a notebook or app. If it is not written down, it did not happen. Progression is the only metric that matters.'],
  fat_loss: ['A calorie deficit is the only mechanism of fat loss. Every diet that works, works because it creates a deficit. Yours is set at 400–500 kcal below maintenance. This is the optimal rate — aggressive enough to lose fat, conservative enough to keep muscle.','Protein is your most important macro on a fat-loss plan. High protein preserves muscle while you lose fat. Hit your protein target every day even if you miss your calorie target. Muscle is your metabolism.','The biggest fat-loss mistake is cutting calories too aggressively. Lose more than 0.7 kg/week and you are losing muscle. Slow fat loss — 0.3–0.5 kg/week — produces better body composition than fast fat loss.','Sleep deprivation directly causes fat gain. It increases cortisol and ghrelin — the hunger hormone. Studies show sleep-deprived people eat 300+ more calories per day than rested people. Prioritize 7–8 hours.','Cardio burns calories, but diet creates the deficit. You cannot out-train a poor diet. Focus 80% of your effort on what you eat. 20% on training.','Never weigh yourself daily — water retention varies 1–2 kg day to day and will drive you insane. Weigh once a week on Monday morning before eating. Judge your progress in 4-week blocks.','The fruit salad bowl is your secret weapon. High volume, high fibre, high micronutrients, low calories. Eat a large bowl before your biggest meal — it crowds out higher-calorie foods.'],
  weight_gain: ['You are not eating enough. This is the only reason you are not gaining weight. More supplements, different exercises, different foods — these do not matter until you are consistently eating your full calorie target every single day.','Never skip the morning calorie drink. It takes 3 minutes and delivers 400–500 kcal. This single habit can add 0.3–0.5 kg per month on its own. The morning drink is non-negotiable.','Eat on a schedule — every 2.5–3 hours. Your hunger signals are suppressed right now. Do not wait until you are hungry. Eat by the clock. Hunger will return in 4–6 weeks of consistent eating.','Dates are your highest-leverage food. 5 dates per day = iron, magnesium, potassium, and 125 kcal of whole-food energy. Iron deficiency suppresses appetite and energy. Dates fix both simultaneously.','Walk 30 minutes daily. At low body weight, intense exercise depletes already-limited energy. Walking improves digestion, increases appetite, and improves mood — without burning the calories you need for weight gain.','See a doctor this week. A basic blood panel will reveal exactly which deficiencies are suppressing your appetite and metabolism. This is the highest-leverage action you can take in your transformation.','Ghee is medicine, not indulgence. Butyrate in ghee heals the gut lining — improving absorption of everything else you eat. At low body weight, gut absorption is often compromised. 1 tsp per meal, minimum.'],
  general: ['Consistency is the only supplement that reliably works. Show up every day, eat your meals, drink your water. That is the entire formula. Everything else is secondary.','Your body changes primarily in the kitchen. Training is 30% of the result. Nutrition is 70%. Get your meals right before optimizing anything else.','Hydration affects everything: energy, strength, mood, digestion, and sleep quality. Drink your daily water target before making any other health decisions today.','Progress is not linear. Your weight, strength, and energy will fluctuate week to week. This is completely normal. Judge yourself in 4-week blocks, not 4-day blocks.','Sleep is your most powerful recovery tool. 7–8 hours changes hormonal balance, hunger control, and muscle recovery more profoundly than any training protocol or supplement.','Track your food for 2 weeks. You do not have to do it forever. But 2 weeks of accurate tracking reveals patterns in your eating that are invisible without measurement.','Stress management is fitness. Chronic cortisol breaks down muscle, increases fat storage, and suppresses immune function. Rest, social connection, and time outdoors are not optional — they are part of the program.']
};

// ═══════════════════════════════════════════════
// ASSESSMENT STEPS
// ═══════════════════════════════════════════════
var ASSESS_STEPS = [
  {q:'What is your primary goal?',sub:'This shapes every aspect of your nutrition and training plan.',type:'choice',key:'goal',opts:[{ico:'💪',n:'Build muscle & strength',d:'Gain lean mass, get stronger, look bigger',v:'muscle'},{ico:'🔥',n:'Lose fat & get lean',d:'Burn fat, define muscle, improve health',v:'fat_loss'},{ico:'⚖️',n:'Gain healthy weight',d:'Underweight and need to reach a healthy BMI',v:'weight_gain'},{ico:'🏃',n:'Improve fitness & health',d:'Better energy, stamina and wellbeing',v:'general'}]},
  {q:'Tell us about your body.',sub:'Used to calculate your exact calorie and macro targets.',type:'body',key:'body'},
  {q:'What is your current activity level?',sub:'Be honest — this directly affects your calorie target.',type:'choice',key:'activity',opts:[{ico:'🛋️',n:'Sedentary',d:'Desk job, little to no exercise currently',v:'sedentary'},{ico:'🚶',n:'Lightly active',d:'Light exercise 1–3 days/week or daily walking',v:'light'},{ico:'🏋️',n:'Moderately active',d:'Working out 3–5 days/week',v:'moderate'},{ico:'⚡',n:'Very active',d:'Hard training 5–6 days/week',v:'very'}]},
  {q:'What is your diet type?',sub:'Your meal plan is built entirely around this. Every meal will be appropriate for your diet.',type:'choice',key:'diet',opts:[{ico:'🍗',n:'Non-vegetarian',d:'Chicken, eggs, fish — no restrictions',v:'nonveg'},{ico:'🥚',n:'Eggetarian',d:'Eggs yes, no other meat',v:'egg'},{ico:'🥦',n:'Vegetarian',d:'No eggs or meat — dairy OK',v:'veg'},{ico:'🌱',n:'Vegan',d:'No animal products at all',v:'vegan'}]},
  {q:'Where will you train?',sub:'We build the right program for your exact situation.',type:'choice',key:'location',opts:[{ico:'🏋️',n:'Gym — full equipment',d:'Barbells, dumbbells, cables, machines',v:'gym'},{ico:'🏠',n:'Home — bodyweight only',d:'No equipment, just body and floor',v:'home'},{ico:'🌀',n:'Mix of both',d:'Sometimes gym, sometimes home',v:'mixed'}]},
  {q:'How many days per week can you train?',sub:'Consistency beats intensity. Be realistic about your schedule.',type:'choice',key:'days',opts:[{ico:'3️⃣',n:'3 days / week',d:'Full body sessions — beginner or tight schedule',v:'3'},{ico:'4️⃣',n:'4 days / week',d:'Upper/lower split — intermediate',v:'4'},{ico:'5️⃣',n:'5 days / week',d:'PPL + dedicated — intermediate/advanced',v:'5'},{ico:'6️⃣',n:'6 days / week',d:'PPL × 2 — experienced trainers',v:'6'}]},
  {q:'Any health conditions to consider?',sub:'Ensures your plan is safe. All information is private and encrypted.',type:'choice',key:'health',opts:[{ico:'✅',n:'None — I am healthy',d:'No known conditions or injuries',v:'none'},{ico:'🦴',n:'Joint issues or injury',d:'Knee, back, shoulder problems',v:'joint'},{ico:'💉',n:'Diabetes or thyroid',d:'Managing blood sugar or hormonal condition',v:'metabolic'},{ico:'❤️',n:'Heart or BP condition',d:'Hypertension or cardiovascular issue',v:'cardiac'}]}
];

// ═══════════════════════════════════════════════
// FOOD DATABASE (For Automatic Calorie Calculator)
// ═══════════════════════════════════════════════
var FOOD_DB = [
  { n: 'Chicken Breast (100g, raw)', k: 165, p: 31, c: 0, f: 3.6 },
  { n: 'Chicken Breast (100g, cooked)', k: 165, p: 31, c: 0, f: 3.6 },
  { n: 'Eggs (2 whole, large)', k: 144, p: 12, c: 1, f: 10 },
  { n: 'Egg Whites (4 large)', k: 68, p: 14, c: 1, f: 0 },
  { n: 'Paneer (100g)', k: 265, p: 18, c: 1.2, f: 20 },
  { n: 'Tofu (100g, firm)', k: 144, p: 16, c: 3, f: 9 },
  { n: 'Whey Protein (1 scoop, 30g)', k: 120, p: 24, c: 3, f: 1.5 },
  { n: 'Toor Dal (1 katori/cup, cooked)', k: 150, p: 9, c: 25, f: 2 },
  { n: 'Moong Dal (1 katori/cup, cooked)', k: 140, p: 8, c: 24, f: 1 },
  { n: 'Rajma (1 katori/cup, cooked)', k: 170, p: 10, c: 29, f: 1 },
  { n: 'Chole (1 katori/cup, cooked)', k: 210, p: 10, c: 35, f: 3 },
  { n: 'Roti / Chapati (1 medium, wheat)', k: 105, p: 3, c: 22, f: 0.5 },
  { n: 'White Rice (1 katori/cup, cooked)', k: 130, p: 2, c: 28, f: 0.3 },
  { n: 'Brown Rice (1 katori/cup, cooked)', k: 110, p: 2.5, c: 23, f: 0.9 },
  { n: 'Oats (50g, raw)', k: 190, p: 6.5, c: 33, f: 3.5 },
  { n: 'Sweet Potato (100g, boiled/air-fried)', k: 86, p: 1.6, c: 20, f: 0.1 },
  { n: 'Idli (2 medium pieces)', k: 116, p: 3, c: 24, f: 0.5 },
  { n: 'Dosa (1 plain, medium)', k: 130, p: 3, c: 20, f: 4 },
  { n: 'Poha (1 katori/cup, cooked)', k: 180, p: 3.5, c: 30, f: 4.5 },
  { n: 'Full-fat Curd / Dahi (100g)', k: 98, p: 4.3, c: 3.4, f: 4.3 },
  { n: 'Low-fat Curd (100g)', k: 56, p: 4, c: 5, f: 1.5 },
  { n: 'Full-fat Milk (250ml)', k: 150, p: 8, c: 12, f: 8 },
  { n: 'Toned Milk (250ml)', k: 110, p: 8, c: 12, f: 3.5 },
  { n: 'Almonds (10 pieces / 12g)', k: 70, p: 2.5, c: 2.5, f: 6 },
  { n: 'Walnuts (5 halves / 10g)', k: 65, p: 1.5, c: 1.4, f: 6.5 },
  { n: 'Peanuts (30g, roasted)', k: 170, p: 7.5, c: 5, f: 14 },
  { n: 'Peanut Butter (1 tbsp / 15g)', k: 95, p: 4, c: 3, f: 8 },
  { n: 'Banana (1 medium)', k: 105, p: 1.3, c: 27, f: 0.3 },
  { n: 'Apple (1 medium)', k: 95, p: 0.5, c: 25, f: 0.3 },
  { n: 'Guava (1 medium)', k: 68, p: 2.5, c: 14, f: 0.9 },
  { n: 'Dates (3 pieces / 24g)', k: 66, p: 0.5, c: 18, f: 0.1 },
  { n: 'Ghee (1 tsp / 5g)', k: 45, p: 0, c: 0, f: 5 },
  { n: 'Coconut Oil (1 tsp / 5g)', k: 45, p: 0, c: 0, f: 5 }
];
