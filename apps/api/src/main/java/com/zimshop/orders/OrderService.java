package com.zimshop.orders;

import com.fasterxml.jackson.databind.JsonNode;
import com.zimshop.channels.whatsapp.WhatsAppService;
import com.zimshop.products.Currency;
import com.zimshop.products.SalesChannel;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

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
