const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  dueDate: Date,
  isCompleted: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    default: null,
  },
  lastTriggeredDate: Date,
});

module.exports = mongoose.model("Task", TaskSchema);
