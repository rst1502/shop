package com.zimshop.orders;

import java.util.List;

public record CreateOrderRequest(
    String channel,
    List<OrderLineItemRequest> lineItems,
    String customerEmail,
    String customerPhone,
    String shippingAddress,
    String notes
) {}
