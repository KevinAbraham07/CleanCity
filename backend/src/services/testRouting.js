import mongoose from "mongoose";
import Bin from "../models/bin.model.js";
import { computeRouteConsole } from "./routing.service.js";
import dotenv from "dotenv";
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const depot = {
  lat: 12.9716,
  lng: 77.5946,
  name: "DEPOT",
};

const urgentBins = await Bin.find({
  status: { $in: ["TOXIC", "FULL"] },
});

const normalBins = await Bin.find({
  status: "NORMAL",
});

computeRouteConsole(depot, urgentBins, normalBins);

mongoose.disconnect();
