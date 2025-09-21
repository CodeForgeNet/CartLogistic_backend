// /Users/karansingh/Desktop/GreenCart Logistics/backend/controllers/routeController.js
const Route = require("../models/Route");
const Joi = require("joi");

// Validation schema
const routeSchema = Joi.object({
  routeId: Joi.string().required(),
  distanceKm: Joi.number().positive().required(),
  trafficLevel: Joi.string().valid("Low", "Medium", "High").required(),
  baseTimeMinutes: Joi.number().positive().required(),
});

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error("Get routes error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get route by ID
// @route   GET /api/routes/:id
// @access  Private
exports.getRouteById = async (req, res) => {
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
};

// @desc    Create a route
// @route   POST /api/routes
// @access  Private
exports.createRoute = async (req, res) => {
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
};

// @desc    Update a route
// @route   PUT /api/routes/:id
// @access  Private
exports.updateRoute = async (req, res) => {
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
};

// @desc    Delete a route
// @route   DELETE /api/routes/:id
// @access  Private
exports.deleteRoute = async (req, res) => {
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
};
