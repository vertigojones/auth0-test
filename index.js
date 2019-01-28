// import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// ... other require statements ...
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

// define the Express app
const app = express();

// connect to mongoose
const connection = mongoose.connection;
connection.on("connected", () => {
  console.log("Mongoose connected successfully!");
});
connection.on("error", err => {
  console.log("Mongoose default connection error: " + err);
});

// enhance your app security with Helmet
app.use(helmet());

// use middleware
app.use(express.static(`${__dirname}/../frontend/build`));
app.use(bodyParser.json());

// enable all CORS requests
app.use(cors());

// log HTTP requests
app.use(morgan("combined"));

// retrieve all questions
app.get("/", (req, res) => {
  const qs = questions.map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    answers: q.answers.length
  }));
  res.send(qs);
});

// get a specific question
app.get("/:id", (req, res) => {
  const question = questions.filter(q => q.id === parseInt(req.params.id));
  if (question.length > 1) return res.status(500).send();
  if (question.length === 0) return res.status(404).send();
  res.send(question[0]);
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://owen-test.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: "IGfp0WYj0qE1HKsez7NzFzMQYY147dya",
  issuer: `https://owen-test.auth0.com/`,
  algorithms: ["RS256"]
});

// insert a new question
app.post("/", checkJwt, (req, res) => {
  const { title, description } = req.body;
  const newQuestion = {
    id: questions.length + 1,
    title,
    description,
    answers: [],
    author: req.user.name
  };
  questions.push(newQuestion);
  res.status(200).send();
});

// insert a new answer to a question
app.post("/answer/:id", checkJwt, (req, res) => {
  const { answer } = req.body;

  const question = questions.filter(q => q.id === parseInt(req.params.id));
  if (question.length > 1) return res.status(500).send();
  if (question.length === 0) return res.status(404).send();

  question[0].answers.push({
    answer,
    author: req.user.name
  });

  res.status(200).send();
});

// start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Magic be happening on port " + PORT);
});
