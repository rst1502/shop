package com.zimshop.channels.facebook;

import com.fasterxml.jackson.databind.JsonNode;
import com.zimshop.orders.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives webhooks from Facebook:
 *  - New orders from Facebook Shop
 *  - Order updates (cancellations, etc.)
 *  - Catalog feedback
 */
@RestController
@RequestMapping("/webhooks/facebook")
@RequiredArgsConstructor
@Slf4j
public class FacebookWebhookController {

    private final OrderService orderService;

    @Value("${facebook.webhook-verify-token}")
    private String verifyToken;

    // ── WEBHOOK VERIFICATION (one-time setup) ──

    @GetMapping
    public ResponseEntity<String> verifyWebhook(
        @RequestParam("hub.mode") String mode,
        @RequestParam("hub.verify_token") String token,
        @RequestParam("hub.challenge") String challenge
    ) {
        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("Facebook webhook verified successfully");
            return ResponseEntity.ok(challenge);
        }
        log.warn("Facebook webhook verification failed");
        return ResponseEntity.status(403).body("Forbidden");
    }

    // ── RECEIVE WEBHOOK EVENTS ───────────────

    @PostMapping
    public ResponseEntity<String> handleWebhook(@RequestBody JsonNode payload) {
        log.debug("Facebook webhook received: {}", payload);

        String object = payload.path("object").asText();

        if ("commerce_order".equals(object)) {
            handleCommerceOrderEvent(payload);
        } else if ("page".equals(object)) {
            handlePageEvent(payload);
        }

        // Always return 200 quickly to Facebook
        return ResponseEntity.ok("EVENT_RECEIVED");
    }

    // ── ORDER EVENTS ─────────────────────────

    private void handleCommerceOrderEvent(JsonNode payload) {
        payload.path("entry").forEach(entry -> {
            entry.path("changes").forEach(change -> {
                String field = change.path("field").asText();
                JsonNode value = change.path("value");

                switch (field) {
                    case "commerce_orders" -> handleNewOrder(value);
                    case "commerce_order_updates" -> handleOrderUpdate(value);
                    default -> log.debug("Unhandled FB commerce field: {}", field);
                }
            });
        });
    }

    private void handleNewOrder(JsonNode orderData) {
        try {
            String fbOrderId = orderData.path("id").asText();
            log.info("New Facebook order received: {}", fbOrderId);
            orderService.createOrderFromFacebook(orderData);
        } catch (Exception e) {
            log.error("Failed to process Facebook order: {}", e.getMessage());
        }
    }

    private void handleOrderUpdate(JsonNode updateData) {
        String fbOrderId = updateData.path("id").asText();
        String status = updateData.path("order_status").path("state").asText();
        log.info("Facebook order {} status update: {}", fbOrderId, status);
        orderService.updateOrderFromFacebook(fbOrderId, status);
    }

    // ── PAGE EVENTS (messaging etc.) ─────────

    private void handlePageEvent(JsonNode payload) {
        // Handle Facebook Messenger messages here if needed
        log.debug("Facebook page event received");
    }
}
