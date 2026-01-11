import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors({
    "origin": process.env.PORT || 5000,
    "credentials": true,
    "methods": ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "DCA Platform API running" });
});
app.use("/auth", authRoutes);

export default app