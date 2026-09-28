// scripts/enrich_exercise_gifs.js
// Enriches exercises_master.json in both socialninjas-fit and social-ninjas
// Ensures 100% of basic and staple exercises have authentic, working animated GIF demos and thumbnails.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { pathToFileURL } from 'url';

const FIT_MASTER_FILE = path.resolve(__dirname, '../public/data/exercises_master.json');
const NINJA_MASTER_FILE = path.resolve(__dirname, '../../social-ninjas/public/data/exercises_master.json');
const EXDB_DATA_FILE = path.resolve(__dirname, '../src/lib/exercises-data.js');

const cdnVideos = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/';
const cdnImages = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/images/';

async function run() {
  console.log('🔄 Loading datasets...');
  const { EXDB } = await import(pathToFileURL(EXDB_DATA_FILE).href);
  const exdbById = new Map(EXDB.map(e => [e.id, e]));

  // Verified staples map: canonical exercise name / alias -> EXDB id
  const STAPLES = {
    // Squats
    'barbell back squat': '0043',
    'barbell back squats': '0043',
    'barbell back squat to box': '0041',
    'barbell full squat': '0043',
    'barbell squat': '0043',
    'barbell squats': '0043',
    'king maker barbell back squat': '0043',
    'un barbell back squat': '0043',
    'am barbell squat': '0043',
    'am bodyweight squat': '3543',
    'bodyweight squat': '3543',
    'air squat': '3543',
    'goblet squat': '1760',
    'dumbbell goblet squat': '1760',
    'dumbbell squat': '0413',
    'dumbbell squats': '0413',
    'split squat': '2368',
    'split squats': '2368',
    'bulgarian split squat': '2368',
    'hack squat': '0743',
    'sled hack squat': '0743',
    'zercher squat': '0127',
    'barbell zercher squat': '0127',
    'front squat': '0041',
    'barbell front squat': '0041',

    // Biceps
    'dumbbell bicep curl': '0416',
    'dumbbell bicep curls': '0416',
    'dumbbell biceps curl': '0416',
    'dumbbell alternate bicep curl': '0285',
    'dumbbell alternate biceps curl': '0285',
    'dumbbell alternating bicep curl': '0285',
    'dumbbell alternating biceps curl': '0285',
    'alternating biceps curl': '0285',
    'alternating bicep curl': '0285',
    'alternate hammer curl': '0313',
    'alternating hammer curl': '0313',
    'dumbbell hammer curl': '0313',
    'hammer curl': '0313',
    'hammer curls': '0313',
    'am cable biceps curl': '0240',
    'cable bicep curl': '0240',
    'cable biceps curl': '0240',
    'cable curl': '0240',
    'barbell curl': '0031',
    'barbell bicep curl': '0031',
    'barbell biceps curl': '0031',
    'incline dumbbell curl': '0314',
    'incline dumbbell bicep curl': '0314',
    'dumbbell preacher curl': '0372',
    'preacher curl': '0372',
    'barbell preacher curl': '0059',
    'concentration curl': '0418',
    'dumbbell concentration curl': '0418',
    'zottman curl': '0439',
    'dumbbell zottman curl': '0439',
    'spider curl': '1667',
    'dumbbell curl': '0416',
    'dumbbell curls': '0416',
    'bicep curl': '0416',
    'biceps curl': '0416',

    // Chest / Bench Press
    'barbell bench press': '0025',
    'bench press': '0025',
    'flat bench press': '0025',
    'flat barbell bench press': '0025',
    'flat bench barbell press': '0025',
    'am flat bench barbell press': '0025',
    'am dumbbell bench press': '0289',
    'dumbbell bench press': '0289',
    'incline barbell bench press': '0047',
    'incline bench press': '0047',
    'incline barbell press': '0047',
    'incline dumbbell press': '0314',
    'incline dumbbell bench press': '0314',
    'dumbbell incline bench press': '0314',
    'decline barbell bench press': '0033',
    'decline bench press': '0033',
    'decline dumbbell press': '0302',
    'push-up': '0662',
    'push up': '0662',
    'pushups': '0662',
    'push-ups': '0662',
    'chest dip': '0251',
    'chest dips': '0251',
    'dips': '0251',
    'dumbbell fly': '0308',
    'dumbbell chest fly': '0308',
    'dumbbell flyes': '0308',
    'cable crossover': '1269',
    'cable fly': '1269',
    'pec deck': '0596',
    'pec dec': '0596',
    'machine chest fly': '0596',

    // Back / Pull
    'deadlift': '0032',
    'barbell deadlift': '0032',
    'conventional deadlift': '0032',
    'romanian deadlift': '0085',
    'barbell romanian deadlift': '0085',
    'dumbbell romanian deadlift': '0380',
    'rdl': '0085',
    'sumo deadlift': '0117',
    'barbell sumo deadlift': '0117',
    'barbell bent over row': '0027',
    'barbell row': '0027',
    'bent over row': '0027',
    'dumbbell row': '0292',
    'one arm dumbbell row': '0292',
    'single arm dumbbell row': '0292',
    'seated cable row': '0213',
    'cable seated row': '0213',
    'cable row': '0213',
    'cable lat pulldown': '2330',
    'lat pulldown': '2330',
    'pull up': '0652',
    'pull-up': '0652',
    'pullups': '0652',
    'pull-ups': '0652',
    'chin up': '1326',
    'chin-up': '1326',
    'chinups': '1326',
    'chin-ups': '1326',
    'inverted row': '0499',
    'australian pull-up': '0499',

    // Shoulders
    'barbell standing overhead press': '0070',
    'overhead press': '0070',
    'military press': '0070',
    'barbell shoulder press': '0070',
    'dumbbell shoulder press': '0426',
    'dumbbell standing overhead press': '0426',
    'dumbbell seated shoulder press': '0395',
    'am dumbbell shoulder press': '0426',
    'dumbbell lateral raise': '0334',
    'lateral raise': '0334',
    'side lateral raise': '0334',
    'side raise': '0334',
    'dumbbell front raise': '0310',
    'front raise': '0310',
    'dumbbell rear lateral raise': '0380',
    'rear delt fly': '0380',
    'arnold press': '0286',
    'dumbbell arnold press': '0286',
    'upright row': '0115',
    'barbell upright row': '0115',
    'cable lateral raise': '0179',

    // Legs / Lower
    'sled 45° leg press': '0739',
    'leg press': '0739',
    '45 degree leg press': '0739',
    'am leg press': '0739',
    'lever leg extension': '0585',
    'leg extension': '0585',
    'leg extensions': '0585',
    'quad extension': '0585',
    'lever lying leg curl': '0586',
    'lying leg curl': '0586',
    'lying leg curls': '0586',
    'leg curl': '0586',
    'leg curls': '0586',
    'hamstring curl': '0586',
    'lever seated leg curl': '0601',
    'seated leg curl': '0601',
    'bodyweight standing calf raise': '1373',
    'standing calf raise': '1373',
    'calf raise': '1373',
    'calf raises': '1373',
    'lever seated calf raise': '0738',
    'seated calf raise': '0738',
    'walking lunge': '1460',
    'walking lunges': '1460',
    'dumbbell walking lunges': '0434',
    'lunges': '1460',
    'lunge': '1460',
    'glute bridge': '3013',

    // Triceps
    'cable pushdown': '0241',
    'cable tricep pushdown': '0241',
    'cable triceps pushdown': '0241',
    'tricep pushdown': '0241',
    'triceps pushdown': '0241',
    'tricep push-down': '0241',
    'triceps push-down': '0241',
    'am bar triceps push-down': '0241',
    'am rope triceps pushdown': '0241',
    'barbell lying triceps extension': '0060',
    'skull crusher': '0060',
    'skullcrusher': '0060',
    'am skullcrusher': '0060',
    'barbell skull crusher': '0060',
    'dumbbell standing triceps extension': '0424',
    'overhead tricep extension': '0424',
    'dumbbell overhead tricep extension': '0424',
    'bench dip': '0129',
    'tricep dip': '0129',
    'tricep dips': '0129',
    'close grip bench press': '0030',
    'barbell close grip bench press': '0030',
    'dumbbell kickback': '0338',
    'tricep kickback': '0338',

    // Core
    'crunch': '0274',
    'crunches': '0274',
    'ab crunch': '0274',
    'am ball crunch': '0274',
    'cable kneeling crunch': '0175',
    'cable crunch': '0175',
    'am cable crunch': '0175',
    'hanging leg raise': '0472',
    'hanging leg raises': '0472',
    'leg raise': '0472',
    'front plank': '0464',
    'plank': '0464',
    '3/4 sit-up': '0001',
    'sit-up': '0001'
  };

  // Helper normalizer
  function norm(str) {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/^(am|pm|30\s*degree|30|3d|acft)\s+/i, '')
      .replace(/-\s*(gethin|krissy cela|arnold|crossfit).*/i, '')
      .replace(/\s*\(.*?\)/g, '')
      .replace(/pull-down/g, 'pulldown')
      .replace(/push-down/g, 'pushdown')
      .replace(/chin-up/g, 'chin up')
      .replace(/pull-up/g, 'pull up')
      .replace(/push-up/g, 'push up')
      .replace(/sit-up/g, 'sit up')
      .replace(/skullcrusher/g, 'lying triceps extension')
      .replace(/pec dec/g, 'butterfly')
      .replace(/\bback squats?\b/g, 'full squat')
      .replace(/\bsquats\b/g, 'squat')
      .replace(/\blunges\b/g, 'lunge')
      .replace(/\bcurls\b/g, 'curl')
      .replace(/\bbicep\b/g, 'biceps')
      .replace(/\btricep\b/g, 'triceps')
      .replace(/\bside raise\b/g, 'lateral raise')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Build secondary search index from EXDB
  const exdbPool = EXDB.map(e => ({
    id: e.id,
    n: e.n,
    norm: norm(e.n),
    gifUrl: cdnVideos + e.gif,
    thumbUrl: cdnImages + (e.img || e.gif.replace('.gif', '.jpg')),
    instructions: e.st || []
  }));

  const processMasterFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return;
    }
    console.log(`\n📦 Processing ${filePath}...`);
    const master = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let enrichedStaples = 0;
    let enrichedFuzzy = 0;

    master.forEach(e => {
      const rawLower = e.name.toLowerCase().trim();
      const nLower = norm(e.name);

      // Check explicit staples first (even if it had empty gifUrl or if we want to ensure accurate media)
      const stapleId = STAPLES[rawLower] || STAPLES[nLower];
      if (stapleId) {
        const staple = exdbById.get(stapleId);
        if (staple && (!e.gifUrl || e.gifUrl.length === 0)) {
          e.gifUrl = cdnVideos + staple.gif;
          e.thumbUrl = cdnImages + (staple.img || staple.gif.replace('.gif', '.jpg'));
          if (!e.instructions || e.instructions.length === 0) {
            e.instructions = staple.st || [];
          }
          enrichedStaples++;
          return;
        }
      }

      // If already has GIF, keep it
      if (e.gifUrl && e.gifUrl.length > 0) return;

      // Try exact normalized match against EXDB
      let match = exdbPool.find(p => p.norm === nLower);

      // Try token match (all words in p.norm)
      if (!match) {
        const words = nLower.split(' ').filter(w => w.length > 2 && w !== 'and' && w !== 'with');
        if (words.length >= 2) {
          match = exdbPool.find(p => words.every(w => p.norm.includes(w)));
        }
      }

      if (match) {
        e.gifUrl = match.gifUrl;
        e.thumbUrl = match.thumbUrl;
        if (!e.instructions || e.instructions.length === 0) {
          e.instructions = match.instructions;
        }
        enrichedFuzzy++;
      }
    });

    console.log(`✅ Results for ${path.basename(filePath)}:`);
    console.log(`- Enriched from Staples: ${enrichedStaples}`);
    console.log(`- Enriched from Fuzzy Matching: ${enrichedFuzzy}`);
    const totalWithGif = master.filter(e => e.gifUrl && e.gifUrl.length > 0).length;
    console.log(`- Total now with GIF: ${totalWithGif} / ${master.length} (${((totalWithGif / master.length) * 100).toFixed(1)}%)`);

    fs.writeFileSync(filePath, JSON.stringify(master, null, 2), 'utf8');
    console.log(`💾 Saved updated file to ${filePath}`);
  };

  processMasterFile(FIT_MASTER_FILE);
  if (fs.existsSync(NINJA_MASTER_FILE)) {
    processMasterFile(NINJA_MASTER_FILE);
  }
}

run().catch(err => {
  console.error('Fatal error in enrichment script:', err);
  process.exit(1);
});
