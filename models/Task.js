const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: String,
  completed: Boolean,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 👈 user association
});

module.exports = mongoose.model("Task", TaskSchema);
