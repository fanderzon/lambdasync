'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(awsServerlessExpressMiddleware.eventContext());

// Ephemeral in-memory data store
const users = [{id: 1, name: 'Joe'}, {id: 2, name: 'Jane'}];
let userIdCounter = users.length;

// User functions
const getUser = userId => users.find(u => u.id === parseInt(userId, 10));
const getUserIndex = userId => users.findIndex(u => u.id === parseInt(userId, 10));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.get('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({});
  }

  return res.json(user);
});

app.post('/users', (req, res) => {
  const user = {
    id: ++userIdCounter,
    name: req.body.name
  };
  users.push(user);
  res.status(201).json(user);
});

app.put('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({});
  }

  user.name = req.body.name;
  res.json(user);
});

app.delete('/users/:userId', (req, res) => {
  const userIndex = getUserIndex(req.params.userId);
  if (userIndex === -1) {
    return res.status(404).json({});
  }

  users.splice(userIndex, 1);
  res.json(users);
});

module.exports = app;
