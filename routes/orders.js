const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Route = require("../models/Route");
const auth = require("../middleware/auth");
const Joi = require("joi");

const createOrderSchema = Joi.object({
  orderId: Joi.string().required(),
  valueRs: Joi.number().positive().required(),
  assignedRouteId: Joi.string().required(),
  deliveryTimestamp: Joi.date().allow(null).optional(),
  status: Joi.string().valid("Pending", "Delivered").optional(),
});

const updateOrderSchema = Joi.object({
  orderId: Joi.string().optional(),
  valueRs: Joi.number().positive().optional(),
  assignedRouteId: Joi.string().optional(),
  deliveryTimestamp: Joi.date().allow(null).optional(),
  status: Joi.string().valid("Pending", "Delivered").optional(),
});

router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

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

router.post("/", auth, async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    const route = await Route.findOne({ routeId: value.assignedRouteId });
    if (!route) {
      return res.status(400).json({ error: "Assigned route does not exist" });
    }

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

router.put("/:id", auth, async (req, res) => {
  try {
    const { error, value } = updateOrderSchema.validate(req.body);
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

    if (updateFields.assignedRouteId) {
      const route = await Route.findOne({
        routeId: updateFields.assignedRouteId,
      });
      if (!route) {
        return res.status(400).json({ error: "Assigned route does not exist" });
      }
    }

    if (updateFields.orderId) {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.orderId !== updateFields.orderId) {
        const existingOrder = await Order.findOne({
          orderId: updateFields.orderId,
        });
        if (existingOrder) {
          return res
            .status(400)
            .json({ error: "Order with this ID already exists" });
        }
      }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
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
