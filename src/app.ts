import express from "express";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { createServer } from "node:http"; //createServer connects our express with the socket.io server i.e it forms a connection for us
import cors from "cors";
import dotenv from "dotenv";
import { connectToSocket } from "./controllers/socketManager.ts";
import userRoutes from "./routes/users.routes.ts";

dotenv.config();
const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/register", userRoutes);

app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

const start = async () => {
  const connectionDb = await mongoose.connect(
    process.env.MONGO_DB_URL as string
  );

  console.log(` MONGO Connected DB Host  ${connectionDb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log("listening on port 8000");
  });
};

start();
