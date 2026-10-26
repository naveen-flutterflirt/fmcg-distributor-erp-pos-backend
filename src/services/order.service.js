const OrderModel = require('../models/order.model');
const OutletModel = require('../models/outlet.model');

class OrderService {
  static async getAllOrders(filters) {
    return await OrderModel.findAll(filters);
  }

  static async getOrderById(id, userId) {
    const order = await OrderModel.findById(id, userId);
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }
    return order;
  }

  static async createOrder(orderPayload) {
    // Generate order ID if not provided: SO-XXXXX
    if (!orderPayload.id) {
      orderPayload.id = `SO-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    // Normalize snake_case keys if sent by frontend
    const outletId = orderPayload.outletId || orderPayload.outlet_id;
    orderPayload.outletId = outletId;
    orderPayload.outletName = orderPayload.outletName || orderPayload.outlet_name;
    orderPayload.route = orderPayload.route;
    orderPayload.totalValue = orderPayload.totalValue !== undefined ? orderPayload.totalValue : orderPayload.total_value;
    orderPayload.salesmanName = orderPayload.salesmanName || orderPayload.salesman_name;
    orderPayload.linesCount = orderPayload.linesCount !== undefined ? orderPayload.linesCount : orderPayload.lines_count;

    // Check outlet credit status
    if (orderPayload.outletId) {
      const outlet = await OutletModel.findById(orderPayload.outletId);
      if (outlet) {
        orderPayload.outletName = orderPayload.outletName || outlet.name;
        orderPayload.route = orderPayload.route || outlet.route;

        // Auto credit check
        const projectedBalance = (outlet.currentBalance || 0) + (orderPayload.totalValue || 0);
        if (projectedBalance > outlet.creditLimit && outlet.creditLimit > 0) {
          orderPayload.status = 'Hold';
          orderPayload.checkStatus = 'Credit hold';
        } else {
          orderPayload.checkStatus = 'OK';
        }
      }
    }

    if (!orderPayload.date) {
      orderPayload.date = new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }

    if (!orderPayload.deliveryDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      orderPayload.deliveryDate = tomorrow.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }

    return await OrderModel.createOrderWithTransaction(orderPayload);
  }
}

module.exports = OrderService;
