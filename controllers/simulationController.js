const Driver = require("../models/Driver");
const Route = require("../models/Route");
const Order = require("../models/Order");
const SimulationResult = require("../models/SimulationResult");
const simulationService = require("../services/simulationService");

exports.runSimulation = async (req, res) => {
  try {
    const { numberOfDrivers, routeStartTime, maxHoursPerDriver } = req.body;

    if (!numberOfDrivers || !routeStartTime || !maxHoursPerDriver) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    if (numberOfDrivers <= 0 || maxHoursPerDriver <= 0) {
      return res.status(400).json({ error: "Invalid params" });
    }

    const driversAll = await Driver.find({ isActive: true }).limit(
      numberOfDrivers
    );
    if (driversAll.length === 0) {
      return res.status(400).json({ error: "No drivers available" });
    }

    const routes = await Route.find({});
    const orders = await Order.find({});

    const simulationResult = simulationService.runSimulation(
      driversAll,
      routes,
      orders,
      { numberOfDrivers, routeStartTime, maxHoursPerDriver }
    );

    await SimulationResult.create(simulationResult);

    return res.json(simulationResult);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getLatestSimulation = async (req, res) => {
  try {
    const latest = await SimulationResult.findOne().sort({ createdAt: -1 });
    if (!latest) {
      return res.status(404).json({ error: "No simulations found" });
    }
    return res.json(latest);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getSimulations = async (req, res) => {
  try {
    const simulations = await SimulationResult.find()
      .sort({ createdAt: -1 })
      .limit(10);
    return res.json(simulations);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
};
