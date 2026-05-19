const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/generate-workout', async (req, res) => {
  const {
    week, trimester, dayType, dayLabel, dayOfWeek,
    checkin, restrictions, weekHistory, weekCounts
  } = req.body;

  const historyStr = weekHistory && weekHistory.length > 0
    ? `Completed this week so far: ${weekHistory.join(', ')}.`
    : 'No workouts completed yet this week.';

  const checkinStr = [
    `Energy: ${checkin.energy || 'not specified'}`,
    `Nausea: ${checkin.nausea || 'none'}`,
    `Pelvic pressure: ${checkin.pelvic || 'none'}`,
    `Sleep last night: ${checkin.sleep || 'not specified'}`,
    `Mood: ${checkin.mood || 'not specified'}`,
    `Movement preference: ${checkin.preference || 'open'}`,
  ].join('\n  ');

  // ── REST DAY ──────────────────────────────────────────────────────────────
  if (dayType === 'rest') {
    const prompt = `You are a warm, knowledgeable prenatal wellness coach. Today is a planned rest day for a woman in week ${week} of pregnancy (${trimester}).

Her check-in:
  ${checkinStr}

Write a rest day wellness guide. Be specific to week ${week} and her trimester. Be warm and personal — she is growing a human being and deserves to feel celebrated on rest days, not guilty.

YOUR FIRST LINE must be exactly:
Rest & Restore | Today | Gentle

Then write these sections using EXACT headers:
--- Nourishment (tips) ---
--- Body Care (tips) ---
--- Pelvic Floor (tips) ---
--- Mindfulness (tips) ---
--- Safety Notes ---

Each section: 3 specific, practical, trimester-appropriate bullet points using • symbol.
Safety Notes: exactly 2 numbered notes relevant to week ${week}.
Max 450 words total.

Safety context for week ${week}:
${restrictions.map(r => '• ' + r).join('\n')}`;

    try {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-5', max_tokens: 900,
        messages: [{ role: 'user', content: prompt }]
      });
      return res.json({ text: msg.content[0].text });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── WORKOUT ───────────────────────────────────────────────────────────────
  const adaptationNotes = [];
  if (checkin.energy === 'exhausted') adaptationNotes.push('Energy is exhausted — reduce all sets by 1, shorten duration by 15 min, prioritize gentle movement');
  if (checkin.energy === 'low') adaptationNotes.push('Energy is low — keep intensity moderate, avoid pushing to fatigue');
  if (checkin.nausea === 'strong') adaptationNotes.push('Strong nausea — avoid any inversion, stay low to ground, no high-intensity bursts, pivot to yoga or walk if needed');
  if (checkin.nausea === 'moderate') adaptationNotes.push('Moderate nausea — keep movement gentle and rhythmic, avoid anything jarring');
  if (checkin.pelvic === 'strong' || checkin.pelvic === 'moderate') adaptationNotes.push('Pelvic pressure present — NO impact, NO heavy lower body loading, NO extended standing, prioritize seated or side-lying work');
  if (checkin.sleep === 'poor') adaptationNotes.push('Poor sleep — be extra conservative with intensity, this is not a day to push');
  if (checkin.mood === 'low' || checkin.mood === 'anxious') adaptationNotes.push('Mood is low/anxious — include extra encouragement, suggest breathwork, keep workout achievable to build confidence');

  const prompt = `You are an expert prenatal fitness coach. Create a complete, safe, high-quality workout for a woman in week ${week} of pregnancy (${trimester}).

WEEKLY GOALS: 2 strength sessions, 2 cardio/swim sessions, 1 yoga session.
${historyStr}
Weekly progress: Strength ${weekCounts.strength}/2, Cardio/Swim ${weekCounts.cardio}/2, Yoga ${weekCounts.yoga}/1.

TODAY: ${dayLabel} session (${dayOfWeek})
CHECK-IN:
  ${checkinStr}

${adaptationNotes.length > 0 ? 'ADAPTATIONS REQUIRED:\n' + adaptationNotes.map(n => '⚠️ ' + n).join('\n') + '\n' : ''}

SAFETY RESTRICTIONS for week ${week} (non-negotiable):
${restrictions.map(r => '• ' + r).join('\n')}

━━━ FORMAT RULES — follow exactly or the app breaks ━━━

YOUR FIRST LINE must be:
Workout Title | Duration | Intensity
Example: "Full Body Strength | 50 min | Moderate"

Then these sections IN ORDER using EXACT header format:
--- Warm-Up (X min) ---
--- Main Block (X min) ---
--- Cool-Down (X min) ---
--- Safety Notes ---

WARM-UP & COOL-DOWN: bullet points using • symbol. 4-6 items each.

MAIN BLOCK exercises — use this EXACT pattern for every exercise:
**Exercise Name**
3 sets × 10 reps, rest 60 sec
Coaching note: brief cue on form or encouragement (1 sentence)
ALT: [simpler alternative requiring no equipment or less range of motion]

SAFETY NOTES: exactly 2 numbered notes. Specific to week ${week} and today's check-in.

━━━ CONTENT GUIDELINES ━━━

STRENGTH workouts:
- 5-7 exercises in main block
- Functional movements: goblet squats, Romanian deadlifts, single-leg deadlifts, dumbbell rows, hip thrusts, farmer carries, incline push-ups, resistance band work
- Safe core only: dead bugs, bird dogs, pallof press, side planks (modify if needed). NO crunches, NO sit-ups, NO traditional planks after week 16
- ALT examples: "goblet squat → wall sit", "push-up → incline push-up on counter", "single-leg deadlift → Romanian deadlift with support"

CARDIO/SWIM workouts:
- Swim: give specific lap sets, strokes, rest intervals, total 30-40 min. Include ALTs for non-swimmers (pool walking, kickboard)
- Walk/Run: distance, pace guidance, route tips. Include interval option if energy is good
- Format as bullet points in main block, not bold exercise names

YOGA workouts:
- 6-8 poses with specific hold times
- Hip openers, pelvic floor awareness, breath work, balance
- No deep twists compressing belly, no long supine after week 16
- Format as bullet points with hold times, not bold exercise names

Be warm, specific, and encouraging throughout. Max 700 words.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5', max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });
    res.json({ text: message.content[0].text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🌿 Mama Strong running at http://localhost:${PORT}\n`));
