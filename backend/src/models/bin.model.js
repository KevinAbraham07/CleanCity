import mongoose from "mongoose";

const binSchema = new mongoose.Schema(
  {
    bin_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },

    area: {
      type: String,
    },

    fill_level: {
      type: Number,
      default: 0,
    },

    gas_ppm: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["NORMAL", "FULL", "TOXIC"],
      default: "NORMAL",
    },

    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Bin = mongoose.model("Bin", binSchema);

export default Bin;
