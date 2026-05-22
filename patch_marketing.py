import sys
import re

def update_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Ticker
    ticker_old = """  <div class="ticker-track" id="ticker-track">
    <span class="ticker-item"><strong>4 diet types</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>4 fitness goals</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Exercise video guides</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Monthly plan update</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Weekly meal prep system</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Set-by-set workout tracking</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Custom meal & exercise logging</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Smart grocery list</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>4 diet types</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>4 fitness goals</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Exercise video guides</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Monthly plan update</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Weekly meal prep system</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Set-by-set workout tracking</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Custom meal & exercise logging</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Smart grocery list</strong><span class="ticker-sep">✦</span></span>
  </div>"""

    ticker_new = """  <div class="ticker-track" id="ticker-track">
    <span class="ticker-item"><strong>Dynamic Coach Dashboard</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Photo Meal Tracking</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Step-by-step Meal Prep Guides</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Weekly Check-ins</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Monthly plan auto-update</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Exercise video guides</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Smart grocery list</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Dynamic Coach Dashboard</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Photo Meal Tracking</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Step-by-step Meal Prep Guides</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Weekly Check-ins</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Monthly plan auto-update</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Exercise video guides</strong><span class="ticker-sep">✦</span></span>
    <span class="ticker-item"><strong>Smart grocery list</strong><span class="ticker-sep">✦</span></span>
  </div>"""

    content = content.replace(ticker_old, ticker_new)

    # 2. Update Mockup Checks
    checks_old = """      <div class="mockup-checks">
        <div class="mockup-check"><div class="check-ic">✓</div>Daily meal tracker with calorie & protein rings</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Set-by-set workout tracker with form video demos</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Weekly weight trend chart + coach feedback</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Photo meal logging + custom food search</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Add your own meals and exercises anytime</div>
      </div>"""

    checks_new = """      <div class="mockup-checks">
        <div class="mockup-check"><div class="check-ic">✓</div>Dynamic Coach Dashboard with weekly improvement tips</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Photo Meal Tracking for ultimate visual accountability</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Step-by-step Meal Prep Guides to save you hours</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Weekly Check-ins to track your exact transformation</div>
        <div class="mockup-check"><div class="check-ic">✓</div>Set-by-set workout tracker with form video demos</div>
      </div>"""

    content = content.replace(checks_old, checks_new)

    # 3. Update Pricing Features
    pricing_old = """      <div class="pricing-feats">
        <div class="pricing-feat"><div class="pf-ck">✓</div>Personalized nutrition plan</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Goal-specific calorie targets</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>4 diet types (veg, non-veg, vegan, egg)</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Gym or home workout program</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Exercise video form guides</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Set-by-set workout tracking</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Custom meal & exercise logging</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Photo meal confirmation</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Monthly plan update</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Coach feedback on progress</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Weight trend chart & BMI</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Body measurement tracking</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Smart grocery list</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Cancel anytime — no lock-in</div>
      </div>"""

    pricing_new = """      <div class="pricing-feats">
        <div class="pricing-feat"><div class="pf-ck">✓</div>Dynamic AI Nutrition Plan (Auto-updates monthly)</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Visual Meal Tracking (Snap a photo, stay accountable)</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Weekly Check-ins & Progress Photo Gallery</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Dynamic Dashboard (Weekly specific improvement tips)</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Step-by-step Meal Prep Guides & Grocery Lists</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Goal-specific macro targeting (4 diet types)</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Gym or home workout program with video guides</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Set-by-set workout logging & progression</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Custom meal & exercise additions anytime</div>
        <div class="pricing-feat"><div class="pf-ck">✓</div>Cancel anytime — 0 lock-in contracts</div>
      </div>"""
      
    content = content.replace(pricing_old, pricing_new)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated index.html")

def update_app():
    with open('app.html', 'r', encoding='utf-8') as f:
        content = f.read()

    payment_old = """        <div class="plan-feats">
          <div class="pf">✓ Personalized nutrition plan (goal + diet specific)</div>
          <div class="pf">✓ Custom workout program (gym or home)</div>
          <div class="pf">✓ Exercise video guides for proper form</div>
          <div class="pf">✓ Daily meal & custom food logging</div>
          <div class="pf">✓ Add your own exercises with tracking</div>
          <div class="pf">✓ Monthly plan update based on progress</div>
          <div class="pf">✓ Weight trend & body measurement tracking</div>
          <div class="pf">✓ AI coach feedback every week</div>
          <div class="pf">✓ Smart grocery list with nutrition science</div>
          <div class="pf">✓ Cancel anytime — no lock-in</div>
        </div>"""

    payment_new = """        <div class="plan-feats">
          <div class="pf">✓ Dynamic AI Nutrition Plan (Recalibrates monthly)</div>
          <div class="pf">✓ Visual Meal Tracking (Snap a photo, stay accountable)</div>
          <div class="pf">✓ Weekly Check-ins & Progress Photo Gallery</div>
          <div class="pf">✓ Dynamic Dashboard (Weekly improvement tips)</div>
          <div class="pf">✓ Step-by-step Meal Prep Guides & Grocery Lists</div>
          <div class="pf">✓ Custom workout program (gym or home) with video guides</div>
          <div class="pf">✓ Cancel anytime — no lock-in</div>
        </div>"""
        
    content = content.replace(payment_old, payment_new)

    with open('app.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated app.html")

update_index()
update_app()
