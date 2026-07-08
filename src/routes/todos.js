import { Router } from "express";
import { Todo } from "../models/todo.js";

const router = Router();

// 목록 조회 (최신순)
router.get("/", async (req, res, next) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    next(err);
  }
});

// 단건 조회
router.get("/:id", async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "할 일을 찾을 수 없습니다" });
    res.json(todo);
  } catch (err) {
    next(err);
  }
});

// 생성
router.post("/", async (req, res, next) => {
  try {
    const { title, completed } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "title은 필수입니다" });
    }
    const todo = await Todo.create({ title, completed });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
});

// 완료 항목 일괄 삭제 (DELETE /api/todos?completed=true)
router.delete("/", async (req, res, next) => {
  try {
    if (req.query.completed !== "true") {
      return res
        .status(400)
        .json({ message: "completed=true 쿼리가 필요합니다" });
    }
    const result = await Todo.deleteMany({ completed: true });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
});

// 수정 (내용/완료 여부)
router.patch("/:id", async (req, res, next) => {
  try {
    const { title, completed } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (completed !== undefined) update.completed = completed;

    const todo = await Todo.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!todo) return res.status(404).json({ message: "할 일을 찾을 수 없습니다" });
    res.json(todo);
  } catch (err) {
    next(err);
  }
});

// 삭제
router.delete("/:id", async (req, res, next) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: "할 일을 찾을 수 없습니다" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
