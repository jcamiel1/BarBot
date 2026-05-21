const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const AGENT_ID       = process.env.AGENT_ID;
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;

// 1. Create a session
app.post('/api/cocktail/session', async (req, res) => {
  try {
    const session = await anthropic.beta.sessions.create({
      agent: AGENT_ID,
      environment_id: ENVIRONMENT_ID,
      title: 'Cocktail Order',
    });
    res.json({ session_id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Send an event to a session
app.post('/api/cocktail/event', async (req, res) => {
  const { session_id, event } = req.body;
  try {
    await anthropic.beta.sessions.events.send(session_id, { events: [event] });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Poll for events
app.get('/api/cocktail/events', async (req, res) => {
  const { session_id, page } = req.query;
  try {
    const result = await anthropic.beta.sessions.events.list(session_id, {
      page: parseInt(page) || 1,
    });
    res.json({ events: result.data, next_page: result.next_page || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));