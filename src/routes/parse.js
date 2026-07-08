import { Router } from "express";
import { extractTodos } from "../llm.js";

const router = Router();

// 자유 텍스트를 할 일 후보로 파싱 (생성하지 않음)
router.post("/", async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "text는 필수입니다" });
    }
    const todos = await extractTodos(text);
    res.json({ todos });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
});

export default router;
