const {
  trafficTimeMultiplier,
  calculateSimulation,
} = require("../services/simulationService");

describe("Simulation Logic Tests", () => {
  test("Traffic time multipliers should be correct", () => {
    expect(trafficTimeMultiplier("Low")).toBe(0);
    expect(trafficTimeMultiplier("Medium")).toBe(0.1);
    expect(trafficTimeMultiplier("High")).toBe(0.25);
  });

  test("Late penalty should be applied when time > base+10", () => {
    const drivers = [{ _id: "driver1", name: "Driver 1", past7DayHours: [7] }];
    const routes = [
      {
        routeId: "R001",
        distanceKm: 10,
        trafficLevel: "Low",
        baseTimeMinutes: 30,
      },
    ];
    const orders = [{ orderId: "O001", valueRs: 800, assignedRouteId: "R001" }];

    const resultOnTime = calculateSimulation(drivers, routes, orders, {
      numberOfDrivers: 1,
    });
    expect(resultOnTime.perOrder[0].penalty).toBe(0);

    routes[0].baseTimeMinutes = 60;
    routes[0].trafficLevel = "High";
    const resultLate = calculateSimulation(drivers, routes, orders, {
      numberOfDrivers: 1,
    });
    expect(resultLate.perOrder[0].penalty).toBe(50);
  });

  test("High-value bonus should be applied when order > Rs 1000 and on time", () => {
    const drivers = [{ _id: "driver1", name: "Driver 1", past7DayHours: [7] }];
    const routes = [
      {
        routeId: "R001",
        distanceKm: 10,
        trafficLevel: "Low",
        baseTimeMinutes: 30,
      },
    ];

    const lowValueOrder = [
      { orderId: "O001", valueRs: 800, assignedRouteId: "R001" },
    ];
    const resultLowValue = calculateSimulation(drivers, routes, lowValueOrder, {
      numberOfDrivers: 1,
    });
    expect(resultLowValue.perOrder[0].bonus).toBe(0);

    const highValueOrder = [
      { orderId: "O002", valueRs: 1200, assignedRouteId: "R001" },
    ];
    const resultHighValue = calculateSimulation(
      drivers,
      routes,
      highValueOrder,
      { numberOfDrivers: 1 }
    );
    expect(resultHighValue.perOrder[0].bonus).toBe(0.1 * 1200);
  });

  test("Driver fatigue should increase delivery time by 30%", () => {
    const routes = [
      {
        routeId: "R001",
        distanceKm: 10,
        trafficLevel: "Low",
        baseTimeMinutes: 30,
      },
    ];
    const orders = [{ orderId: "O001", valueRs: 800, assignedRouteId: "R001" }];

    const normalDriver = [
      { _id: "driver1", name: "Normal Driver", past7DayHours: [7] },
    ];
    const resultNormal = calculateSimulation(normalDriver, routes, orders, {
      numberOfDrivers: 1,
    });

    const fatiguedDriver = [
      { _id: "driver2", name: "Fatigued Driver", past7DayHours: [9] },
    ];
    const resultFatigued = calculateSimulation(fatiguedDriver, routes, orders, {
      numberOfDrivers: 1,
    });

    expect(resultFatigued.perOrder[0].timeToDeliverMinutes).toBe(
      Math.round(resultNormal.perOrder[0].timeToDeliverMinutes * 1.3)
    );
  });

  test("Efficiency calculation should be correct", () => {
    const drivers = [{ _id: "driver1", name: "Driver 1", past7DayHours: [7] }];
    const routes = [
      {
        routeId: "R001",
        distanceKm: 10,
        trafficLevel: "Low",
        baseTimeMinutes: 30,
      },
      {
        routeId: "R002",
        distanceKm: 15,
        trafficLevel: "High",
        baseTimeMinutes: 20,
      },
    ];
    const orders = [
      { orderId: "O001", valueRs: 800, assignedRouteId: "R001" },
      { orderId: "O002", valueRs: 900, assignedRouteId: "R002" },
    ];

    const result = calculateSimulation(drivers, routes, orders, {
      numberOfDrivers: 1,
    });

    const onTimeCount = result.perOrder.filter((o) => o.onTime).length;
    const expectedEfficiency = (onTimeCount / result.perOrder.length) * 100;

    expect(result.kpis.efficiency).toBeCloseTo(expectedEfficiency, 2);
  });

  test("High traffic routes have a fuel surcharge", () => {
    const drivers = [{ _id: "driver1", name: "Driver 1", past7DayHours: [7] }];
    const orders = [
      { orderId: "O001", valueRs: 800, assignedRouteId: "R001" },
      { orderId: "O002", valueRs: 800, assignedRouteId: "R002" },
    ];

    const routes = [
      {
        routeId: "R001",
        distanceKm: 10,
        trafficLevel: "Low",
        baseTimeMinutes: 30,
      },
      {
        routeId: "R002",
        distanceKm: 10,
        trafficLevel: "High",
        baseTimeMinutes: 30,
      },
    ];

    const result = calculateSimulation(drivers, routes, orders, {
      numberOfDrivers: 1,
    });

    const lowTrafficFuelCost = result.perOrder.find(
      (o) => o.routeId === "R001"
    ).fuelCost;
    const highTrafficFuelCost = result.perOrder.find(
      (o) => o.routeId === "R002"
    ).fuelCost;

    expect(highTrafficFuelCost).toBe(
      lowTrafficFuelCost + routes[0].distanceKm * 2
    );
  });

  test("Orders are assigned to balance driver workload", () => {
    const drivers = [
      { _id: "driver1", name: "Driver 1", past7DayHours: [7] },
      { _id: "driver2", name: "Driver 2", past7DayHours: [7] },
    ];

    const routes = [
      {
        routeId: "R001",
        distanceKm: 10,
        trafficLevel: "Low",
        baseTimeMinutes: 30,
      },
      {
        routeId: "R002",
        distanceKm: 15,
        trafficLevel: "Low",
        baseTimeMinutes: 45,
      },
      {
        routeId: "R003",
        distanceKm: 20,
        trafficLevel: "Low",
        baseTimeMinutes: 60,
      },
    ];

    const orders = [
      { orderId: "O001", valueRs: 1000, assignedRouteId: "R001" },
      { orderId: "O002", valueRs: 1000, assignedRouteId: "R002" },
      { orderId: "O003", valueRs: 1000, assignedRouteId: "R003" },
    ];

    const result = calculateSimulation(drivers, routes, orders, {
      numberOfDrivers: 2,
    });

    const driverAssignments = {};
    result.perOrder.forEach((order) => {
      driverAssignments[order.assignedDriver] =
        (driverAssignments[order.assignedDriver] || 0) + 1;
    });

    expect(Object.keys(driverAssignments).length).toBe(2);
  });
});
