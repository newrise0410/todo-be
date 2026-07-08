import { Router } from "express";
import { Todo } from "../models/todo.js";

const router = Router();

// 목록 조회 (수동 정렬 순서 → 생성 최신순)
router.get("/", async (req, res, next) => {
  try {
    const todos = await Todo.find().sort({ order: 1, createdAt: -1 });
    res.json(todos);
  } catch (err) {
    next(err);
  }
});

// 생성
router.post("/", async (req, res, next) => {
  try {
    const { title, completed, priority, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "title은 필수입니다" });
    }
    // 새 항목은 목록 맨 뒤로 (현재 최대 order + 1)
    const last = await Todo.findOne().sort({ order: -1 }).select("order");
    const order = last ? last.order + 1 : 0;

    const todo = await Todo.create({ title, completed, priority, dueDate, order });
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

// 순서 일괄 변경 (PATCH /api/todos/reorder, body: { ids: [...] })
// 주의: "/:id" 보다 먼저 등록해야 "reorder"가 id로 매칭되지 않는다.
router.patch("/reorder", async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "ids 배열이 필요합니다" });
    }
    await Promise.all(
      ids.map((id, index) =>
        Todo.findByIdAndUpdate(id, { order: index }, { runValidators: true })
      )
    );
    const todos = await Todo.find().sort({ order: 1, createdAt: -1 });
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

// 수정 (내용/완료/우선순위/마감일)
router.patch("/:id", async (req, res, next) => {
  try {
    const { title, completed, priority, dueDate } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (completed !== undefined) update.completed = completed;
    if (priority !== undefined) update.priority = priority;
    if (dueDate !== undefined) update.dueDate = dueDate;

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
