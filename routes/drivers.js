// routes/drivers.js
const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const auth = require("../middleware/auth");
const Joi = require("joi");

// Validation schema
const driverSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().allow(""),
  currentShiftHours: Joi.number().min(0),
  past7DayHours: Joi.array().items(Joi.number().min(0)),
  isActive: Joi.boolean(),
});

// Get all drivers
router.get("/", auth, async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (err) {
    console.error("Get drivers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get driver by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(driver);
  } catch (err) {
    console.error("Get driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create driver
router.post("/", auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = driverSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    const driver = new Driver(value);
    await driver.save();
    res.status(201).json(driver);
  } catch (err) {
    console.error("Create driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update driver
router.put("/:id", auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = driverSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    const driver = await Driver.findByIdAndUpdate(req.params.id, value, {
      new: true,
    });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(driver);
  } catch (err) {
    console.error("Update driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete driver
router.delete("/:id", auth, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json({ message: "Driver deleted successfully" });
  } catch (err) {
    console.error("Delete driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

// routes/routes.js
const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const auth = require("../middleware/auth");
const Joi = require("joi");

// Validation schema
const routeSchema = Joi.object({
  routeId: Joi.string().required(),
  distanceKm: Joi.number().positive().required(),
  trafficLevel: Joi.string().valid("Low", "Medium", "High").required(),
  baseTimeMinutes: Joi.number().positive().required(),
});

// Get all routes
router.get("/", auth, async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error("Get routes error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get route by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json(route);
  } catch (err) {
    console.error("Get route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create route
router.post("/", auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = routeSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    // Check for duplicate routeId
    const existingRoute = await Route.findOne({ routeId: value.routeId });
    if (existingRoute) {
      return res
        .status(400)
        .json({ error: "Route with this ID already exists" });
    }

    const route = new Route(value);
    await route.save();
    res.status(201).json(route);
  } catch (err) {
    console.error("Create route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update route
router.put("/:id", auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = routeSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    // Check for duplicate routeId if changed
    if (value.routeId) {
      const route = await Route.findById(req.params.id);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      if (route.routeId !== value.routeId) {
        const existingRoute = await Route.findOne({ routeId: value.routeId });
        if (existingRoute) {
          return res
            .status(400)
            .json({ error: "Route with this ID already exists" });
        }
      }
    }

    const route = await Route.findByIdAndUpdate(req.params.id, value, {
      new: true,
    });
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json(route);
  } catch (err) {
    console.error("Update route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete route
router.delete("/:id", auth, async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    console.error("Delete route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

// routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Route = require("../models/Route");
const auth = require("../middleware/auth");
const Joi = require("joi");

// Validation schema
const orderSchema = Joi.object({
  orderId: Joi.string().required(),
  valueRs: Joi.number().positive().required(),
  assignedRouteId: Joi.string().required(),
  deliveryTimestamp: Joi.date().allow(null),
  status: Joi.string().valid("Pending", "Delivered"),
});

// Get all orders
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create order
router.post("/", auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    // Check if route exists
    const route = await Route.findOne({ routeId: value.assignedRouteId });
    if (!route) {
      return res.status(400).json({ error: "Assigned route does not exist" });
    }

    // Check for duplicate orderId
    const existingOrder = await Order.findOne({ orderId: value.orderId });
    if (existingOrder) {
      return res
        .status(400)
        .json({ error: "Order with this ID already exists" });
    }

    const order = new Order(value);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update order
router.put("/:id", auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    // Check if route exists
    if (value.assignedRouteId) {
      const route = await Route.findOne({ routeId: value.assignedRouteId });
      if (!route) {
        return res.status(400).json({ error: "Assigned route does not exist" });
      }
    }

    // Check for duplicate orderId if changed
    if (value.orderId) {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.orderId !== value.orderId) {
        const existingOrder = await Order.findOne({ orderId: value.orderId });
        if (existingOrder) {
          return res
            .status(400)
            .json({ error: "Order with this ID already exists" });
        }
      }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, value, {
      new: true,
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    console.error("Update order error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete order
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
