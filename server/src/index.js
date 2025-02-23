import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cors from "cors"
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin:process.env.CORS_ORIGIN
}))
const PORT = process.env.PORT;

connectDB();
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Welcom to TravelTribe",
  });
});
app.use("/api/user", userRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
