// /Users/karansingh/Desktop/GreenCart Logistics/backend/controllers/simulationController.js
const Driver = require("../models/Driver");
const Route = require("../models/Route");
const Order = require("../models/Order");
const SimulationResult = require("../models/SimulationResult");

// Helper function for traffic time multiplier
function trafficTimeMultiplier(level) {
  if (level === "High") return 0.25; // +25% time
  if (level === "Medium") return 0.1; // +10% time
  return 0; // Low
}

// @desc    Run simulation
// @route   POST /api/simulate
// @access  Private
exports.runSimulation = async (req, res) => {
  try {
    const { numberOfDrivers, routeStartTime, maxHoursPerDriver } = req.body;

    // Validate required parameters
    if (!numberOfDrivers || !routeStartTime || !maxHoursPerDriver) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    if (numberOfDrivers <= 0 || maxHoursPerDriver <= 0) {
      return res.status(400).json({ error: "Invalid params" });
    }

    // Fetch drivers and data
    const driversAll = await Driver.find({ isActive: true }).limit(
      numberOfDrivers
    );
    if (driversAll.length === 0) {
      return res.status(400).json({ error: "No drivers available" });
    }

    const routes = await Route.find({});
    const routesMap = {};
    routes.forEach((r) => (routesMap[r.routeId] = r));

    const orders = await Order.find({}); // use all orders in dataset
    // Simple ordering strategy: highest value first (prioritize high value)
    orders.sort((a, b) => b.valueRs - a.valueRs);

    // Init drivers states
    const drivers = driversAll.map((d) => ({
      _id: d._id.toString(),
      name: d.name,
      assignedMinutes: 0,
      assignedOrders: [],
      wasFatiguedYesterday: d.wasFatiguedYesterday
        ? d.wasFatiguedYesterday()
        : d.past7DayHours &&
          d.past7DayHours.length > 0 &&
          d.past7DayHours[d.past7DayHours.length - 1] > 8,
    }));

    const perOrder = [];
    let totalProfit = 0;
    let onTimeCount = 0;
    let totalDeliveries = 0;
    const fuelCostBreakdown = { Low: 0, Medium: 0, High: 0 };

    // Helper to pick driver with lowest assignedMinutes
    function pickDriver() {
      drivers.sort((a, b) => a.assignedMinutes - b.assignedMinutes);
      return drivers[0];
    }

    for (const order of orders) {
      totalDeliveries++;
      const route = routesMap[order.assignedRouteId];
      if (!route) {
        perOrder.push({ orderId: order.orderId, error: "route missing" });
        continue;
      }

      // Compute time multiplier from traffic
      const trafficMult = trafficTimeMultiplier(route.trafficLevel);

      // Driver fatigue: if driver was fatigued yesterday, their speed decreases by 30% → time increases 30%
      const driver = pickDriver();
      const fatigueMultiplier = driver.wasFatiguedYesterday ? 1.3 : 1.0;

      const baseTime = Number(route.baseTimeMinutes);
      const timeToDeliver = baseTime * (1 + trafficMult) * fatigueMultiplier; // minutes

      // Late penalty rule: if timeToDeliver > baseTime + 10 mins => penalty Rs 50
      const penalty = timeToDeliver > baseTime + 10 ? 50 : 0;
      const onTime = penalty === 0;
      if (onTime) onTimeCount++;

      // High-value bonus
      const bonus = order.valueRs > 1000 && onTime ? 0.1 * order.valueRs : 0;

      // Fuel cost
      const baseFuelPerKm = 5;
      const trafficSurchargePerKm = route.trafficLevel === "High" ? 2 : 0;
      const fuelCost =
        route.distanceKm * (baseFuelPerKm + trafficSurchargePerKm);
      fuelCostBreakdown[route.trafficLevel] += fuelCost;

      const orderProfit = order.valueRs + bonus - penalty - fuelCost;
      totalProfit += orderProfit;

      // Assign minutes to driver (round up)
      driver.assignedMinutes += Math.ceil(timeToDeliver);
      driver.assignedOrders.push(order.orderId);

      perOrder.push({
        orderId: order.orderId,
        routeId: route.routeId,
        valueRs: order.valueRs,
        timeToDeliverMinutes: Math.round(timeToDeliver),
        onTime,
        penalty,
        bonus,
        fuelCost,
        profit: orderProfit,
        assignedDriver: driver.name,
      });
    }

    const efficiencyScore =
      totalDeliveries === 0 ? 0 : (onTimeCount / totalDeliveries) * 100;

    const result = {
      inputs: { numberOfDrivers, routeStartTime, maxHoursPerDriver },
      kpis: {
        totalProfit: Math.round(totalProfit),
        efficiency: Number(efficiencyScore.toFixed(2)),
        onTimeDeliveries: onTimeCount,
        totalDeliveries,
        fuelCostBreakdown,
      },
      perOrder,
    };

    // Persist simulation result
    await SimulationResult.create(result);

    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get latest simulation
// @route   GET /api/simulate/latest
// @access  Private
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

// @desc    Get all simulations
// @route   GET /api/simulate
// @access  Private
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
