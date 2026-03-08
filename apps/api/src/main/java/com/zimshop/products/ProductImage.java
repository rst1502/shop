package com.zimshop.products;

import com.zimshop.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "product_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductImage extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false) private String url;
    private String altText;
    @Column(nullable = false) @Builder.Default private Integer position = 0;
}
