const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const CryptoJS = require("crypto-js");

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

// Load secret key from .env
const SECRET_KEY = process.env.AES_SECRET_KEY;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Encrypt function
function encrypt(text) {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

// Decrypt function
function decrypt(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Mongoose model
const Task = mongoose.model(
  "Task",
  new mongoose.Schema({
    title: String, // Encrypted in DB
    completed: Boolean,
  })
);

// Routes
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    // Decrypt titles before sending
    const decryptedTasks = tasks.map((task) => ({
      _id: task._id,
      title: decrypt(task.title),
      completed: task.completed,
    }));
    res.json(decryptedTasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const task = new Task({
      title: encrypt(req.body.title),
      completed: req.body.completed ?? false,
    });
    await task.save();
    res.json({
      _id: task._id,
      title: req.body.title, // send decrypted title back to client
      completed: task.completed,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put("/tasks/:id", async (req, res) => {
  try {
    const update = {};
    if (req.body.title !== undefined) {
      update.title = encrypt(req.body.title);
    }
    if (req.body.completed !== undefined) {
      update.completed = req.body.completed;
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    res.json({
      _id: updatedTask._id,
      title: decrypt(updatedTask.title),
      completed: updatedTask.completed,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
