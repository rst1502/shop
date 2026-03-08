package com.zimshop.products;

import com.zimshop.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false) private String title;
    private String sku;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal price;
    @Column(precision = 10, scale = 2) private BigDecimal compareAtPrice;
    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default private Currency currency = Currency.USD;
    @Column(nullable = false) @Builder.Default private Integer inventoryQuantity = 0;
    private String imageUrl;
    @Builder.Default private Integer position = 0;
}
