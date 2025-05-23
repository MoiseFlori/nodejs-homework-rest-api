const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const contactsRouter = require("./routes/api/contacts");

const app = express();
const connectDB = require("./db");

const formatsLogger = app.get("env") === "development" ? "dev" : "short";
const userRouter = require("./routes/api/users");

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());



app.use("/users", userRouter);
app.use("/api/contacts", contactsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
