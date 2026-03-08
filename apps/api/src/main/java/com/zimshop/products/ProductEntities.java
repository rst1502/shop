package com.zimshop.products;

import com.zimshop.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// ─────────────────────────────────────────────
//  ProductOption
// ─────────────────────────────────────────────

@Entity
@Table(name = "product_options")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ProductOption extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String name;           // "Color", "Size"

    @ElementCollection
    @CollectionTable(name = "product_option_values",
                     joinColumns = @JoinColumn(name = "option_id"))
    @Column(name = "value")
    private java.util.List<String> values = new java.util.ArrayList<>();

    private Integer position;
}
