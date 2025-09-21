// services/simulationService.js
// Core simulation logic separated for testability
function trafficTimeMultiplier(level) {
  if (level === "High") return 0.25; // +25% time
  if (level === "Medium") return 0.1; // +10% time
  return 0; // Low
}

function calculateSimulation(drivers, routes, orders, params) {
  // Simple ordering strategy: highest value first (prioritize high value)
  const sortedOrders = [...orders].sort((a, b) => b.valueRs - a.valueRs);

  // Convert routes array to map for quick lookup
  const routesMap = {};
  routes.forEach((r) => (routesMap[r.routeId] = r));

  // init drivers states
  const simulationDrivers = drivers
    .slice(0, params.numberOfDrivers)
    .map((d) => ({
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

  // helper to pick driver with lowest assignedMinutes
  function pickDriver() {
    simulationDrivers.sort((a, b) => a.assignedMinutes - b.assignedMinutes);
    return simulationDrivers[0];
  }

  for (const order of sortedOrders) {
    totalDeliveries++;
    const route = routesMap[order.assignedRouteId];
    if (!route) {
      perOrder.push({ orderId: order.orderId, error: "route missing" });
      continue;
    }

    // compute time multiplier from traffic
    const trafficMult = trafficTimeMultiplier(route.trafficLevel);

    // driver fatigue: if driver was fatigued yesterday, their speed decreases by 30% → time increases 30%
    const driver = pickDriver();
    const fatigueMultiplier = driver.wasFatiguedYesterday ? 1.3 : 1.0;

    const baseTime = Number(route.baseTimeMinutes);
    const timeToDeliver = baseTime * (1 + trafficMult) * fatigueMultiplier; // minutes

    // Late penalty
    const penalty = timeToDeliver > baseTime + 10 ? 50 : 0;
    const onTime = penalty === 0;
    if (onTime) onTimeCount++;

    // high-value bonus
    const bonus = order.valueRs > 1000 && onTime ? 0.1 * order.valueRs : 0;

    // fuel cost
    const baseFuelPerKm = 5;
    const trafficSurchargePerKm = route.trafficLevel === "High" ? 2 : 0;
    const fuelCost = route.distanceKm * (baseFuelPerKm + trafficSurchargePerKm);
    fuelCostBreakdown[route.trafficLevel] += fuelCost;

    const orderProfit = order.valueRs + bonus - penalty - fuelCost;
    totalProfit += orderProfit;

    // assign minutes to driver (round up)
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

  return {
    inputs: params,
    kpis: {
      totalProfit: Math.round(totalProfit),
      efficiency: Number(efficiencyScore.toFixed(2)),
      onTimeDeliveries: onTimeCount,
      totalDeliveries,
      fuelCostBreakdown,
    },
    perOrder,
  };
}

module.exports = {
  trafficTimeMultiplier,
  calculateSimulation,
};
