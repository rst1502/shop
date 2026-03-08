package com.zimshop.orders;

import com.zimshop.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_line_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderLineItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private String productId;
    private String variantId;
    private String productTitle;
    private String variantTitle;
    private String sku;
    private Integer quantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private String imageUrl;
}
