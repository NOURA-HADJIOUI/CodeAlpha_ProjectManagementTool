import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: "#26658C" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    columns: {
      type: [columnSchema],
      default: () => [
        { key: "todo", title: "À faire" },
        { key: "inprogress", title: "En cours" },
        { key: "done", title: "Terminé" },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);