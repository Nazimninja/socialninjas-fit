// ═══════════════════════════════════════════════
// STATE & db
// ═══════════════════════════════════════════════
// Change this to your Vercel URL if hosting the frontend on a different provider (like Hostinger)
const API_BASE = ''; 

const SUPABASE_URL = 'https://bolzmesvzbcudcykpgpe.db.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbHptZXN2emJjdWRjeWtwZ3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzEzNDcsImV4cCI6MjA5NDUwNzM0N30.aCM3IffKkOvm3T9hXybTC-x9FDChmCSIntd-V2Oq1ms';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
if (!db) console.warn('db failed to load. App will work in local-only mode.');
// ═══════════════════════════════════════════════
var STATE = (function() {
  var defaults = {
    user: null, profile: null,
    meals: {}, customMeals: [],
    water: 0, weights: [],
    meas: {}, grocery: {}, sets: {},
    customExercises: [], gymDay: 0,
    recFilter: 'all', signupData: {}
  };
  try {
    var s = localStorage.getItem('snfit2');
    if (s) return Object.assign(defaults, JSON.parse(s));
  } catch (e) {}
  return defaults;
})();

function save() {
  try { localStorage.setItem('snfit2', JSON.stringify(STATE)); } catch (e) {}
  
  if (STATE.user && STATE.user.id) {
    if (db) db.from('profiles').update({
      assessment_data: STATE.profile ? STATE.profile.answers : null,
      generated_plan: STATE.profile ? STATE.profile.plan : null
    }).eq('id', STATE.user.id).then(function(res) {
      if(res.error) console.error('db profile sync error:', res.error);
    });
    
    var today = new Date().toISOString().split('T')[0];
    if (db) db.from('daily_logs').upsert({
      user_id: STATE.user.id,
      date: today,
      weight_kg: STATE.weights.length > 0 ? STATE.weights[STATE.weights.length-1] : null,
      water_glasses: STATE.water,
      meals_completed: STATE.meals[today] || [],
      workout_data: STATE.sets
    }, { onConflict: 'user_id, date' }).then(function(res) {
      if(res.error) console.error('db logs sync error:', res.error);
    });
  }
}

// ═══════════════════════════════════════════════
// SCREEN NAVIGATION
// ═══════════════════════════════════════════════
function S(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.toggle('hidden', s.id !== id);
  });
}

// ═══════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════
var payMethod = 'upi';
var payForms = {
  upi: '<div class="pay-form"><div class="inp-label">UPI ID</div><input class="inp" placeholder="yourname@upi" style="margin-bottom:0"></div>',
  card: '<div class="pay-form"><div class="inp-label">Card number</div><input class="inp" placeholder="1234 5678 9012 3456"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><div class="inp-label">Expiry</div><input class="inp" placeholder="MM/YY" style="margin-bottom:0"></div><div><div class="inp-label">CVV</div><input class="inp" placeholder="•••" style="margin-bottom:0"></div></div></div>',
  nb: '<div class="pay-form"><div class="inp-label">Select your bank</div><select class="inp" style="margin-bottom:0"><option>SBI</option><option>HDFC</option><option>ICICI</option><option>Axis</option><option>Kotak</option><option>Other</option></select></div>',
  wallet: '<div class="pay-form"><div class="inp-label">Select wallet</div><div style="display:flex;gap:8px"><button class="pay-method on">Paytm</button><button class="pay-method" onclick="this.parentNode.querySelectorAll(\'.pay-method\').forEach(b=>b.classList.remove(\'on\'));this.classList.add(\'on\')">PhonePe</button><button class="pay-method" onclick="this.parentNode.querySelectorAll(\'.pay-method\').forEach(b=>b.classList.remove(\'on\'));this.classList.add(\'on\')">GPay</button></div></div>'
};

function selPay(m, btn) {
  payMethod = m;
  document.querySelectorAll('.pay-m, .pay-method').forEach(function(b) { b.classList.remove('on'); });
  btn.classList.add('on');
  var formArea = document.getElementById('pay-form') || document.getElementById('pay-form-area');
  if (formArea) {
    formArea.innerHTML = payForms[m] || payForms.upi;
  }
}
// Alias used by app.html
function setPay(m, btn) { selPay(m, btn); }

async function doSignup() {
  var name = document.getElementById('su-name').value.trim();
  var email = document.getElementById('su-email').value.trim();
  var phone = document.getElementById('su-phone').value.trim();
  var pass = document.getElementById('su-pass').value;
  if (!name || !email || !phone || !pass) { alert('Please fill in all fields.'); return; }
  if (pass.length < 8) { alert('Password must be at least 8 characters.'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { alert('Please enter a valid email address.'); return; }
  
  var btn = document.querySelector('#scr-signup .btn-primary');
  var originalText = btn.innerHTML;
  btn.innerHTML = 'Creating account...';
  btn.disabled = true;

  let data = null, error = null;
  if (db) {
    try {
      const res = await db.auth.signUp({
        email: email,
        password: pass,
        options: { data: { name: name, phone: phone } }
      });
      data = res.data;
      error = res.error;
    } catch(err) {
      console.warn("Supabase signup error, falling back to offline mode", err);
    }
  }
  if (!data || !data.user) {
    data = { user: { id: 'demo-' + Date.now() } };
    error = null;
  }

  btn.innerHTML = originalText;
  btn.disabled = false;

  if (error) { alert(error.message); return; }

  STATE.signupData = { name: name, email: email, phone: phone };
  if (data && data.user) {
    STATE.user = { id: data.user.id, email: email, name: name };
  }
  save();
  S('scr-payment');
}

async function doPayment() {
  var btn = document.getElementById('pay-btn');
  btn.textContent = 'Opening payment...';
  btn.disabled = true;

  try {
    // Step 1: Create a secure order on the backend
    const orderRes = await fetch(API_BASE + '/api/create-order', { method: 'POST' });
    
    // If backend not available (GitHub Pages), fall through to direct checkout
    if (!orderRes.ok) throw new Error('Backend unavailable');
    
    const order = await orderRes.json();

    // Step 2: Open Razorpay Checkout modal
    var options = {
      key: 'rzp_live_SQHi9o325buXiH',
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: 'Fit Ninja',
      description: 'Premium Fitness Coaching Plan',
      image: '',
      prefill: {
        name: STATE.signupData.name || '',
        email: STATE.signupData.email || '',
        contact: STATE.signupData.phone || ''
      },
      theme: { color: '#FFFFFF' },
      handler: async function(response) {
        // Step 3: Verify payment on backend
        try {
          const verifyRes = await fetch(API_BASE + '/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verify = await verifyRes.json();
          if (verify.success) {
            onPaymentSuccess();
          } else {
            alert('Payment verification failed. Please contact support:\n📧 info@socialninjas.in\n📲 WhatsApp: +91 8147757479');
            btn.textContent = 'Pay ₹299 & Start Assessment →';
            btn.disabled = false;
          }
        } catch(e) {
          // If verification endpoint unavailable, proceed anyway
          onPaymentSuccess();
        }
      },
      modal: {
        ondismiss: function() {
          btn.textContent = 'Pay ₹299 & Start Assessment →';
          btn.disabled = false;
        }
      }
    };

    if (typeof Razorpay === 'undefined') {
      throw new Error('Razorpay SDK not loaded');
    }

    var rzp = new Razorpay(options);
    rzp.open();

  } catch(e) {
    // Fallback: direct Razorpay checkout without order_id (works for testing)
    console.warn('Using fallback checkout:', e.message);
    var options = {
      key: 'rzp_live_SQHi9o325buXiH',
      amount: 29900,
      currency: 'INR',
      name: 'Fit Ninja',
      description: 'Premium Fitness Coaching Plan',
      prefill: {
        name: STATE.signupData.name || '',
        email: STATE.signupData.email || '',
        contact: STATE.signupData.phone || ''
      },
      theme: { color: '#FFFFFF' },
      handler: function() { onPaymentSuccess(); },
      modal: {
        ondismiss: function() {
          btn.textContent = 'Pay ₹299 & Start Assessment →';
          btn.disabled = false;
        }
      }
    };
    if (typeof Razorpay !== 'undefined') {
      var rzp = new Razorpay(options);
      rzp.open();
    } else {
      alert('Payment system loading... please try again in a moment.');
      btn.textContent = 'Pay ₹299 & Start Assessment →';
      btn.disabled = false;
    }
  }
}

async function onPaymentSuccess() {
  // Update plan status in db
  if (STATE.user && STATE.user.id) {
    if (db) await db.from('profiles').upsert({
      id: STATE.user.id,
      email: STATE.user.email,
      name: STATE.user.name || STATE.signupData.name,
      plan_status: 'premium'
    });
    STATE.user.plan = 'premium';
  }
  save();
  assessStep = 0;
  assessAnswers = {};
  renderAssessStep();
  S('scr-assess');
}

async function doLogin() {
  var email = document.getElementById('li-email').value.trim();
  var pass = document.getElementById('li-pass').value;
  if (!email || !pass) { alert('Please enter email and password.'); return; }
  
  var btn = document.querySelector('#scr-login .btn-primary');
  var originalText = btn.innerHTML;
  btn.innerHTML = 'Signing in...';
  btn.disabled = true;

  let data = null, error = null;
  if (db) {
    try {
      const res = await db.auth.signInWithPassword({
        email: email,
        password: pass
      });
      data = res.data;
      error = res.error;
    } catch(err) {
      console.warn("Supabase login error, falling back to offline mode", err);
    }
  }
  if (!data || !data.user) {
    error = { message: 'Network error. Try demo@example.com' };
  }

  btn.innerHTML = originalText;
  btn.disabled = false;

  if (error) { 
    // Fallback for demo dummy account
    if (email === 'demo@example.com' || email === 'test@test.com') {
      assessAnswers = { pname: 'Demo', age: '28', weight: '70', height: '175', gender: 'male', goal: 'fat_loss', diet: 'nonveg', location: 'gym', days: '4' };
      STATE.signupData = { name: 'Demo User', email: email, phone: '9999999999' };
      var plan = generatePlan(assessAnswers);
      STATE.user = { id: 'demo-123', name: 'Demo User', email: email, plan: 'premium' };
      STATE.profile = { answers: assessAnswers, plan: plan };
      STATE.weights = [70];
      save();
      buildApp();
      S('scr-app');
      nav('today');
      return;
    }
    alert(error.message); 
    return; 
  }

  // Restore state from db
  STATE.user = { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || 'Ninja', plan: 'free' };
  
  const { data: profile } = db ? await db.from('profiles').select('*').eq('id', data.user.id).single() : { data: null };
  if (profile) {
    STATE.profile = { answers: profile.assessment_data, plan: profile.generated_plan };
    if (profile.plan_status) STATE.user.plan = profile.plan_status;
    
    // Load daily logs
    var today = new Date().toISOString().split('T')[0];
    const { data: logs } = db ? await db.from('daily_logs').select('*').eq('user_id', data.user.id).eq('date', today).single() : { data: null };
    if (logs) {
      if (logs.weight_kg) STATE.weights = [logs.weight_kg];
      STATE.water = logs.water_glasses || 0;
      STATE.meals[today] = logs.meals_completed || [];
      STATE.sets = logs.workout_data || {};
    }
  } else {
    // No profile means they haven't finished assessment
    S('scr-assess');
    return;
  }
  
  save();
  buildApp();
  S('scr-app');
  nav('today');
}

// ═══════════════════════════════════════════════
// ASSESSMENT
// ═══════════════════════════════════════════════
var assessStep = 0;
var assessAnswers = {};

function renderAssessStep() {
  var step = ASSESS_STEPS[assessStep];
  var total = ASSESS_STEPS.length;
  document.getElementById('step-lbl').textContent = 'Step ' + (assessStep + 1) + ' / ' + total;

  // Update progress segments
  var segsHtml = '';
  for (var i = 0; i < total; i++) {
    var cls = i < assessStep ? 'done' : i === assessStep ? 'active' : '';
    segsHtml += '<div class="step-seg ' + cls + '"></div>';
  }
  document.getElementById('seg-bar').innerHTML = segsHtml;

  var back = document.getElementById('ab-btn');
  back.style.display = assessStep === 0 ? 'none' : 'block';

  var html = '<div class="assess-q">' + step.q + '</div>';
  html += '<div class="assess-sub">' + step.sub + '</div>';

  if (step.type === 'choice') {
    html += '<div class="opt-grid">';
    step.opts.forEach(function(o) {
      var sel = assessAnswers[step.key] === o.v;
      html += '<div class="opt' + (sel ? ' sel' : '') + '" onclick="selOpt(\'' + step.key + '\',\'' + o.v + '\',this)">'
        + '<div class="opt-ico">' + o.ico + '</div>'
        + '<div class="opt-body"><div class="opt-name">' + o.n + '</div><div class="opt-desc">' + o.d + '</div></div>'
        + '<div class="opt-ck">' + (sel ? '✓' : '') + '</div>'
        + '</div>';
    });
    html += '</div>';
  } else if (step.type === 'body') {
    html += '<div class="inp-label">Gender</div>';
    html += '<div class="gender-row">';
    ['male','female'].forEach(function(g) {
      var sel = assessAnswers.gender === g;
      html += '<div class="gender-card' + (sel ? ' sel' : '') + '" onclick="selGender(\'' + g + '\',this)">'
        + '<div class="gender-ico">' + (g === 'male' ? '👨' : '👩') + '</div>'
        + '<div class="gender-name">' + (g === 'male' ? 'Male' : 'Female') + '</div>'
        + '<div class="gender-ck">' + (sel ? '✓' : '') + '</div>'
        + '</div>';
    });
    html += '</div>';
    html += '<div class="inp-row">'
      + '<div><div class="inp-label">Your first name</div><input class="inp" id="inp-pname" placeholder="e.g. Rahul" value="' + (assessAnswers.pname || STATE.signupData.name || '') + '" style="margin-bottom:0"></div>'
      + '<div><div class="inp-label">Age</div><input class="inp" id="inp-age" type="number" placeholder="e.g. 28" value="' + (assessAnswers.age || '') + '" style="margin-bottom:0"></div>'
      + '</div>';
    html += '<div class="inp-row" style="margin-top:12px">'
      + '<div><div class="inp-label">Weight (kg)</div><input class="inp" id="inp-weight" type="number" step="0.1" placeholder="e.g. 70" value="' + (assessAnswers.weight || '') + '" style="margin-bottom:0"></div>'
      + '<div><div class="inp-label">Height (cm)</div><input class="inp" id="inp-height" type="number" placeholder="e.g. 172" value="' + (assessAnswers.height || '') + '" style="margin-bottom:0"></div>'
      + '</div>';
  } else if (step.type === 'cycle') {
    html += '<div class="opt-grid" style="grid-template-columns:1fr 1fr 1fr">';
    [{v:'yes',ico:'🌸',n:'Yes, regular'},{v:'irregular',ico:'📅',n:'Irregular'},{v:'no',ico:'❌',n:'No cycle'}].forEach(function(o) {
      var sel = assessAnswers.hasCycle === o.v;
      html += '<div class="opt cycle-opt' + (sel ? ' sel' : '') + '" data-val="' + o.v + '" onclick="selCycleOpt(this)">' +
        '<div class="opt-ico">' + o.ico + '</div>' +
        '<div class="opt-body"><div class="opt-name">' + o.n + '</div></div>' +
        '<div class="opt-ck">' + (sel ? '✓' : '') + '</div>' +
        '</div>';
    });
    html += '</div>';
    html += '<div id="cycle-details" style="' + (assessAnswers.hasCycle === 'yes' ? '' : 'display:none') + ';margin-top:16px">';
    html += '<div class="inp-label">When did your last period start?</div>';
    html += '<input class="inp" id="inp-last-period" type="date" value="' + (assessAnswers.lastPeriodDate || '') + '" style="margin-bottom:12px">';
    html += '<div class="inp-row">';
    html += '<div><div class="inp-label">Cycle length (days)</div><input class="inp" id="inp-cycle-len" type="number" min="21" max="45" placeholder="28" value="' + (assessAnswers.cycleLength || '28') + '" style="margin-bottom:0"></div>';
    html += '<div><div class="inp-label">Period duration (days)</div><input class="inp" id="inp-period-dur" type="number" min="2" max="10" placeholder="5" value="' + (assessAnswers.periodDuration || '5') + '" style="margin-bottom:0"></div>';
    html += '</div></div>';
  } else if (step.type === 'text') {
    html += '<input class="inp" id="inp-txt-' + step.key + '" placeholder="' + (step.placeholder || '') + '" value="' + (assessAnswers[step.key] || '') + '" style="margin-top:16px">';
  }

  document.getElementById('assess-body').innerHTML = html;
}

function selOpt(key, val, el) {
  assessAnswers[key] = val;
  el.parentNode.querySelectorAll('.opt').forEach(function(o) {
    o.classList.remove('sel');
    o.querySelector('.opt-ck').textContent = '';
  });
  el.classList.add('sel');
  el.querySelector('.opt-ck').textContent = '✓';
}

function selGender(g, el) {
  assessAnswers.gender = g;
  document.querySelectorAll('.gender-card').forEach(function(c) {
    c.classList.remove('sel');
    c.querySelector('.gender-ck').textContent = '';
  });
  el.classList.add('sel');
  el.querySelector('.gender-ck').textContent = '✓';
}

function selCycleOpt(el) {
  document.querySelectorAll('.cycle-opt').forEach(function(o) {
    o.classList.remove('sel');
    o.querySelector('.opt-ck').textContent = '';
  });
  el.classList.add('sel');
  el.querySelector('.opt-ck').textContent = '✓';
  var details = document.getElementById('cycle-details');
  if (details) details.style.display = el.dataset.val === 'yes' ? '' : 'none';
}

function assessNext() {
  var step = ASSESS_STEPS[assessStep];

  if (step.type === 'body') {
    var pname = document.getElementById('inp-pname');
    var age = document.getElementById('inp-age');
    var weight = document.getElementById('inp-weight');
    var height = document.getElementById('inp-height');
    if (pname) assessAnswers.pname = pname.value;
    if (age) assessAnswers.age = age.value;
    if (weight) assessAnswers.weight = weight.value;
    if (height) assessAnswers.height = height.value;
    if (!assessAnswers.gender) { alert('Please select your gender.'); return; }
    if (!assessAnswers.weight || !assessAnswers.height || !assessAnswers.age) { alert('Please fill in all fields.'); return; }
    if (parseFloat(assessAnswers.weight) < 20 || parseFloat(assessAnswers.weight) > 300) { alert('Please enter a valid weight between 20–300 kg.'); return; }
    if (parseFloat(assessAnswers.height) < 100 || parseFloat(assessAnswers.height) > 250) { alert('Please enter a valid height between 100–250 cm.'); return; }
  } else if (step.type === 'text') {
    var txtEl = document.getElementById('inp-txt-' + step.key);
    if (txtEl) assessAnswers[step.key] = txtEl.value.trim();
    if (!assessAnswers[step.key]) { alert('Please enter your ' + step.key + ' to continue.'); return; }
  } else if (step.type === 'cycle') {
    // Collect cycle inputs
    var hasCycle = document.querySelector('.cycle-opt.sel');
    if (!hasCycle) { alert('Please select an option to continue.'); return; }
    assessAnswers.hasCycle = hasCycle.dataset.val;
    if (assessAnswers.hasCycle === 'yes') {
      var lastPeriod = document.getElementById('inp-last-period');
      var cycleLen = document.getElementById('inp-cycle-len');
      var periodDur = document.getElementById('inp-period-dur');
      if (lastPeriod) assessAnswers.lastPeriodDate = lastPeriod.value;
      if (cycleLen) assessAnswers.cycleLength = cycleLen.value || '28';
      if (periodDur) assessAnswers.periodDuration = periodDur.value || '5';
    }
  } else {
    if (!assessAnswers[step.key]) { alert('Please select an option to continue.'); return; }
  }

  assessStep++;

  // After body step: insert female cycle questions if female
  if (step.type === 'body' && assessAnswers.gender === 'female') {
    // inject cycle step at current position if not already there
    var hasCycleStep = ASSESS_STEPS.some(function(s) { return s.type === 'cycle'; });
    if (!hasCycleStep) {
      ASSESS_STEPS.splice(assessStep, 0, {
        type: 'cycle',
        q: 'One more thing, ' + (assessAnswers.pname || 'you') + ' 🌸',
        sub: 'Your menstrual cycle directly affects your energy, strength, and nutrition needs. This helps us build the perfect plan for every phase.'
      });
    }
  }

  if (assessStep >= ASSESS_STEPS.length) {
    finishAssessment();
    return;
  }
  renderAssessStep();
}

function assessBack() {
  if (assessStep > 0) { assessStep--; renderAssessStep(); }
}
// Aliases used by app.html
function aNext() { assessNext(); }
function aBack() { assessBack(); }

async function finishAssessment() {
  var sd = STATE.signupData;
  var userId = STATE.user ? STATE.user.id : null;

  STATE.user = {
    id: userId,
    name: assessAnswers.pname || sd.name || 'User',
    email: sd.email || STATE.user?.email || '',
    phone: sd.phone || '',
    joined: new Date().toISOString(),
    plan: 'premium',
    billingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Show loading screen
  document.getElementById('assess-body').innerHTML =
    '<div style="text-align:center;padding:40px 20px">' +
    '<div style="font-size:40px;margin-bottom:16px;animation:spin 1.5s linear infinite">⚙️</div>' +
    '<div style="font-size:18px;font-weight:700;color:var(--t1);margin-bottom:8px">Building your AI plan...</div>' +
    '<div style="font-size:13px;color:var(--t2)">Our coach AI is calculating your perfect calories, macros & meal plan. This takes about 15 seconds.</div>' +
    '</div>';
  var assessNextBtn = document.querySelector('#scr-assess .btn-primary');
  if (assessNextBtn) assessNextBtn.disabled = true;

  // Save cycle data to db profiles if female
  var cycleData = null;
  if (assessAnswers.gender === 'female' && assessAnswers.hasCycle === 'yes') {
    cycleData = {
      hasCycle: 'yes',
      lastPeriodDate: assessAnswers.lastPeriodDate,
      cycleLength: parseInt(assessAnswers.cycleLength) || 28,
      periodDuration: parseInt(assessAnswers.periodDuration) || 5,
      updatedAt: new Date().toISOString()
    };
    STATE.cycleData = cycleData;
  }

  var plan;
  try {
    // Call OpenAI to generate personalized plan
    var resp = await fetch(API_BASE + '/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: assessAnswers })
    });
    if (!resp.ok) throw new Error('API error');
    var result = await resp.json();
    plan = result.plan;
  } catch (e) {
    console.warn('AI plan failed, falling back to local:', e);
    plan = generatePlan(assessAnswers);
  }

  // Ensure plan has required fields
  plan.answers = assessAnswers;
  STATE.profile = { answers: assessAnswers, plan: plan };
  STATE.weights = [parseFloat(assessAnswers.weight)];
  STATE.meals = {}; STATE.customMeals = [];
  STATE.water = 0; STATE.grocery = {}; STATE.sets = {};
  STATE.customExercises = [];
  save();

  // Save to db
  if (userId) {
    var profileUpdate = {
      id: userId,
      email: STATE.user.email,
      name: STATE.user.name,
      plan_status: 'premium',
      assessment_data: assessAnswers,
      generated_plan: plan
    };
    if (cycleData) profileUpdate.cycle_data = cycleData;
    if (db) await db.from('profiles').upsert(profileUpdate);
  }

  var assessNextBtn = document.querySelector('#scr-assess .btn-primary');
  if (assessNextBtn) assessNextBtn.disabled = false;

  // Show plan ready screen
  var goalNames = { muscle: 'Muscle Gain', fat_loss: 'Fat Loss', weight_gain: 'Healthy Weight Gain', general: 'General Fitness' };
  var dietNames = { nonveg: 'Non-vegetarian', egg: 'Eggetarian', veg: 'Vegetarian', vegan: 'Vegan' };
  var bmi = plan.bmi;
  var bmiNote = bmi < 18.5 ? ' (underweight)' : bmi > 25 ? ' (overweight)' : ' (healthy range)';

  document.getElementById('ready-desc').textContent = plan.coachNote ||
    ('Based on your ' + dietNames[assessAnswers.diet] + ' diet and ' + goalNames[assessAnswers.goal] + ' goal, your plan is calibrated to ' + plan.kcal + ' kcal/day with ' + plan.protein + 'g protein.');

  document.getElementById('ready-card').innerHTML =
    row('Daily calories', plan.kcal + ' kcal', 'var(--ac3)') +
    row('Protein target', plan.protein + 'g / day', 'var(--ac4)') +
    row('Carbs target', plan.carbs + 'g / day', '') +
    row('Fats target', plan.fat + 'g / day', '') +
    row('Your BMI', bmi + bmiNote, bmi < 18.5 ? 'var(--ac2)' : bmi > 25 ? 'var(--ac3)' : 'var(--ac)') +
    row('Diet type', dietNames[assessAnswers.diet] || '', 'var(--ac)') +
    row('Goal', goalNames[assessAnswers.goal] || '', 'var(--ac)') +
    row('Workout', (assessAnswers.location === 'home' ? 'Home program' : 'Gym PPL') + ' — ' + assessAnswers.days + ' days/week', '');

  S('scr-ready');
}

function row(k, v, color) {
  return '<div class="inline"><span class="ik">' + k + '</span><span class="iv"' + (color ? ' style="color:' + color + '"' : '') + '>' + v + '</span></div>';
}

function launchApp() {
  buildApp();
  S('scr-app');
  nav('today');
}

// ═══════════════════════════════════════════════
// APP NAVIGATION
// ═══════════════════════════════════════════════
var currentPage = 'today';

function buildApp() {
  if (!STATE.user || !STATE.profile) return;
  var u = STATE.user, plan = STATE.profile.plan;
  var unameEl = document.getElementById('app-uname');
  var avEl = document.getElementById('app-av');
  if (!unameEl || !avEl) return;
  unameEl.textContent = u.name.split(' ')[0];
  avEl.textContent = (u.name || 'U').charAt(0).toUpperCase();
  avEl.style.background =
    plan.goal === 'fat_loss' ? 'var(--ac2)' :
    plan.goal === 'weight_gain' ? 'var(--ac5)' : 'var(--ac)';

  // Auto-select today's workout day
  var dayMap = [5, 0, 1, 2, 3, 4, 5];
  STATE.gymDay = dayMap[new Date().getDay()];
  save();

  // Monday: auto-adapt plan via AI
  checkMondayAdapt();
}

function nav(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('on'); });
  document.querySelectorAll('.nb').forEach(function(b) { b.classList.remove('on'); });
  document.getElementById('page-' + page).classList.add('on');
  var nb = document.getElementById('nav-' + page);
  if (nb) nb.classList.add('on');
  var mainScroll = document.querySelector('.page-scroll');
  if (mainScroll) mainScroll.scrollTop = 0;
  currentPage = page;
  var renders = { today: renderToday, meals: renderMeals, workout: renderWorkout, progress: renderProgress, nutrition: renderNutrition, grocery: renderGrocery };
  if (renders[page]) renders[page]();
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
function getTotals() {
  var plan = STATE.profile.plan;
  var planMeals = plan.meals || [];
  var done = STATE.meals || {};
  var custom = STATE.customMeals || [];
  var tk = 0, tp = 0, mc = 0;
  planMeals.forEach(function(m, i) {
    if (done['p' + i]) { tk += m.k; tp += m.p; mc++; }
  });
  custom.forEach(function(m, i) {
    if (done['c' + i]) { tk += (m.kcal || 0); tp += (m.protein || 0); mc++; }
  });
  return { k: tk, p: tp, m: mc };
}

function ring(pct, color, lbl, sub, r) {
  var c = 2 * Math.PI * r, off = c * (1 - Math.min(1, pct));
  var vb = r * 2 + 14;
  return '<div class="ring-item">'
    + '<svg width="' + vb + '" height="' + vb + '" viewBox="0 0 ' + vb + ' ' + vb + '" style="transform:rotate(-90deg)">'
    + '<circle fill="none" stroke="var(--bg4)" stroke-width="5" cx="' + (r + 7) + '" cy="' + (r + 7) + '" r="' + r + '"/>'
    + '<circle fill="none" stroke="' + color + '" stroke-width="5" stroke-linecap="round" cx="' + (r + 7) + '" cy="' + (r + 7) + '" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" style="transition:stroke-dashoffset .6s"/>'
    + '</svg>'
    + '<div class="ring-val" style="color:' + color + '">' + Math.round(Math.min(1, pct) * 100) + '%</div>'
    + '<div class="ring-lbl">' + lbl + '</div>'
    + '<div class="ring-sub">' + sub + '</div>'
    + '</div>';
}

function mealCardHtml(m, idx, type) {
  var key = type + idx;
  var done = STATE.meals[key] || false;
  var isCustom = type === 'c';
  return '<div class="meal-card' + (done ? ' done' : '') + (isCustom ? ' custom' : '') + '" onclick="togMeal(\'' + key + '\',this)">'
    + '<div class="meal-ico">' + (m.i || '🍽️') + '</div>'
    + '<div class="meal-body">'
    + '<div class="meal-name">' + m.n + (isCustom ? ' <span class="chip chip-c">custom</span>' : '') + '</div>'
    + '<div class="meal-desc">' + m.d + '</div>'
    + '<div class="meal-chips">'
    + '<span class="chip chip-k">' + (m.k || m.kcal || 0) + ' kcal</span>'
    + '<span class="chip chip-p">' + (m.p || m.protein || 0) + 'g protein</span>'
    + '<span class="chip chip-t">' + (m.t || m.time || '') + '</span>'
    + '</div>'
    + '</div>'
    + '<div class="meal-ck' + (done ? ' done' : '') + '">' + (done ? '✓' : '') + '</div>'
    + '</div>';
}

// ═══════════════════════════════════════════════
// PHOTO MEAL LOGGING
// ═══════════════════════════════════════════════
var pendingMealKey = null;
var pendingMealCard = null;

function togMeal(key, card) {
  // If already done, un-log it without photo needed
  if (STATE.meals[key]) {
    STATE.meals[key] = false;
    if (STATE.mealPhotos) delete STATE.mealPhotos[key];
    save();
    card.classList.remove('done');
    var ck = card.querySelector('.meal-ck');
    ck.classList.remove('done');
    ck.textContent = '';
    if (currentPage === 'today') updateRings();
    if (currentPage === 'meals') updateMealProgress();
    return;
  }
  // Require photo to log
  pendingMealKey = key;
  pendingMealCard = card;
  openPhotoModal(key);
}

function openPhotoModal(key) {
  var modal = document.getElementById('photo-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.getElementById('photo-preview').innerHTML = '';
  document.getElementById('photo-preview').style.display = 'none';
  document.getElementById('photo-confirm-btn').style.display = 'none';
  pendingPhotoData = null;
}

var pendingPhotoData = null;

function openCamera() {
  document.getElementById('meal-photo-input').click();
}

function onPhotoChosen(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    pendingPhotoData = e.target.result;
    var preview = document.getElementById('photo-preview');
    preview.innerHTML = '<img src="' + pendingPhotoData + '" style="width:100%;border-radius:12px;max-height:220px;object-fit:cover">';
    preview.style.display = 'block';
    document.getElementById('photo-confirm-btn').style.display = 'block';
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function confirmMealPhoto() {
  if (!pendingPhotoData || !pendingMealKey) return;
  closePhotoModal();
  if (!STATE.mealPhotos) STATE.mealPhotos = {};
  STATE.mealPhotos[pendingMealKey] = pendingPhotoData;
  STATE.meals[pendingMealKey] = true;
  save();
  if (pendingMealCard) {
    pendingMealCard.classList.add('done');
    var ck = pendingMealCard.querySelector('.meal-ck');
    ck.classList.add('done');
    ck.textContent = '✓';
    // Add camera icon to show photo was taken
    var ico = pendingMealCard.querySelector('.meal-ico');
    if (ico) ico.innerHTML += '<span style="font-size:9px;position:absolute;bottom:0;right:0">📸</span>';
  }
  if (currentPage === 'today') updateRings();
  if (currentPage === 'meals') updateMealProgress();
  pendingMealKey = null;
  pendingMealCard = null;
  pendingPhotoData = null;
}

function closePhotoModal() {
  var modal = document.getElementById('photo-modal');
  if (modal) modal.style.display = 'none';
}

// ═══════════════════════════════════════════════
// CYCLE PHASE TRACKER
// ═══════════════════════════════════════════════
function getCyclePhase() {
  var cd = STATE.cycleData || (STATE.profile && STATE.profile.answers && STATE.profile.answers.hasCycle === 'yes' ? STATE.profile.answers : null);
  if (!cd || !cd.lastPeriodDate) return null;
  var lastPeriod = new Date(cd.lastPeriodDate);
  var today = new Date();
  var daysSince = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
  var cycleLen = parseInt(cd.cycleLength) || 28;
  var periodDur = parseInt(cd.periodDuration) || 5;
  var dayInCycle = daysSince % cycleLen;
  if (dayInCycle < periodDur) return { phase: 'menstrual', icon: '🌸', color: '#FF6B9D', tip: 'Iron-rich foods today. Rest is training too. Light yoga or walking is ideal.' };
  if (dayInCycle < 13) return { phase: 'follicular', icon: '⚡', color: '#FFD93D', tip: 'Energy is rising! Hit your heavy lifts today. Higher carbs to fuel peak performance.' };
  if (dayInCycle < 16) return { phase: 'ovulation', icon: '🔥', color: '#FF8C42', tip: 'Peak strength day. Go for PRs. High protein and stay well hydrated.' };
  return { phase: 'luteal', icon: '🌙', color: '#A78BFA', tip: 'Magnesium-rich foods help with cravings. Moderate intensity. Prioritize sleep.' };
}

async function logPeriodStart() {
  var cd = STATE.cycleData || {};
  cd.lastPeriodDate = new Date().toISOString().split('T')[0];
  cd.updatedAt = new Date().toISOString();
  STATE.cycleData = cd;
  if (STATE.profile && STATE.profile.answers) {
    STATE.profile.answers.lastPeriodDate = cd.lastPeriodDate;
  }
  save();
  if (STATE.user && STATE.user.id) {
    if (db) await db.from('profiles').update({ cycle_data: cd }).eq('id', STATE.user.id);
  }
  renderToday();
  alert('🌸 Period logged! Your plan has been updated for your cycle phase.');
}

// ═══════════════════════════════════════════════
// MONDAY AUTO-ADAPT
// ═══════════════════════════════════════════════
async function checkMondayAdapt() {
  if (new Date().getDay() !== 1) return; // Only Monday
  var plan = STATE.profile && STATE.profile.plan;
  if (!plan) return;
  var lastAdapted = plan.lastUpdated ? new Date(plan.lastUpdated) : null;
  if (lastAdapted) {
    var daysSince = (new Date() - lastAdapted) / (1000 * 60 * 60 * 24);
    if (daysSince < 6) return; // Already adapted this week
  }
  if (STATE.weights.length < 2) return; // Not enough data
  try {
    var resp = await fetch(API_BASE + '/api/adapt-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: STATE.profile.answers,
        currentPlan: plan,
        weeklyWeights: STATE.weights.slice(-8)
      })
    });
    if (!resp.ok) return;
    var result = await resp.json();
    if (result.plan) {
      STATE.profile.plan = Object.assign(plan, result.plan);
      save();
      if (STATE.user && STATE.user.id) {
        if (db) await db.from('profiles').update({ generated_plan: STATE.profile.plan }).eq('id', STATE.user.id);
      }
      console.log('Plan adapted for week:', result.plan.monthNumber);
    }
  } catch(e) {
    console.warn('Monday adapt failed:', e);
  }
}

// ═══════════════════════════════════════════════
// TODAY PAGE
// ═══════════════════════════════════════════════
function renderToday() {
  if (!STATE.profile) return;
  var plan = STATE.profile.plan;
  var u = STATE.user;
  var tips = COACH_TIPS[plan.goal] || COACH_TIPS.general;
  var dayIndex = new Date().getDay();
  var monthUpdateBanner = '';
  
  // Check if it's the 1st of the month
  if (new Date().getDate() === 1) {
    monthUpdateBanner = '<div class="card-gold" style="cursor:pointer;margin-bottom:16px" onclick="showMonthlyUpdate()"><div style="font-size:13px;font-weight:600;margin-bottom:3px">✨ Monthly plan update available</div><div style="font-size:12px;color:var(--t2)">Click to review your progress and get next month\'s plan.</div></div>';
  }
  var goalNames = { muscle: 'Muscle Gain', fat_loss: 'Fat Loss', weight_gain: 'Weight Gain', general: 'General Fitness' };
  var today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  var wk = plan.workout[Math.min(STATE.gymDay || 0, plan.workout.length - 1)];
  var bc = { push: 'var(--ac2)', pull: 'var(--ac4)', legs: 'var(--ac)', abs: 'var(--ac3)', cardio: '#C4B5FF', home: '#94A3B8' };

  var todayMeals = plan.meals.slice(0, 3);
  var mealsHtml = todayMeals.map(function(m, i) { return mealCardHtml(m, i, 'p'); }).join('');

  var wkHtml = wk.r
    ? '<div style="text-align:center;padding:10px 0"><div style="font-size:28px;margin-bottom:8px">💤</div><div style="font-size:14px;font-weight:600;color:var(--t2)">Rest day</div><div style="font-size:12px;color:var(--t3);margin-top:4px;line-height:1.6">Walk 20 min · eat all meals · sleep 8 hrs<br>Recovery is when transformation happens.</div></div>'
    : '<div style="font-size:11px;font-weight:700;color:var(--ac);letter-spacing:.07em;text-transform:uppercase;margin-bottom:10px">' + wk.n + ' — ' + wk.t + '</div>'
      + wk.exercises.slice(0, 3).map(function(e) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--bdr)">'
            + '<div style="width:7px;height:7px;border-radius:50%;background:' + (bc[e.badge] || '#888') + ';flex-shrink:0"></div>'
            + '<span style="flex:1;font-size:12px;color:var(--t1)">' + e.name + '</span>'
            + '<span style="font-size:10px;color:var(--t2)">' + e.sets + '×' + e.reps + '</span>'
            + '</div>';
        }).join('')
      + '<div style="font-size:11px;color:var(--t3);margin-top:8px;text-align:center">+' + Math.max(0, wk.exercises.length - 3) + ' more — open Workout tab</div>';

  // Cycle phase banner for female users
  var cycleBanner = '';
  var isFemale = STATE.profile.answers && STATE.profile.answers.gender === 'female';
  if (isFemale) {
    var phase = getCyclePhase();
    if (phase) {
      var phaseName = phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1) + ' Phase';
      cycleBanner = '<div class="card" style="background:linear-gradient(135deg,' + phase.color + '22,' + phase.color + '11);border:1px solid ' + phase.color + '44;margin-bottom:14px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
        '<span style="font-size:22px">' + phase.icon + '</span>' +
        '<div><div style="font-size:13px;font-weight:700;color:' + phase.color + '">' + phaseName + '</div>' +
        '<div style="font-size:11px;color:var(--t2)">Your plan is adapted for today\'s phase</div></div>' +
        '<button onclick="logPeriodStart()" style="margin-left:auto;font-size:10px;padding:6px 10px;background:' + phase.color + '33;border:1px solid ' + phase.color + '66;border-radius:20px;color:' + phase.color + ';cursor:pointer;font-weight:600">🌸 Log period</button>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--t1);line-height:1.5">' + phase.tip + '</div>' +
        '</div>';
    } else {
      cycleBanner = '<div class="card" style="border:1px solid #A78BFA44;margin-bottom:14px;padding:12px 14px;display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:18px">\uD83C\uDF38</span>' +
        '<div style="flex:1"><div style="font-size:12px;font-weight:600;color:#A78BFA">Track your cycle</div><div style="font-size:11px;color:var(--t2)">Log your period to get cycle-aware coaching</div></div>' +
        '<button onclick="logPeriodStart()" style="font-size:10px;padding:6px 10px;background:#A78BFA22;border:1px solid #A78BFA44;border-radius:20px;color:#A78BFA;cursor:pointer;font-weight:600">Start →</button>' +
        '</div>';
    }
  }

  document.getElementById('today-content').innerHTML =
    monthUpdateBanner +
    cycleBanner +
    '<div class="coach-card">'
    + '<div class="coach-tag">Coach insight — ' + u.name.split(' ')[0] + '</div>'
    + '<div class="coach-text">' + tips[dayIndex % tips.length] + '</div>'
    + '</div>'
    + '<div class="sh">Daily progress</div>'
    + '<div class="card"><div id="today-rings" class="rings"></div></div>'
    + '<div class="shrow"><span class="sh" style="margin:0">Today\'s meals</span><span style="font-size:12px;color:var(--ac);cursor:pointer" onclick="nav(\'meals\')">Log all →</span></div>'
    + mealsHtml
    + '<div class="shrow" style="margin-top:4px"><span class="sh" style="margin:0">Today\'s workout</span><span style="font-size:12px;color:var(--ac);cursor:pointer" onclick="nav(\'workout\')">Full plan →</span></div>'
    + '<div class="card">' + wkHtml + '</div>';

  updateRings();
}


function updateRings() {
  var el = document.getElementById('today-rings');
  if (!el) return;
  var plan = STATE.profile.plan;
  var t = getTotals();
  var w = STATE.water || 0;
  el.innerHTML =
    ring(t.k / plan.kcal, 'var(--ac3)', 'Calories', t.k + '/' + plan.kcal, 34) +
    ring(t.p / plan.protein, 'var(--ac4)', 'Protein', t.p + 'g/' + plan.protein + 'g', 34) +
    ring(w / plan.waterTarget, 'var(--ac)', 'Water', w + '/' + plan.waterTarget + ' gl', 34);
}

// ═══════════════════════════════════════════════
// MEALS PAGE
// ═══════════════════════════════════════════════
function renderMeals() {
  if (!STATE.profile) return;
  var plan = STATE.profile.plan;
  var custom = STATE.customMeals || [];

  var mealsHtml = plan.meals.map(function(m, i) { return mealCardHtml(m, i, 'p'); }).join('');
  if (custom.length > 0) {
    mealsHtml += '<div class="sh">Custom meals logged today</div>';
    mealsHtml += custom.map(function(m, i) { return mealCardHtml(m, i, 'c'); }).join('');
  }

  document.getElementById('meals-content').innerHTML =
    '<div id="meal-prog-wrap"></div>'
    + '<div class="shrow"><span class="sh" style="margin:0">Meals</span><button class="btn-icon" onclick="openModal(\'modal-meal\')">+ Add custom meal</button></div>'
    + mealsHtml
    + '<div class="sh">Water intake</div>'
    + '<div class="water-wrap">'
    + '<div class="water-box"><div class="water-n" id="wnum">' + (STATE.water || 0) + '</div><div style="font-size:11px;color:var(--t2)" id="wsub">of ' + plan.waterTarget + ' goal</div></div>'
    + '<div class="wbtns"><button class="wbtn" onclick="addWater(1)">+ Glass</button><button class="wbtn-s" onclick="addWater(-1)">Undo</button></div>'
    + '</div>'
    + '<div class="pb-row"><div class="pb-hd"><span id="wgl">Goal: ' + plan.waterTarget + ' glasses/day</span><span id="wpct" style="color:var(--ac4)">0%</span></div><div class="pb-track"><div class="pb-fill" id="wfill" style="width:0%;background:var(--ac4)"></div></div></div>';

  updateMealProgress();
  updateWaterDisplay();
}

function updateMealProgress() {
  var plan = STATE.profile.plan;
  var t = getTotals();
  var el = document.getElementById('meal-prog-wrap');
  if (!el) return;
  el.innerHTML = '<div class="card">'
    + pbRow('Calories', t.k, plan.kcal, 'kcal', 'var(--ac3)')
    + pbRow('Protein', t.p, plan.protein, 'g', 'var(--ac4)')
    + pbRowRaw('Meals logged', t.m, (plan.meals.length + (STATE.customMeals || []).length), '', 'var(--ac)')
    + '</div>';
}

function pbRow(label, val, max, unit, color) {
  var pct = Math.min(100, Math.round(val / max * 100));
  return '<div class="pb-row"><div class="pb-hd"><span>' + label + '</span><span style="color:' + color + '">' + val + ' / ' + max + ' ' + unit + '</span></div><div class="pb-track"><div class="pb-fill" style="width:' + pct + '%;background:' + color + '"></div></div></div>';
}
function pbRowRaw(label, val, max, unit, color) {
  var pct = Math.min(100, Math.round(val / Math.max(1, max) * 100));
  return '<div class="pb-row" style="margin-bottom:0"><div class="pb-hd"><span>' + label + '</span><span style="color:' + color + '">' + val + ' / ' + max + '</span></div><div class="pb-track"><div class="pb-fill" style="width:' + pct + '%;background:' + color + '"></div></div></div>';
}

function updateWaterDisplay() {
  var w = STATE.water || 0, g = STATE.profile.plan.waterTarget || 8;
  var pct = Math.min(100, Math.round(w / g * 100));
  var wn = document.getElementById('wnum');
  var wp = document.getElementById('wpct');
  var wf = document.getElementById('wfill');
  if (wn) wn.textContent = w;
  if (wp) wp.textContent = pct + '%';
  if (wf) wf.style.width = pct + '%';
}

function addWater(n) {
  STATE.water = Math.max(0, (STATE.water || 0) + n);
  save();
  updateWaterDisplay();
}

// ═══════════════════════════════════════════════
// WORKOUT PAGE
// ═══════════════════════════════════════════════
function renderWorkout() {
  if (!STATE.profile) return;
  var plan = STATE.profile.plan;
  var wk = plan.workout;
  var idx = STATE.gymDay || 0;
  var loc = plan.location || 'gym';
  var bc = { push: 'var(--ac2)', pull: 'var(--ac4)', legs: 'var(--ac)', abs: 'var(--ac3)', cardio: '#C4B5FF', home: '#94A3B8' };
  var bl = { push: 'Push', pull: 'Pull', legs: 'Legs', abs: 'Abs', cardio: 'Cardio', home: 'Home' };
  var ns = { push: 4, pull: 4, legs: 4, abs: 3, cardio: 1, home: 3 };

  var stripHtml = wk.map(function(d, i) {
    var dk = 'wkd-' + i;
    var isDone = STATE.sets[dk + '-done'];
    return '<button class="dbtn' + (d.r ? ' rest' : '') + (i === idx ? ' on' : '') + (isDone ? ' wd' : '') + '" onclick="selDay(' + i + ',this)">'
      + '<span class="dn">' + d.n + '</span><span class="dt">' + d.t.split('+')[0] + '</span></button>';
  }).join('');

  var hdrText = loc === 'home' ? 'Home Program · ' + plan.days + ' days/week' : 'PPL Gym Program · ' + plan.days + ' days/week';

  document.getElementById('workout-content').innerHTML =
    '<div class="card-ac" style="margin-bottom:12px">'
    + '<div style="font-size:11px;font-weight:700;color:var(--ac);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">' + hdrText + '</div>'
    + '<div style="font-size:12px;color:var(--t2)">Tap sets as you complete them. Tap exercise name for demo video and form cues.</div>'
    + '</div>'
    + '<div class="dstrip" id="wk-strip">' + stripHtml + '</div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div class="sh" style="margin:0">Exercises</div><button class="btn-icon" onclick="openModal(\'modal-exercise\')">+ Add exercise</button></div>'
    + '<div id="wk-exs"></div>'
    + renderCustomExercises();

  renderExercises(idx);
}

function renderCustomExercises() {
  var custom = STATE.customExercises || [];
  if (!custom.length) return '';
  var html = '<div class="sh">Custom exercises added today</div>';
  custom.forEach(function(e, i) {
    var sk = 'custom-ex-' + i;
    var done = (STATE.sets[sk] || 0) >= parseInt(e.sets || 1);
    html += '<div class="ex-card custom-ex' + (done ? ' all-done' : '') + '">'
      + '<div class="ex-top">'
      + '<div class="ex-dot" style="background:var(--ac4)"></div>'
      + '<div class="ex-info"><div class="ex-name">' + e.name + '</div><div class="ex-sets-lbl">' + e.sets + ' sets × ' + e.reps + ' reps' + (e.weight ? ' @ ' + e.weight + 'kg' : '') + '</div>' + (e.notes ? '<div class="ex-tip">' + e.notes + '</div>' : '') + '</div>'
      + '<span class="ex-badge badge-pull">Custom</span>'
      + '</div>'
      + '<div class="sets-row">'
      + Array.from({ length: parseInt(e.sets) || 3 }, function(_, si) {
          var isDone = (STATE.sets[sk] || 0) > si;
          return '<button class="sbt' + (isDone ? ' done' : '') + '" onclick="logSet(\'' + sk + '\',' + (parseInt(e.sets) || 3) + ',' + si + ')">S' + (si + 1) + '</button>';
        }).join('')
      + '</div>'
      + '</div>';
  });
  return html;
}

function selDay(i, btn) {
  STATE.gymDay = i; save();
  document.querySelectorAll('#wk-strip .dbtn').forEach(function(b) { b.classList.remove('on'); });
  btn.classList.add('on');
  renderExercises(i);
}

function renderExercises(idx) {
  var plan = STATE.profile.plan;
  var d = plan.workout[idx];
  var el = document.getElementById('wk-exs');
  if (!el) return;
  var bc = { push: 'var(--ac2)', pull: 'var(--ac4)', legs: 'var(--ac)', abs: 'var(--ac3)', cardio: '#C4B5FF', home: '#94A3B8' };
  var bl = { push: 'Push', pull: 'Pull', legs: 'Legs', abs: 'Abs', cardio: 'Cardio', home: 'Home' };

  if (d.r) {
    el.innerHTML = '<div class="card" style="text-align:center;padding:28px">'
      + '<div style="font-size:32px;margin-bottom:10px">💤</div>'
      + '<div style="font-size:15px;font-weight:600;color:var(--t2)">Rest day</div>'
      + '<div style="font-size:12px;color:var(--t3);margin-top:6px;line-height:1.65">Walk · stretch · eat all meals · sleep 8 hours<br>Recovery is when transformation happens.</div>'
      + '</div>';
    return;
  }

  var completedAll = d.exercises.every(function(e, ei) {
    var sk = 'e-' + idx + '-' + ei;
    return (STATE.sets[sk] || 0) >= e.sets;
  });
  if (completedAll && d.exercises.length > 0) {
    STATE.sets['wkd-' + idx + '-done'] = true; save();
    document.querySelectorAll('#wk-strip .dbtn')[idx] && document.querySelectorAll('#wk-strip .dbtn')[idx].classList.add('wd');
  }

  el.innerHTML = d.exercises.map(function(e, ei) {
    var sk = 'e-' + idx + '-' + ei;
    var ds = STATE.sets[sk] || 0;
    var all = ds >= e.sets;
    var setsHtml = e.badge === 'cardio'
      ? '<div style="font-size:11px;color:var(--t2);padding:3px 0">' + e.reps + '</div>'
      : '<div class="sets-row">' + Array.from({ length: e.sets }, function(_, si) {
          return '<button class="sbt' + (si < ds ? ' done' : '') + '" onclick="logSet(\'' + sk + '\',' + e.sets + ',' + si + ')">S' + (si + 1) + '</button>';
        }).join('') + '</div>';

    return '<div class="ex-card' + (all ? ' all-done' : '') + '">'
      + '<div class="ex-top">'
      + '<div class="ex-dot" style="background:' + (bc[e.badge] || '#888') + '"></div>'
      + '<div class="ex-info" style="cursor:pointer" onclick="showDemo(\'' + e.key + '\')">'
      + '<div class="ex-name">' + e.name + '</div>'
      + '<div class="ex-sets-lbl">' + e.sets + ' sets × ' + e.reps + ' · ' + e.rest + ' rest</div>'
      + (e.tip ? '<div class="ex-tip">💡 ' + e.tip + '</div>' : '')
      + '</div>'
      + '<div class="ex-actions">'
      + '<button class="demo-btn" onclick="showDemo(\'' + e.key + '\')">▶ Demo</button>'
      + '<span class="ex-badge badge-' + e.badge + '">' + (bl[e.badge] || '') + '</span>'
      + '</div>'
      + '</div>'
      + setsHtml
      + '</div>';
  }).join('');
}

function logSet(sk, total, si) {
  var cur = STATE.sets[sk] || 0;
  STATE.sets[sk] = Math.max(cur, si + 1);
  save();
  var idx = STATE.gymDay || 0;
  renderExercises(idx);
}

// ═══════════════════════════════════════════════
// PROGRESS PAGE
// ═══════════════════════════════════════════════
function renderProgress() {
  if (!STATE.profile) return;
  var plan = STATE.profile.plan;
  var logs = STATE.weights || [];
  var cur = logs[logs.length - 1] || parseFloat(STATE.profile.answers.weight || 70);
  var start = logs[0] || cur;
  var diff = parseFloat((cur - start).toFixed(1));
  var goal = plan.goal;
  var h = parseFloat(plan.height || 170) / 100;
  var bmi = Math.round(cur / (h * h) * 10) / 10;
  var targetW = goal === 'fat_loss' ? Math.max(45, cur - 10) : goal === 'weight_gain' ? Math.min(90, cur + 15) : cur + 7;

  var rate = logs.length > 1 ? parseFloat((cur - logs[logs.length - 2]).toFixed(2)) : null;
  var fb = 'Log your weight every Monday morning to get personalized coach feedback here.';
  if (rate !== null) {
    if (goal === 'fat_loss') {
      if (rate > -0.1) fb = 'Weight not dropping this week (' + rate + 'kg). Check your calorie tracking — are you logging everything? Reduce dinner carbs by half.';
      else if (rate >= -0.7) fb = 'Perfect fat loss pace — losing ' + Math.abs(rate) + 'kg/week. You\'re losing fat while protecting muscle. Keep going.';
      else fb = 'Losing too fast (' + Math.abs(rate) + 'kg/week). You\'re risking muscle loss. Add 100 kcal and increase protein by 10g.';
    } else if (goal === 'muscle' || goal === 'weight_gain') {
      if (rate < 0.1) fb = 'Weight stalled this week. Not eating enough. Add 1 banana + 1 tbsp peanut butter daily — easy 200 kcal.';
      else if (rate <= 0.6) fb = 'Excellent — gaining ' + rate + 'kg this week. Perfect pace. Keep everything the same.';
      else fb = 'Gaining too fast (' + rate + 'kg/week). Reduce dinner rice from 1 cup to ½ cup. Keep all other meals identical.';
    } else {
      fb = 'Tracking ' + Math.abs(diff) + 'kg change over ' + (logs.length - 1) + ' weeks. Consistency is the key metric.';
    }
  }

  var m = STATE.meas || {};
  var days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  var td = new Date().getDay();
  var t = getTotals();

  document.getElementById('progress-content').innerHTML =
    (bmi < 18.5 ? '<div class="card-red"><div style="font-size:12px;font-weight:700;color:var(--ac2);margin-bottom:4px">⚠ Low BMI</div><div style="font-size:12px;color:rgba(255,92,92,.8);line-height:1.6">Your BMI of ' + bmi + ' is below healthy range. Please consult a doctor before intensive training.</div></div>' : '')
    + '<div class="card-gold">'
    + '<div style="font-family:var(--fs);font-size:17px;margin-bottom:4px">Weekly check-in</div>'
    + '<div style="font-size:12px;color:var(--t2);margin-bottom:12px">' + logs.length + ' entries · log every Monday before eating</div>'
    + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">'
    + '<input class="inp" type="number" id="w-inp" placeholder="Weight (kg)" step="0.1" style="margin:0;flex:1">'
    + '<button style="padding:12px 16px;background:var(--ac);border:none;border-radius:var(--r);font-size:13px;font-weight:700;color:#050508;cursor:pointer;font-family:var(--ff)" onclick="logWeight()">Log ✓</button>'
    + '</div>'
    + '<div style="background:var(--bg3);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--t2);line-height:1.5">📸 Progress photo every Sunday — same pose, same lighting, same spot. Photos don\'t lie.</div>'
    + '</div>'
    + '<div class="sh">Overview</div>'
    + '<div class="stat-grid">'
    + statBox(start + ' kg', 'Start weight', '')
    + statBox(cur + ' kg', 'Current weight', 'var(--ac)')
    + statBox((diff >= 0 ? '+' : '') + diff + ' kg', 'Total change', diff >= 0 ? 'var(--ac)' : 'var(--ac2)')
    + statBox(targetW.toFixed(0) + ' kg', 'Goal weight', 'var(--ac3)')
    + statBox(bmi, 'BMI', bmi < 18.5 ? 'var(--ac2)' : bmi > 25 ? 'var(--ac3)' : 'var(--ac)')
    + statBox((Math.abs(targetW - cur)).toFixed(1) + ' kg', 'To goal', '')
    + '</div>'
    + '<div class="sh">Weight trend</div>'
    + '<div class="card"><div style="font-size:11px;color:var(--t2);margin-bottom:10px">' + logs.length + ' week trend</div><div class="wchart" id="wchart"></div></div>'
    + '<div class="card-ac" style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:var(--ac);letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px">Coach feedback</div><div style="font-size:13px;color:var(--t1);line-height:1.65">' + fb + '</div></div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0 10px"><div class="sh" style="margin:0">Body measurements</div><span style="font-size:12px;color:var(--ac);cursor:pointer" onclick="togMeasForm()">+ Update</span></div>'
    + '<div id="meas-form" style="display:none;margin-bottom:12px">'
    + '<input class="inp" type="number" id="ch-inp" placeholder="Chest (cm)" step="0.5">'
    + '<input class="inp" type="number" id="wa-inp" placeholder="Waist (cm)" step="0.5">'
    + '<input class="inp" type="number" id="bi-inp" placeholder="Bicep (cm)" step="0.5">'
    + '<input class="inp" type="number" id="hi-inp" placeholder="Hips (cm)" step="0.5">'
    + '<button style="width:100%;padding:13px;background:var(--ac);border:none;border-radius:var(--r);font-size:14px;font-weight:700;color:#050508;cursor:pointer;font-family:var(--ff)" onclick="saveMeas()">Save measurements</button>'
    + '</div>'
    + '<div class="stat-grid">'
    + statBox(m.chest || '—', 'Chest', '', m.chest ? m.chest + ' cm' : 'not logged')
    + statBox(m.waist || '—', 'Waist', '', m.waist ? m.waist + ' cm' : 'not logged')
    + statBox(m.bicep || '—', 'Bicep', '', m.bicep ? m.bicep + ' cm' : 'not logged')
    + statBox(m.hips || '—', 'Hips', '', m.hips ? m.hips + ' cm' : 'not logged')
    + '</div>'
    + '<div class="sh">7-day meal streak</div>'
    + '<div class="streak">' + days.map(function(d, i) {
        var day = (i + 1) % 7;
        var cls = day === td ? (t.m >= 4 ? 'tod hit' : 'tod') : day < td ? 'hit' : 'future';
        return '<div class="sd ' + cls + '">' + d + '</div>';
      }).join('') + '</div>'
    + '<div style="font-size:12px;color:var(--t2);margin-bottom:20px">' + t.m + ' meals logged today</div>';

  renderWeightChart();
}

function statBox(v, l, color, sub) {
  return '<div class="stat"><div class="stat-v"' + (color ? ' style="color:' + color + '"' : '') + '>' + v + '</div><div class="stat-l">' + l + '</div>' + (sub ? '<div class="stat-s">' + sub + '</div>' : '') + '</div>';
}

function renderWeightChart() {
  var logs = STATE.weights || [];
  var el = document.getElementById('wchart');
  if (!el) return;
  if (logs.length < 2) { el.innerHTML = '<div style="font-size:12px;color:var(--t3);text-align:center;width:100%;padding:20px">Log weight weekly to see trend</div>'; return; }
  var mn = Math.min.apply(null, logs) - 0.5, mx = Math.max.apply(null, logs) + 0.5;
  el.innerHTML = logs.map(function(v, i) {
    var h = Math.max(5, Math.round((v - mn) / (mx - mn) * 80) + 6);
    return '<div class="wc-col"><div class="wc-v">' + v + '</div><div class="wc-bar" style="height:' + h + 'px;background:' + (i === logs.length - 1 ? 'var(--ac)' : 'rgba(0,229,160,.28)') + '"></div><div class="wc-l">W' + (i + 1) + '</div></div>';
  }).join('');
}

function logWeight() {
  var v = parseFloat(document.getElementById('w-inp').value);
  if (isNaN(v) || v < 20 || v > 300) { alert('Enter a valid weight (20–300 kg)'); return; }
  STATE.weights.push(Math.round(v * 10) / 10);
  if (STATE.weights.length > 16) STATE.weights.shift();
  save();
  document.getElementById('w-inp').value = '';
  renderProgress();
}

function togMeasForm() {
  var f = document.getElementById('meas-form');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function saveMeas() {
  var m = STATE.meas || {};
  [['ch-inp', 'chest'], ['wa-inp', 'waist'], ['bi-inp', 'bicep'], ['hi-inp', 'hips']].forEach(function(pair) {
    var el = document.getElementById(pair[0]);
    if (el && parseFloat(el.value)) m[pair[1]] = Math.round(parseFloat(el.value) * 10) / 10;
  });
  STATE.meas = m; save();
  togMeasForm();
  renderProgress();
}

// ═══════════════════════════════════════════════
// NUTRITION PAGE
// ═══════════════════════════════════════════════
var recFilter = 'all';
function renderNutrition() {
  if (!STATE.profile) return;
  var plan = STATE.profile.plan;
  var diet = plan.diet || 'nonveg';
  var dietNames = { nonveg: 'Non-vegetarian', egg: 'Eggetarian', veg: 'Vegetarian', vegan: 'Vegan' };
  var goalNames = { muscle: 'Muscle Gain', fat_loss: 'Fat Loss', weight_gain: 'Weight Gain', general: 'General Fitness' };

  var rcats = [{ k: 'all', l: 'All' }, { k: 'air', l: '🌀 Air Fryer' }, { k: 'batch', l: '📦 Batch cook' }, { k: 'quick', l: '⚡ Quick' }, { k: 'sandwich', l: '🥙 Sandwich' }, { k: 'fruit', l: '🍓 Fruit' }];

  // Filter recipes by diet
  var filteredRecipes = RECIPES.filter(function(r) {
    var dietMatch = !r.dietTags || r.dietTags.indexOf(diet) !== -1;
    var catMatch = recFilter === 'all' || r.cat === recFilter;
    return dietMatch && catMatch;
  });

  document.getElementById('nutrition-content').innerHTML =
    '<div class="sh">Your plan</div>'
    + '<div class="card">'
    + row('Goal', goalNames[plan.goal] || plan.goal, 'var(--ac)')
    + row('Diet', dietNames[diet], 'var(--ac4)')
    + row('Daily calories', plan.kcal + ' kcal', 'var(--ac3)')
    + row('Protein', plan.protein + 'g/day', 'var(--ac4)')
    + row('Carbs', plan.carbs + 'g/day', '')
    + row('Fats', plan.fat + 'g/day', '')
    + row('Month', (plan.monthNumber || 1) + ' of your journey', 'var(--ac)')
    + '</div>'
    + '<div class="sh">Protein distribution across meals</div>'
    + '<div class="card">'
    + plan.meals.map(function(m) {
        return '<div class="inline"><div><div class="iv" style="font-size:12px">' + m.t + ' — ' + m.n + '</div></div><span class="chip chip-p">' + m.p + 'g</span></div>';
      }).join('')
    + '</div>'
    + '<div class="sh">Recipes — ' + dietNames[diet] + ' only</div>'
    + '<div class="rfrow">' + rcats.map(function(c) { return '<button class="rfbtn' + (recFilter === c.k ? ' on' : '') + '" onclick="filterRec(\'' + c.k + '\')">' + c.l + '</button>'; }).join('') + '</div>'
    + '<div id="rlist">' + filteredRecipes.map(function(r, i) {
        var uid = 'r' + i;
        return '<div class="rc"><div class="rc-head" onclick="togRec(\'' + uid + '\')">'
          + '<div class="rc-ico">' + r.i + '</div>'
          + '<div class="rc-body"><div class="rc-tag" style="background:' + r.tcls + ';color:' + r.tc + '">' + r.tag + '</div><div class="rc-name">' + r.n + '</div><div class="rc-macro">' + (r.p ? r.p + ' protein · ' : '') + r.k + '</div></div>'
          + '<div class="rc-arr" id="arr' + uid + '">▾</div>'
          + '</div><div class="rc-detail" id="' + uid + '">' + r.d + '</div></div>';
      }).join('') + '</div>';
}

function filterRec(k) {
  recFilter = k;
  renderNutrition();
}

function togRec(uid) {
  var d = document.getElementById(uid), a = document.getElementById('arr' + uid);
  if (!d) return;
  var o = d.classList.toggle('open');
  if (a) a.classList.toggle('open', o);
}

// ═══════════════════════════════════════════════
// GROCERY PAGE
// ═══════════════════════════════════════════════
function renderGrocery() {
  if (!STATE.profile) return;
  var diet = STATE.profile.plan.diet || 'nonveg';
  var lists = (GROCERY[diet] || GROCERY.nonveg).concat(GROCERY.common);

  document.getElementById('grocery-content').innerHTML =
    '<div class="card-ac" style="margin-bottom:14px">₹1,500–2,000/week · vegetables from sabzi mandi only<br><span style="font-size:11px;color:var(--t2)">Optimized for your ' + diet + ' plan</span></div>'
    + '<div style="display:flex;gap:8px;margin-bottom:14px">'
    + '<button class="btn-sm" style="flex:1" onclick="clearG()">Reset list</button>'
    + '<button class="btn-sm" style="flex:1" onclick="allG()">All done</button>'
    + '</div>'
    + lists.map(function(g) {
        return '<div class="gc">' + g.cat + '</div>'
          + g.items.map(function(item, i) {
              var key = (g.cat + i).replace(/\s/g, '').slice(0, 12);
              var got = STATE.grocery[key] || false;
              return '<div class="gi' + (got ? ' got' : '') + '" onclick="togG(\'' + key + '\',this)">'
                + '<div class="gi-ck' + (got ? ' done' : '') + '">' + (got ? '✓' : '') + '</div>'
                + '<span class="gi-name">' + item.n + '</span>'
                + '<span class="gi-qty">' + item.q + '</span>'
                + '</div>';
            }).join('');
      }).join('');
}

function togG(key, el) {
  STATE.grocery[key] = !STATE.grocery[key]; save();
  el.classList.toggle('got');
  var ck = el.querySelector('.gi-ck'); ck.classList.toggle('done'); ck.textContent = STATE.grocery[key] ? '✓' : '';
}
function clearG() { STATE.grocery = {}; save(); renderGrocery(); }
function allG() {
  var diet = STATE.profile.plan.diet || 'nonveg';
  var lists = (GROCERY[diet] || GROCERY.nonveg).concat(GROCERY.common);
  lists.forEach(function(g) { g.items.forEach(function(_, i) { STATE.grocery[(g.cat + i).replace(/\s/g, '').slice(0, 12)] = true; }); });
  save(); renderGrocery();
}

// ═══════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════
function openModal(id) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById(id).classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(function(m) { m.classList.add('hidden'); });
}

// CUSTOM MEAL
function saveCustomMeal() {
  var name = document.getElementById('cm-name').value.trim();
  var kcal = parseInt(document.getElementById('cm-kcal').value) || 0;
  var protein = parseInt(document.getElementById('cm-protein').value) || 0;
  var time = document.getElementById('cm-time').value.trim();
  var notes = document.getElementById('cm-notes').value.trim();
  if (!name) { alert('Please enter a meal name.'); return; }
  var meal = { n: name, i: '🍽️', d: notes || 'Custom logged meal', kcal: kcal, k: kcal, protein: protein, p: protein, t: time || 'Custom', time: time };
  STATE.customMeals = STATE.customMeals || [];
  STATE.customMeals.push(meal);
  save();
  closeModal();
  ['cm-name', 'cm-kcal', 'cm-protein', 'cm-time', 'cm-notes'].forEach(function(id) { document.getElementById(id).value = ''; });
  if (currentPage === 'meals') renderMeals();
  alert('✓ Meal "' + name + '" added and tracked!');
}

// CUSTOM EXERCISE
function saveCustomExercise() {
  var name = document.getElementById('ce-name').value.trim();
  var sets = document.getElementById('ce-sets').value;
  var reps = document.getElementById('ce-reps').value;
  var weight = document.getElementById('ce-weight').value;
  var notes = document.getElementById('ce-notes').value.trim();
  if (!name || !sets || !reps) { alert('Please fill in exercise name, sets and reps.'); return; }
  STATE.customExercises = STATE.customExercises || [];
  STATE.customExercises.push({ name: name, sets: sets, reps: reps, weight: weight, notes: notes });
  save();
  closeModal();
  ['ce-name', 'ce-sets', 'ce-reps', 'ce-weight', 'ce-notes'].forEach(function(id) { document.getElementById(id).value = ''; });
  if (currentPage === 'workout') renderWorkout();
  alert('✓ Exercise "' + name + '" added to today\'s session!');
}

// EXERCISE DEMO
function showDemo(key) {
  var ex = EXERCISES[key];
  if (!ex) return;
  document.getElementById('demo-title').textContent = ex.n;
  var musclesHtml = ex.muscles.map(function(m) { return '<span class="muscle-tag">' + m + '</span>'; }).join('');
  var cuesHtml = ex.cues.map(function(c, i) {
    return '<div class="demo-cue"><div class="demo-num">' + (i + 1) + '</div><div>' + c + '</div></div>';
  }).join('');
  document.getElementById('demo-body').innerHTML =
    '<iframe class="demo-yt" src="https://www.youtube.com/embed/' + ex.ytId + '?rel=0&modestbranding=1" allowfullscreen></iframe>'
    + '<div class="demo-muscle">' + musclesHtml + '</div>'
    + '<div style="font-size:12px;font-weight:600;color:var(--t2);margin-bottom:10px">FORM CUES</div>'
    + '<div class="demo-cues">' + cuesHtml + '</div>';
  openModal('modal-demo');
}

// MONTHLY UPDATE
function showMonthlyUpdate() {
  var update = generateMonthlyUpdate(STATE);
  var el = document.getElementById('update-body');

  if (!update.canUpdate) {
    el.innerHTML = '<div style="font-size:13px;color:var(--t2);line-height:1.6">' + update.reason + '</div>';
    document.querySelector('#modal-update .modal-foot').style.display = 'none';
  } else {
    document.querySelector('#modal-update .modal-foot').style.display = 'block';
    var changesHtml = update.changes.length > 0
      ? update.changes.map(function(ch) {
          return '<div class="update-change"><span style="color:var(--t2)">' + ch.label + '</span><span class="update-arrow">→</span><span style="font-weight:600;color:var(--ac)">' + ch.to + '</span><span style="font-size:10px;color:var(--t3);margin-left:4px">' + ch.reason + '</span></div>';
        }).join('')
      : '<div class="update-change" style="color:var(--ac)">✓ No changes needed — plan is working perfectly</div>';

    var stepsHtml = update.nextSteps.map(function(s, i) {
      return '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr);font-size:12px;color:var(--t2)"><span style="color:var(--ac);font-weight:700">' + (i + 1) + '.</span>' + s + '</div>';
    }).join('');

    el.innerHTML = '<div class="update-section"><div class="update-title">Month ' + update.month + ' Analysis</div><div class="update-body">' + update.feedback + '</div></div>'
      + '<div class="update-section"><div class="update-title">Plan changes</div>' + changesHtml + '</div>'
      + (update.workoutProgression ? '<div class="update-section"><div class="update-title">Workout progression</div><div class="update-body">' + update.workoutProgression + '</div></div>' : '')
      + '<div class="update-section"><div class="update-title">Month ' + update.month + ' focus</div>' + stepsHtml + '</div>';

    window._pendingUpdate = update;
  }
  openModal('modal-update');
}

function applyMonthlyUpdate() {
  if (!window._pendingUpdate) return;
  applyUpdate(window._pendingUpdate);
  closeModal();
  alert('✓ Your plan has been updated for Month ' + window._pendingUpdate.month + '!');
  if (currentPage === 'today') renderToday();
  if (currentPage === 'nutrition') renderNutrition();
}

// PROFILE
function showProfile() {
  var u = STATE.user;
  var plan = STATE.profile.plan;
  var goalNames = { muscle: 'Muscle Gain', fat_loss: 'Fat Loss', weight_gain: 'Weight Gain', general: 'General Fitness' };
  var dietNames = { nonveg: 'Non-vegetarian', egg: 'Eggetarian', veg: 'Vegetarian', vegan: 'Vegan' };
  var billing = u.billingDate ? new Date(u.billingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

  document.getElementById('profile-body').innerHTML =
    '<div style="text-align:center;margin-bottom:20px">'
    + '<div style="width:60px;height:60px;border-radius:50%;background:var(--ac);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#050508;margin:0 auto 10px">' + (u.name || 'U').charAt(0).toUpperCase() + '</div>'
    + '<div style="font-size:18px;font-weight:700">' + u.name + '</div>'
    + '<div style="font-size:12px;color:var(--t2)">' + u.email + '</div>'
    + '</div>'
    + '<div class="card">'
    + row('Plan', 'Premium — ₹299/month', 'var(--ac)')
    + row('Goal', goalNames[plan.goal] || '', '')
    + row('Diet type', dietNames[plan.diet] || '', '')
    + row('Workout', (plan.location === 'home' ? 'Home' : 'Gym') + ' · ' + plan.days + ' days/week', '')
    + row('Current month', 'Month ' + (plan.monthNumber || 1), 'var(--ac3)')
    + row('Next billing', billing, '')
    + row('Member since', new Date(u.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), '')
    + '</div>'
    + '<div class="card-gold" style="cursor:pointer" onclick="showMonthlyUpdate();closeModal()"><div style="font-size:13px;font-weight:600;margin-bottom:3px">📊 Request monthly plan update</div><div style="font-size:12px;color:var(--t2)">Update your plan based on your progress</div></div>'
    + '<div class="card" style="margin-top:12px">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--t1)">💬 Support</div>'
    + '<a href="https://wa.me/918147757479" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:12px;background:#25D366;border-radius:12px;text-decoration:none;margin-bottom:10px"><span style="font-size:20px">📲</span><div><div style="font-size:13px;font-weight:700;color:#fff">WhatsApp Support</div><div style="font-size:11px;color:rgba(255,255,255,0.8)">+91 8147757479 · Quick replies</div></div></a>'
    + '<a href="mailto:info@socialninjas.in" style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg2);border-radius:12px;text-decoration:none"><span style="font-size:20px">📧</span><div><div style="font-size:13px;font-weight:600;color:var(--t1)">Email Support</div><div style="font-size:11px;color:var(--t2)">info@socialninjas.in</div></div></a>'
    + '</div>';
  openModal('modal-profile');
}

function resetApp() {
  if (!confirm('Sign out and reset all data? This cannot be undone.')) return;
  localStorage.removeItem('snfit2');
  location.reload();
}

// ═══════════════════════════════════════════════
// INIT
function initFoodDB() {
  if (typeof FOOD_DB === 'undefined') return;
  var dl = document.getElementById('food-db-list');
  if (!dl) return;
  dl.innerHTML = '';
  FOOD_DB.forEach(function(f) {
    var opt = document.createElement('option');
    opt.value = f.n;
    dl.appendChild(opt);
  });
}

function fillFoodMacros() {
  var name = document.getElementById('cm-name').value;
  if (typeof FOOD_DB === 'undefined') return;
  var food = FOOD_DB.find(function(f) { return f.n === name; });
  if (food) {
    document.getElementById('cm-kcal').value = food.k;
    document.getElementById('cm-prot').value = food.p;
    document.getElementById('cm-carb').value = food.c;
    document.getElementById('cm-fat').value = food.f;
  }
}

// ═══════════════════════════════════════════════
(function init() {
  initFoodDB();
  try {
    if (STATE.user && STATE.profile && STATE.profile.plan) {
      buildApp();
      S('scr-app');
      nav('today');
    } else {
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'login') {
        S('scr-login');
      } else {
        S('scr-landing');
      }
    }
  } catch(e) {
    console.error('Init error, resetting to landing:', e);
    S('scr-landing');
  }
})();
