// routes/simulate.js
const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const Route = require("../models/Route");
const Order = require("../models/Order");
const SimulationResult = require("../models/SimulationResult");
const auth = require("../middleware/auth");
const { calculateSimulation } = require("../services/simulationService");
const Joi = require("joi");

// Validation schema
const simulationSchema = Joi.object({
  numberOfDrivers: Joi.number().integer().min(1).required(),
  routeStartTime: Joi.string().required(),
  maxHoursPerDriver: Joi.number().min(1).required(),
});

router.post("/", auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = simulationSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    const { numberOfDrivers, routeStartTime, maxHoursPerDriver } = value;

    // Fetch data from DB
    const driversAll = await Driver.find({ isActive: true }).limit(
      numberOfDrivers
    );
    if (driversAll.length === 0) {
      return res.status(400).json({ error: "No drivers available" });
    }

    const routes = await Route.find({});
    const orders = await Order.find({}); // use all orders in dataset

    // Run simulation
    const result = calculateSimulation(driversAll, routes, orders, {
      numberOfDrivers,
      routeStartTime,
      maxHoursPerDriver,
    });

    // Save result to database
    await SimulationResult.create(result);

    return res.json(result);
  } catch (e) {
    console.error("Simulation error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get all simulation results
router.get("/", auth, async (req, res) => {
  try {
    const results = await SimulationResult.find().sort("-createdAt").limit(10);
    res.json(results);
  } catch (err) {
    console.error("Get simulations error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get latest simulation result
router.get("/latest", auth, async (req, res) => {
  try {
    const result = await SimulationResult.findOne().sort("-createdAt");
    if (!result) {
      return res.status(404).json({ error: "No simulations found" });
    }
    res.json(result);
  } catch (err) {
    console.error("Get latest simulation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
