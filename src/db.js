import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB 연결됨");
  });
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB 오류:", err.message);
  });

  await mongoose.connect(uri);
}
