const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/generate-workout', async (req, res) => {
  const { week, trimester, dayLabel, dayOfWeek, checkin, restrictions, weekHistory } = req.body;

  // Build week context string
  const historyStr = weekHistory && weekHistory.length > 0
    ? `Completed this week so far: ${weekHistory.join(', ')}.`
    : 'No workouts completed yet this week.';

  const prompt = `You are an expert prenatal fitness coach. Create a safe, detailed, encouraging workout for a woman who is in week ${week} of pregnancy (${trimester}).

WEEKLY TEMPLATE GOAL: 2 full-body strength sessions (45-60 min, functional movements), 1 prenatal yoga session, 1-2 walk/ruck/tennis sessions, 1 swimming session (30-40 min).

${historyStr} Use this context to adapt today's recommendation — if she's already hit her strength quota, lean into her preference even more. If yoga or swim hasn't happened yet and it's later in the week, gently note it.

TODAY'S SCHEDULED TYPE: ${dayLabel} (${dayOfWeek})

TODAY'S CHECK-IN:
- Energy: ${checkin.energy || 'not specified'}
- Nausea: ${checkin.nausea || 'not specified'}
- Soreness: ${checkin.soreness || 'not specified'}
- Preference: ${checkin.preference || 'not specified'}
- Focus: ${checkin.focus || 'not specified'}

WEEK ${week} SAFETY RESTRICTIONS (follow strictly):
${restrictions.map(r => '• ' + r).join('\n')}

INSTRUCTIONS:
1. Adapt based on check-in. Strong nausea or drained energy = pivot to something gentler.
2. Write a COMPLETE workout: warm-up, main block, cool-down.
3. STRENGTH: goblet squats, Romanian deadlifts, single-leg work, rows, carries, push-ups. Safe core only (dead bugs, bird dogs, pelvic tilts). No supine if week >= 16.
4. YOGA: specific poses with hold times. Hip openers, pelvic floor, breath. No deep belly twists.
5. WALKS/RUCKS: distance, pace, ruck weight option, terrain tips.
6. SWIMMING: sets, strokes, rest intervals, 30-40 min total.
7. Use "--- Section Name (X min) ---" headers for each section.
8. For exercises use **Exercise Name** on its own line, then sets/reps on next line, then a short coaching note.
9. End with "--- Safety Notes ---" section with exactly 2 numbered notes specific to week ${week}.
10. Be warm, personal, and encouraging. Max 600 words.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });
    res.json({ text: message.content[0].text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌿 Mama Strong running at http://localhost:${PORT}\n`);
});
