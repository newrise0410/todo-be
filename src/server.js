import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import todosRouter from "./routes/todos.js";

const app = express();

app.use(cors());
app.use(express.json());

// 헬스 체크
app.get("/", (req, res) => {
  res.json({ ok: true, service: "todo-BE" });
});

app.use("/api/todos", todosRouter);

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "서버 오류", error: err.message });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/todo";

connectDB(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("서버 시작 실패:", err.message);
    process.exit(1);
  });
