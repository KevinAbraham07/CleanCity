import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import routeRoutes from "./src/routes/route.route.js";
import binRoutes from "./src/routes/bin.route.js";
import sensorRoutes from "./src/routes/sensor.route.js";
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/route", routeRoutes);
app.use("/bins", binRoutes);
app.use("/sensor-data", sensorRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Smart Waste Backend Running");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
