# SocialNinjas Fit — Premium Fitness Coaching App

A fully personalized fitness and nutrition coaching web app built for commercial use at ₹299/month per member.

## Features

- **Personalized onboarding** — 7-step fitness assessment builds a unique plan per user
- **4 diet types** — Non-veg, Eggetarian, Vegetarian, Vegan meal plans (fully separate menus)
- **4 goal types** — Muscle gain, Fat loss, Weight gain, General fitness
- **Calorie & macro engine** — Mifflin-St Jeor BMR + activity multiplier, goal-adjusted targets
- **Exercise demos** — YouTube embed + form cues for every exercise
- **Set tracking** — Tap-to-complete sets per exercise, day completion tracking
- **Custom meal logging** — Add any meal with kcal + protein tracking
- **Custom exercise logging** — Add any exercise with sets, reps, weight
- **Monthly plan update** — AI coach analyzes progress and adjusts calories/macros
- **Progress tracking** — Weight trend chart, BMI, body measurements, 7-day streak
- **Smart grocery list** — Diet-specific, with reset and check-off
- **Payment flow** — UPI, Card, Net Banking, Wallet (Razorpay-ready)
- **PWA ready** — Install on iPhone (Safari) and Android (Chrome) as home screen app

## Tech Stack

- Pure HTML + CSS + Vanilla JavaScript (no frameworks, no build step)
- localStorage for data persistence
- YouTube iframe API for exercise demos
- Google Fonts (Inter + Playfair Display)

## File Structure

```
socialninjas-fit/
├── index.html          # App shell + all screens
├── css/
│   └── style.css       # All styles
└── js/
    ├── data.js         # Meal plans, exercises, recipes, grocery, coach tips
    ├── engine.js       # Plan generation + monthly update engine
    └── app.js          # All UI logic, navigation, modals
```

## How to Deploy (GitHub Pages — Free)

1. Fork or clone this repo
2. Go to **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Your app is live at `https://yourusername.github.io/socialninjas-fit`

## How to Install on Phones

**iPhone (iOS):**
1. Open your deployed URL in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Name it "SocialNinjas Fit" → Add

**Android:**
1. Open your deployed URL in Chrome
2. Tap the three dots menu (top right)
3. Tap "Add to Home Screen" or "Install App"
4. Confirm → icon appears on home screen

## Connect Real Payments (Razorpay)

Replace the `doPayment()` function in `js/app.js` with:

```javascript
function doPayment() {
  var options = {
    key: 'YOUR_RAZORPAY_KEY_ID',
    amount: 29900, // ₹299 in paise
    currency: 'INR',
    name: 'SocialNinjas Fit',
    description: 'Premium Membership — 1 Month',
    handler: function(response) {
      // Payment successful — proceed to assessment
      assessStep = 0;
      assessAnswers = {};
      renderAssessStep();
      S('scr-assess');
    },
    prefill: {
      name: STATE.signupData.name,
      email: STATE.signupData.email,
      contact: STATE.signupData.phone
    },
    theme: { color: '#00E5A0' }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}
```

Add Razorpay script to `index.html` `<head>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Scale to Backend (Supabase — Free tier)

To store user data in the cloud instead of localStorage:
1. Create a free [Supabase](https://supabase.com) project
2. Create a `users` table and `profiles` table
3. Replace `save()` and `loadState()` in `app.js` with Supabase API calls

## Pricing

| Plan | Price |
|------|-------|
| Individual | ₹299/month |
| Couples (add partner) | +₹199/month |
| Annual individual | ₹2,499/year (save ₹989) |

## License

Built by Social Ninja's — @nazim_ninja  
For commercial use — all rights reserved.
