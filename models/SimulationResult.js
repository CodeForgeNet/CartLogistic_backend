const mongoose = require("mongoose");

const SimulationSchema = new mongoose.Schema({
  inputs: { type: Object, required: true },
  kpis: { type: Object, required: true },
  perOrder: { type: [Object], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SimulationResult", SimulationSchema);
