const OrderService = require('../services/order.service');

class OrderController {
  static async getOrders(req, res, next) {
    try {
      const { status, route, search } = req.query;
      const userId = req.user?.id;
      const orders = await OrderService.getAllOrders({ status, route, search, userId });
      res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const userId = req.user?.id;
      const order = await OrderService.getOrderById(req.params.id, userId);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const userId = req.user?.id;
      const result = await OrderService.createOrder({ ...req.body, userId });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrderController;
