const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tutorials.json');
const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

app.use(express.json());

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function readAdminData() {
  if (!fs.existsSync(ADMIN_FILE)) {
    const defaultAdmin = {
      users: [
        {
          id: 1,
          username: 'admin',
          password: bcrypt.hashSync('admin123', 10)
        }
      ]
    };
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultAdmin, null, 2));
    return defaultAdmin;
  }
  const raw = fs.readFileSync(ADMIN_FILE, 'utf8');
  return JSON.parse(raw);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
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

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const admin = readAdminData();
  const user = admin.users.find((u) => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '24h'
  });

  res.json({ token, username: user.username });
});

app.get('/api/admin/tutorials', verifyToken, (req, res) => {
  const data = readData();
  res.json(data.tutorials);
});

app.post('/api/admin/tutorials', verifyToken, (req, res) => {
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
    videoUrl: videoUrl ? videoUrl.trim() : ''
  };

  data.tutorials.unshift(newTutorial);
  writeData(data);

  res.status(201).json(newTutorial);
});

app.put('/api/admin/tutorials/:slug', verifyToken, (req, res) => {
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
    videoUrl: videoUrl !== undefined ? videoUrl.trim() : data.tutorials[index].videoUrl,
    slug: title ? slugify(title) : data.tutorials[index].slug
  };

  writeData(data);
  res.json(data.tutorials[index]);
});

app.delete('/api/admin/tutorials/:slug', verifyToken, (req, res) => {
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
  console.log(`\nAdmin login available at /admin.html`);
  console.log(`Default credentials: admin / admin123`);
});
