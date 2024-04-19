const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



//-----------------
// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware to log request bodies
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  console.log('Request body:', JSON.stringify(req.body));
  next();
});

// Middleware to log responses
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    console.log('Response body:', data);
    originalSend.apply(res, arguments);
  };
  next();
});


// Data storage
let users = [];
let exercises = [];

// Routes
// 1. Create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const newUser = {
    username,
    _id: generateId(),
  };
  users.push(newUser);
  res.json(newUser);
});

// 2. Get a list of all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. Add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const exercise = {
    username: user.username,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString(),
    _id: generateId(),
  };
  exercises.push(exercise);
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    _id: user._id,
    date: exercise.date
  });
});

// 4. Retrieve a full exercise log of any user
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  let log = exercises.filter(exercise => exercise.username === user.username);
  const { from, to, limit } = req.query;
  if (from) {
    log = log.filter(exercise => new Date(exercise.date) >= new Date(from));
  }
  if (to) {
    log = log.filter(exercise => new Date(exercise.date) <= new Date(to));
  }
  if (limit) {
    log = log.slice(0, parseInt(limit));
  }
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log,
  });
});

// Helper function to generate unique ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
