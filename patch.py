import sys

try:
    with open('js/app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    helper = """
function getDashboardImprovementHtml() {
  var logs = STATE.weights || [];
  if (logs.length < 2) return '';
  var cur = logs[logs.length - 1];
  var rate = parseFloat((cur - logs[logs.length - 2]).toFixed(2));
  var goal = STATE.profile.plan.goal;
  var fb = '';
  if (goal === 'fat_loss') {
    if (rate > -0.1) fb = 'Weight not dropping this week. Check your calorie tracking — are you logging everything? Reduce dinner carbs by half.';
    else if (rate >= -0.7) fb = 'Perfect fat loss pace — losing ' + Math.abs(rate) + 'kg/week. Keep going.';
    else fb = 'Losing too fast (' + Math.abs(rate) + 'kg/week). You risk muscle loss. Add 100 kcal and increase protein by 10g.';
  } else if (goal === 'muscle' || goal === 'weight_gain') {
    if (rate < 0.1) fb = 'Weight stalled this week. Not eating enough. Add 1 banana + 1 tbsp peanut butter daily.';
    else if (rate <= 0.6) fb = 'Excellent — gaining ' + rate + 'kg this week. Perfect pace. Keep everything the same.';
    else fb = 'Gaining too fast (' + rate + 'kg/week). Reduce dinner rice from 1 cup to 1/2 cup. Keep all other meals identical.';
  } else {
    fb = 'Consistency is the key metric. Keep hitting your daily targets.';
  }
  return '<div class="card-ac" style="margin-bottom:16px"><div style="font-size:11px;font-weight:700;color:var(--ac);letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px">How to improve this week</div><div style="font-size:13px;color:var(--t1);line-height:1.65">' + fb + '</div></div>';
}
"""
    content = content.replace('function renderToday() {', helper + '\nfunction renderToday() {')
    content = content.replace("document.getElementById('today-content').innerHTML =\n", "document.getElementById('today-content').innerHTML =\n    '<div style=\"font-size:24px; font-weight:800; color:var(--t1); margin-top:0; margin-bottom:16px;\">Dashboard</div>' +\n    getDashboardImprovementHtml() +\n")
    content = content.replace("document.getElementById('meals-content').innerHTML =\n", "document.getElementById('meals-content').innerHTML =\n    '<div style=\"font-size:24px; font-weight:800; color:var(--t1); margin-top:0; margin-bottom:16px;\">Meals</div>' +\n")
    content = content.replace("document.getElementById('workout-content').innerHTML =\n", "document.getElementById('workout-content').innerHTML =\n    '<div style=\"font-size:24px; font-weight:800; color:var(--t1); margin-top:0; margin-bottom:16px;\">Workout</div>' +\n")
    content = content.replace("document.getElementById('progress-content').innerHTML =\n", "document.getElementById('progress-content').innerHTML =\n    '<div style=\"font-size:24px; font-weight:800; color:var(--t1); margin-top:0; margin-bottom:16px;\">Progress</div>' +\n")
    content = content.replace("document.getElementById('nutrition-content').innerHTML =\n", "document.getElementById('nutrition-content').innerHTML =\n    '<div style=\"font-size:24px; font-weight:800; color:var(--t1); margin-top:0; margin-bottom:16px;\">Recipes & prep</div>' +\n    '<div class=\"card\" style=\"margin-bottom:16px\"><div style=\"font-size:16px;font-weight:700;margin-bottom:6px\">🔪 Meal Prep Guide</div><div style=\"font-size:13px;color:var(--t2);line-height:1.6\">To save time this week, batch cook your main proteins (chicken/tofu/lentils) on Sunday and Wednesday. Pre-chop vegetables and store them in airtight containers. Cook rice or quinoa in bulk for 3 days at a time. This ensures you always have compliant food ready to eat!</div></div>' +\n")
    content = content.replace("document.getElementById('grocery-content').innerHTML =\n", "document.getElementById('grocery-content').innerHTML =\n    '<div style=\"font-size:24px; font-weight:800; color:var(--t1); margin-top:0; margin-bottom:16px;\">Grocery Shop</div>' +\n")
    
    # Profile update
    profile_target = """  document.getElementById('profile-body').innerHTML =
    '<div style="text-align:center;margin-bottom:20px">'"""
    
    profile_replace = """  document.getElementById('profile-body').innerHTML =
    '<div style="font-size:24px; font-weight:800; color:var(--t1); margin-top:0; margin-bottom:16px;">Profile Details</div>'
    + '<div style="text-align:center;margin-bottom:20px">'"""
    
    content = content.replace(profile_target, profile_replace)
    
    profile_data_target = """    + row('Member since', new Date(u.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), '')
    + '</div>'"""
    
    profile_data_replace = """    + row('Member since', new Date(u.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), '')
    + '</div>'
    + '<div class="card" style="margin-top:12px">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--t1)">Assessment Data</div>'
    + row('Age', STATE.profile.answers.age || 'N/A', '')
    + row('Gender', STATE.profile.answers.gender ? STATE.profile.answers.gender.charAt(0).toUpperCase() + STATE.profile.answers.gender.slice(1) : 'N/A', '')
    + row('Height', (STATE.profile.answers.height || 'N/A') + ' cm', '')
    + row('Starting Weight', (STATE.profile.answers.weight || 'N/A') + ' kg', '')
    + '</div>'"""
    
    content = content.replace(profile_data_target, profile_data_replace)

    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print('Successfully updated js/app.js')
except Exception as e:
    print(f'Error: {e}')
