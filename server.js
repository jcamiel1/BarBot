const express = require('express');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'managed-agents-2026-04-01'
  }
});
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const AGENT_ID = process.env.AGENT_ID;
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;

app.post('/api/cocktail/session', async (req, res) => {
  try {
    const session = await anthropic.beta.sessions.create({
      agent: AGENT_ID,
      environment_id: ENVIRONMENT_ID,
      title: 'Cocktail Order',
    });
    res.json({ session_id: session.id });
  } catch (err) {
    console.error('SESSION ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cocktail/event', async (req, res) => {
  const { session_id, event } = req.body;
  try {
    await anthropic.beta.sessions.events.send(session_id, { events: [event] });
    res.json({ ok: true });
  } catch (err) {
    console.error('EVENT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cocktail/events', async (req, res) => {
  const { session_id, after_ts } = req.query;
  try {
    const result = await anthropic.beta.sessions.events.list(session_id, {
      limit: 100,
      order: 'asc',
      ...(after_ts ? { 'created_at[gt]': after_ts } : {})
    });
    const events = result.data || [];
    const lastTs = events.length > 0 ? events[events.length - 1].processed_at : (after_ts || null);
    res.json({ events: events, last_ts: lastTs });
  } catch (err) {
    console.error('POLL ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
