import express from "express";
import Bin from "../models/bin.model.js";

const router = express.Router();

// Thresholds
const GAS_THRESHOLD = 300; // ppm
const FULL_THRESHOLD = 80; // %

/**
 * POST /sensor-data
 * Receives sensor JSON from Arduino / Postman
 */
router.post("/", async (req, res) => {
  try {
    const { bin_id, fill_level, gas_ppm } = req.body;

    // Validate input
    if (!bin_id) {
      return res.status(400).json({
        message: "bin_id is required",
      });
    }

    if (fill_level == null && gas_ppm == null) {
      return res.status(400).json({
        message: "At least one of fill_level or gas_ppm must be provided",
      });
    }

    // Find the bin
    const bin = await Bin.findOne({ bin_id });
    if (!bin) {
      return res.status(404).json({
        message: `Bin with bin_id ${bin_id} not found`,
      });
    }

    // Update dynamic sensor fields
    if (fill_level != null) {
      bin.fill_level = fill_level;
    }

    if (gas_ppm != null) {
      bin.gas_ppm = gas_ppm;
    }

    // Derive status (gas has highest priority)
    if (bin.gas_ppm > GAS_THRESHOLD) {
      bin.status = "TOXIC";
    } else if (bin.fill_level >= FULL_THRESHOLD) {
      bin.status = "FULL";
    } else {
      bin.status = "NORMAL";
    }

    // Update timestamp
    bin.last_updated = new Date();

    // Save changes
    await bin.save();

    res.status(200).json({
      message: "Sensor data updated successfully",
      bin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update sensor data",
      error,
    });
  }
});

export default router;
