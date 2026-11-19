import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, default: "todo" },
    priority: { type: String, enum: ["none", "low", "medium", "high"], default: "none" },
    dueDate: { type: Date, default: null },
    position: { type: Number, default: 0 },
    labels: [{ text: String, color: String }],
    checklist: [{ text: { type: String, required: true }, done: { type: Boolean, default: false } }],
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);