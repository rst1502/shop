package com.zimshop.orders;

import com.fasterxml.jackson.databind.JsonNode;
import com.zimshop.channels.whatsapp.WhatsAppService;
import com.zimshop.common.BaseEntity;
import com.zimshop.customers.Customer;
import com.zimshop.products.Currency;
import com.zimshop.products.SalesChannel;
import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

// ─────────────────────────────────────────────
//  Enums
// ─────────────────────────────────────────────

enum OrderStatus {
    PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
}

enum PaymentStatus {
    PENDING, PAID, FAILED, REFUNDED
}

// ─────────────────────────────────────────────
//  Order Entity
// ─────────────────────────────────────────────

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class Order extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SalesChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    private String paymentMethod;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderLineItem> lineItems = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    private Currency currency = Currency.USD;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private String shippingAddressJson;
    private String notes;

    // Paynow
    private String paynowReference;
    private String paynowPollUrl;

    // Channel-specific IDs
    private String facebookOrderId;
    private String whatsappPhone;

    // Sequence for order numbers
    @Column(name = "order_seq")
    private Long orderSeq;
}

// ─────────────────────────────────────────────
//  OrderLineItem Entity
// ─────────────────────────────────────────────

@Entity
@Table(name = "order_line_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class OrderLineItem extends BaseEntity {

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

// ─────────────────────────────────────────────
//  Repository
// ─────────────────────────────────────────────

@Repository
interface OrderRepository extends JpaRepository<Order, UUID> {
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

// ─────────────────────────────────────────────
//  Request/Response DTOs
// ─────────────────────────────────────────────

record CreateOrderRequest(
    String channel,
    List<OrderLineItemRequest> lineItems,
    String customerEmail,
    String customerPhone,
    String shippingAddress,
    String notes
) {}

record OrderLineItemRequest(
    String productId, String variantId,
    String productTitle, String variantTitle,
    int quantity, BigDecimal price
) {}

// ─────────────────────────────────────────────
//  Service
// ─────────────────────────────────────────────

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final WhatsAppService whatsAppService;

    private static long orderCounter = 1000;

    // ── CREATE ORDER ─────────────────────────

    public Order createOrder(CreateOrderRequest request) {
        BigDecimal subtotal = request.lineItems().stream()
            .map(li -> li.price().multiply(BigDecimal.valueOf(li.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
            .orderNumber(generateOrderNumber())
            .channel(SalesChannel.valueOf(request.channel()))
            .status(OrderStatus.PENDING)
            .paymentStatus(PaymentStatus.PENDING)
            .subtotal(subtotal)
            .total(subtotal) // add shipping + tax as needed
            .currency(Currency.USD)
            .notes(request.notes())
            .build();

        // Add line items
        for (OrderLineItemRequest li : request.lineItems()) {
            OrderLineItem item = OrderLineItem.builder()
                .order(order)
                .productId(li.productId())
                .variantId(li.variantId())
                .productTitle(li.productTitle())
                .variantTitle(li.variantTitle())
                .quantity(li.quantity())
                .price(li.price())
                .build();
            order.getLineItems().add(item);
        }

        Order saved = orderRepository.save(order);
        log.info("Created order {} from channel {}", saved.getOrderNumber(), saved.getChannel());
        return saved;
    }

    // ── CREATE FROM FACEBOOK ─────────────────

    public Order createOrderFromFacebook(JsonNode fbOrder) {
        String fbOrderId = fbOrder.path("id").asText();

        // Check for duplicate
        if (orderRepository.findByFacebookOrderId(fbOrderId).isPresent()) {
            log.info("Facebook order {} already processed", fbOrderId);
            return orderRepository.findByFacebookOrderId(fbOrderId).get();
        }

        BigDecimal total = new BigDecimal(
            fbOrder.path("estimated_payment_details").path("total_amount").path("amount").asText("0"));

        Order order = Order.builder()
            .orderNumber(generateOrderNumber())
            .channel(SalesChannel.FACEBOOK)
            .facebookOrderId(fbOrderId)
            .status(OrderStatus.PAID)  // Facebook orders are pre-paid
            .paymentStatus(PaymentStatus.PAID)
            .subtotal(total)
            .total(total)
            .currency(Currency.USD)
            .build();

        Order saved = orderRepository.save(order);
        log.info("Created order {} from Facebook order {}", saved.getOrderNumber(), fbOrderId);
        return saved;
    }

    // ── CREATE FROM WHATSAPP ─────────────────

    public Order createOrderFromWhatsApp(String phone, JsonNode waOrder) {
        Order order = Order.builder()
            .orderNumber(generateOrderNumber())
            .channel(SalesChannel.WHATSAPP)
            .whatsappPhone(phone)
            .status(OrderStatus.PENDING)
            .paymentStatus(PaymentStatus.PENDING)
            .subtotal(BigDecimal.ZERO)
            .total(BigDecimal.ZERO)
            .currency(Currency.USD)
            .build();

        Order saved = orderRepository.save(order);
        log.info("Created WhatsApp order {} for {}", saved.getOrderNumber(), phone);
        return saved;
    }

    // ── CREATE DRAFT (WhatsApp buy button) ───

    public Order createDraftOrderFromWhatsApp(String phone, String variantId) {
        Order order = Order.builder()
            .orderNumber(generateOrderNumber())
            .channel(SalesChannel.WHATSAPP)
            .whatsappPhone(phone)
            .status(OrderStatus.PENDING)
            .paymentStatus(PaymentStatus.PENDING)
            .subtotal(BigDecimal.ZERO)
            .total(BigDecimal.ZERO)
            .currency(Currency.USD)
            .build();
        return orderRepository.save(order);
    }

    // ── MARK AS PAID ─────────────────────────

    public void markOrderAsPaid(String orderNumber, String paynowRef, String paymentMethod) {
        orderRepository.findByOrderNumber(orderNumber).ifPresent(order -> {
            order.setStatus(OrderStatus.PAID);
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setPaynowReference(paynowRef);
            order.setPaymentMethod(paymentMethod);
            orderRepository.save(order);

            // Send WhatsApp confirmation if from WhatsApp channel or phone available
            if (order.getWhatsappPhone() != null) {
                whatsAppService.sendOrderConfirmation(order, order.getWhatsappPhone());
            }

            log.info("Order {} marked PAID", orderNumber);
        });
    }

    // ── UPDATE FROM FACEBOOK ─────────────────

    public void updateOrderFromFacebook(String fbOrderId, String status) {
        orderRepository.findByFacebookOrderId(fbOrderId).ifPresent(order -> {
            if ("CANCELLED".equalsIgnoreCase(status)) {
                order.setStatus(OrderStatus.CANCELLED);
            }
            orderRepository.save(order);
        });
    }

    // ── MARK AS CANCELLED ────────────────────

    public void markOrderAsCancelled(String orderNumber, String reason) {
        orderRepository.findByOrderNumber(orderNumber).ifPresent(order -> {
            order.setStatus(OrderStatus.CANCELLED);
            order.setNotes(reason);
            orderRepository.save(order);
        });
    }

    // ── STORE POLL URL ───────────────────────

    public void storePaynowPollUrl(UUID orderId, String pollUrl) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setPaynowPollUrl(pollUrl);
            orderRepository.save(order);
        });
    }

    // ── FIND ─────────────────────────────────

    public Optional<Order> findById(UUID id) {
        return orderRepository.findById(id);
    }

    public Page<Order> findAll(int page, int size) {
        return orderRepository.findAll(PageRequest.of(page, size,
            Sort.by("createdAt").descending()));
    }

    // ── HELPERS ──────────────────────────────

    private String generateOrderNumber() {
        return "ZS-" + String.format("%06d", ++orderCounter);
    }
}
