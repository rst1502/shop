package com.zimshop.customers;

import com.zimshop.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "customers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer extends BaseEntity {
    @Column(nullable = false) private String firstName;
    @Column(nullable = false) private String lastName;
    @Column(unique = true, nullable = false) private String email;
    private String phone;
    private String whatsappPhone;
    private String facebookId;
    @Builder.Default private Integer totalOrders = 0;
    @Builder.Default @Column(precision = 12, scale = 2) private BigDecimal totalSpent = BigDecimal.ZERO;
}
