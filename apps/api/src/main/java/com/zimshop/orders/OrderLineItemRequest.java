package com.zimshop.orders;

import java.math.BigDecimal;

public record OrderLineItemRequest(
    String productId,
    String variantId,
    String productTitle,
    String variantTitle,
    int quantity,
    BigDecimal price
) {}
