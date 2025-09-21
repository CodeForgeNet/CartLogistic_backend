// routes/routes.js
const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const auth = require("../middleware/auth");
const Joi = require("joi");

// Validation schema
const createRouteSchema = Joi.object({
  routeId: Joi.string().required(),
  distanceKm: Joi.number().positive().required(),
  trafficLevel: Joi.string().valid("Low", "Medium", "High").required(),
  baseTimeMinutes: Joi.number().positive().required(),
});

const updateRouteSchema = Joi.object({
  routeId: Joi.string().optional(), // routeId is optional for updates
  distanceKm: Joi.number().positive().optional(),
  trafficLevel: Joi.string().valid("Low", "Medium", "High").optional(),
  baseTimeMinutes: Joi.number().positive().optional(),
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
    const { error, value } = createRouteSchema.validate(req.body);
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
    const { error, value } = updateRouteSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    // Filter out undefined values from 'value' to prevent Mongoose from trying to set required fields to undefined
    const updateFields = {};
    for (const key in value) {
      if (value[key] !== undefined) {
        updateFields[key] = value[key];
      }
    }

    // Check for duplicate routeId if changed
    if (updateFields.routeId) {
      const route = await Route.findById(req.params.id);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      if (route.routeId !== updateFields.routeId) {
        const existingRoute = await Route.findOne({ routeId: updateFields.routeId });
        if (existingRoute) {
          return res
            .status(400)
            .json({ error: "Route with this ID already exists" });
        }
      }
    }

    const route = await Route.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true, // Ensure Mongoose schema validators run on updated fields
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
