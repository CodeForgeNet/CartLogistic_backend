const Order = require("../models/Order");
const Route = require("../models/Route");
const Joi = require("joi");

const orderSchema = Joi.object({
  orderId: Joi.string().required(),
  valueRs: Joi.number().positive().required(),
  assignedRouteId: Joi.string().required(),
  deliveryTimestamp: Joi.date().allow(null),
  status: Joi.string().valid("Pending", "Delivered"),
});

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
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
};

exports.createOrder = async (req, res) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
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
};

exports.updateOrder = async (req, res) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    if (value.assignedRouteId) {
      const route = await Route.findOne({ routeId: value.assignedRouteId });
      if (!route) {
        return res.status(400).json({ error: "Assigned route does not exist" });
      }
    }

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
};

exports.deleteOrder = async (req, res) => {
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
};
