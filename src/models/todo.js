import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    // createdAt, updatedAt 자동 기록
    timestamps: true,
  }
);

export const Todo = mongoose.model("Todo", todoSchema);
