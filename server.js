const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tutorials.json');

app.use(express.json());

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'capcut-guide' });
});

app.get('/api/tutorials', (req, res) => {
  const data = readData();
  res.json(data.tutorials);
});

app.get('/api/tutorials/:slug', (req, res) => {
  const data = readData();
  const tutorial = data.tutorials.find((item) => item.slug === req.params.slug);

  if (!tutorial) {
    return res.status(404).json({ error: 'Tutorial not found' });
  }

  res.json(tutorial);
});

app.get('/api/resources', (req, res) => {
  const data = readData();
  res.json(data.resources);
});

app.post('/api/tutorials', (req, res) => {
  const { title, category, duration, summary, content } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const data = readData();
  const newTutorial = {
    id: Date.now(),
    slug: slugify(title),
    title: title.trim(),
    category: category || 'General',
    duration: duration || '5 min',
    summary: summary || content.slice(0, 120),
    content: content.trim()
  };

  data.tutorials.unshift(newTutorial);
  writeData(data);

  res.status(201).json(newTutorial);
});

app.put('/api/tutorials/:slug', (req, res) => {
  const { title, category, duration, summary, content } = req.body || {};
  const data = readData();
  const index = data.tutorials.findIndex((item) => item.slug === req.params.slug);

  if (index === -1) {
    return res.status(404).json({ error: 'Tutorial not found' });
  }

  data.tutorials[index] = {
    ...data.tutorials[index],
    title: title ? title.trim() : data.tutorials[index].title,
    category: category || data.tutorials[index].category,
    duration: duration || data.tutorials[index].duration,
    summary: summary || data.tutorials[index].summary,
    content: content ? content.trim() : data.tutorials[index].content,
    slug: title ? slugify(title) : data.tutorials[index].slug
  };

  writeData(data);
  res.json(data.tutorials[index]);
});

app.delete('/api/tutorials/:slug', (req, res) => {
  const data = readData();
  const originalLength = data.tutorials.length;
  data.tutorials = data.tutorials.filter((item) => item.slug !== req.params.slug);

  if (data.tutorials.length === originalLength) {
    return res.status(404).json({ error: 'Tutorial not found' });
  }

  writeData(data);
  res.json({ success: true, deletedSlug: req.params.slug });
});

app.use(express.static(__dirname));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CapCut Guide backend running at http://localhost:${PORT}`);
});
