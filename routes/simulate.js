const express = require("express");
const router = express();
const SimulationResult = require("../models/SimulationResult");
const auth = require("../middleware/auth");
const simulationController = require("../controllers/simulationController");

router.post("/", auth, simulationController.runSimulation);

router.get("/", auth, async (req, res) => {
  try {
    const simulations = await SimulationResult.find().sort({ createdAt: -1 });
    res.json(simulations);
  } catch (err) {
    console.error("Get simulations error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/latest", auth, async (req, res) => {
  try {
    const latestSimulation = await SimulationResult.findOne().sort({
      createdAt: -1,
    });
    if (!latestSimulation) {
      return res.status(404).json({ error: "No simulations found" });
    }
    res.json(latestSimulation);
  } catch (err) {
    console.error("Get latest simulation error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const simulation = await SimulationResult.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ error: "Simulation not found" });
    }
    res.json(simulation);
  } catch (err) {
    console.error("Get simulation by ID error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
