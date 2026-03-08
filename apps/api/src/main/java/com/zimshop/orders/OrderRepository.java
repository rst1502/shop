package com.zimshop.orders;

import com.zimshop.products.SalesChannel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByFacebookOrderId(String facebookOrderId);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Page<Order> findByChannel(SalesChannel channel, Pageable pageable);
    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.paymentStatus = 'PAID' AND o.createdAt >= :from")
    Optional<BigDecimal> sumRevenueSince(LocalDateTime from);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :from")
    Long countOrdersSince(LocalDateTime from);
}
