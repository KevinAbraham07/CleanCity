import express from "express";
import Bin from "../models/bin.model.js";
import { computeRouteConsole } from "../services/routing.service.js";

const router = express.Router();

/**
 * GET /route
 * Returns optimized route for map rendering
 */
router.get("/", async (req, res) => {
  try {
    const depot = {
      lat: 12.9716,
      lng: 77.5946,
      name: "DEPOT",
    };

    // Fetch bins from DB
    const urgentBins = await Bin.find({
      status: { $in: ["TOXIC", "FULL"] },
    });

    const normalBins = await Bin.find({
      status: "NORMAL",
    });

    // Compute route
    const result = computeRouteConsole(depot, urgentBins, normalBins);

    // Send ONLY what frontend needs
    res.json({
      route: result.routePoints,
      visitOrder: result.visitOrder,
      totalDistance: result.totalDistance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to compute route",
    });
  }
});

export default router;
