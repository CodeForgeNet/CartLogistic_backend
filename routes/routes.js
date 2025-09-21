const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const auth = require("../middleware/auth");
const Joi = require("joi");

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

router.get("/", auth, async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error("Get routes error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

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

router.post("/", auth, async (req, res) => {
  try {
    const { error, value } = createRouteSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

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

router.put("/:id", auth, async (req, res) => {
  try {
    const { error, value } = updateRouteSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    const updateFields = {};
    for (const key in value) {
      if (value[key] !== undefined) {
        updateFields[key] = value[key];
      }
    }

    if (updateFields.routeId) {
      const route = await Route.findById(req.params.id);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      if (route.routeId !== updateFields.routeId) {
        const existingRoute = await Route.findOne({
          routeId: updateFields.routeId,
        });
        if (existingRoute) {
          return res
            .status(400)
            .json({ error: "Route with this ID already exists" });
        }
      }
    }

    const route = await Route.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
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
