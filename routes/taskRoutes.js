const express = require("express");
const Task = require("../models/Task");
const { encrypt, decrypt } = require("../utils/crypto");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Get tasks for logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    const decryptedTasks = tasks.map((task) => ({
      _id: task._id,
      title: decrypt(task.title),
      completed: task.completed,
    }));
    res.json(decryptedTasks);
  } catch {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Create new task
router.post("/", verifyToken, async (req, res) => {
  try {
    const task = await Task.create({
      title: encrypt(req.body.title),
      completed: req.body.completed ?? false,
      userId: req.userId,
    });
    res.json({
      _id: task._id,
      title: req.body.title,
      completed: task.completed,
    });
  } catch {
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const update = {};
    if (req.body.title !== undefined) update.title = encrypt(req.body.title);
    if (req.body.completed !== undefined) update.completed = req.body.completed;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({
      _id: task._id,
      title: decrypt(task.title),
      completed: task.completed,
    });
  } catch {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete task
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.sendStatus(204);
  } catch {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;
