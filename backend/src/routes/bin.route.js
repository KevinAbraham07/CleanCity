import express from "express";
import Bin from "../models/bin.model.js";

const router = express.Router();

/**
 * POST /bins
 * TEMPORARY — used only for seeding bin data via Postman
 */
router.post("/", async (req, res) => {
  try {
    const { bin_id, location, area } = req.body;

    // Validate input
    if (!bin_id || !location || location.lat == null || location.lng == null) {
      return res.status(400).json({
        message: "bin_id and location {lat, lng} are required",
      });
    }

    // Prevent duplicates
    const existingBin = await Bin.findOne({ bin_id });
    if (existingBin) {
      return res.status(409).json({
        message: `Bin with bin_id ${bin_id} already exists`,
      });
    }

    const newBin = await Bin.create({
      bin_id,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      area,
    });

    res.status(201).json({
      message: "Bin created successfully (seeded)",
      bin: newBin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create bin",
      error,
    });
  }
});

/**
 * GET /bins
 * Fetch all bins
 */
router.get("/", async (req, res) => {
  try {
    const bins = await Bin.find().sort({ bin_id: 1 });
    res.status(200).json(bins);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bins",
      error,
    });
  }
});

/**
 * GET /bins/urgent
 * Fetch bins that require immediate attention
 */
router.get("/urgent", async (req, res) => {
  try {
    const urgentBins = await Bin.find({
      status: { $in: ["TOXIC", "FULL"] },
    }).sort({
      status: -1, // TOXIC first
      gas_ppm: -1, // higher gas first
      fill_level: -1, // fuller bins next
    });

    res.status(200).json(urgentBins);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch urgent bins",
      error,
    });
  }
});

export default router;
