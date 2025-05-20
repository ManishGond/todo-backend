const express = require("express");
const Task = require("../models/Task");
const { encrypt, decrypt } = require("../utils/crypto");
const verifyToken = require("../middleware/verifyToken");
const moment = require("moment");

const router = express.Router();

// Get all tasks for logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    const decryptedTasks = tasks.map((task) => ({
      _id: task._id,
      title: decrypt(task.title),
      isCompleted: task.isCompleted,
      dueDate: task.dueDate,
      lastTriggeredDate: task.lastTriggeredDate,
    }));
    res.json(decryptedTasks);
  } catch {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get today's tasks
router.get("/today", verifyToken, async (req, res) => {
  try {
    const startOfDay = moment().startOf("day").toDate();
    const endOfDay = moment().endOf("day").toDate();

    const tasks = await Task.find({
      userId: req.userId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const decryptedTasks = tasks.map((task) => ({
      _id: task._id,
      title: decrypt(task.title),
      isCompleted: task.isCompleted,
      dueDate: task.dueDate,
    }));

    res.json(decryptedTasks);
  } catch {
    res.status(500).json({ error: "Failed to fetch today’s tasks" });
  }
});

// Create new task
router.post("/", verifyToken, async (req, res) => {
  try {
    const task = await Task.create({
      title: encrypt(req.body.title),
      isCompleted: req.body.isCompleted ?? false,
      userId: req.userId,
      dueDate: req.body.dueDate,
      lastTriggeredDate: req.body.lastTriggeredDate ?? null,
    });

    res.json({
      _id: task._id,
      title: req.body.title,
      isCompleted: task.isCompleted,
      dueDate: task.dueDate,
      lastTriggeredDate: task.lastTriggeredDate,
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
    if (req.body.isCompleted !== undefined)
      update.isCompleted = req.body.isCompleted;
    if (req.body.dueDate !== undefined) update.dueDate = req.body.dueDate;
    if (req.body.lastTriggeredDate !== undefined)
      update.lastTriggeredDate = req.body.lastTriggeredDate;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );

    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({
      _id: task._id,
      title: decrypt(task.title),
      isCompleted: task.isCompleted,
      dueDate: task.dueDate,
      lastTriggeredDate: task.lastTriggeredDate,
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
