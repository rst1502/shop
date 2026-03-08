package com.zimshop.products;

import com.zimshop.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

// ─────────────────────────────────────────────
//  Enums
// ─────────────────────────────────────────────

enum ProductStatus { DRAFT, ACTIVE, ARCHIVED }

enum SalesChannel { WEB, FACEBOOK, WHATSAPP }

enum Currency { USD, ZWL }

// ─────────────────────────────────────────────
//  ProductVariant
// ─────────────────────────────────────────────

@Entity
@Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ProductVariant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String title;          // "Red / Large"

    private String sku;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal compareAtPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Currency currency = Currency.USD;

    @Column(nullable = false)
    private Integer inventoryQuantity = 0;

    private String imageUrl;

    // Stores {"color":"Red","size":"Large"} as JSON
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String options;

    private Integer position;
}

// ─────────────────────────────────────────────
//  ProductImage
// ─────────────────────────────────────────────

@Entity
@Table(name = "product_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ProductImage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String url;

    private String altText;

    @Column(nullable = false)
    private Integer position = 0;
}

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
