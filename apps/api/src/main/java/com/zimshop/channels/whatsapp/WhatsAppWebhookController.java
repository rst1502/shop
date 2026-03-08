package com.zimshop.channels.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.zimshop.orders.OrderService;
import com.zimshop.products.ProductService;
import com.zimshop.products.SalesChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Handles incoming WhatsApp messages and drives a
 * simple conversational commerce flow:
 *
 *  Customer → CATALOG  → send product list
 *  Customer → selects  → send product detail + "Add to Cart" button
 *  Customer → Add Cart → create pending order, send payment link
 *  Customer pays       → Paynow callback confirms, send confirmation
 */
@RestController
@RequestMapping("/webhooks/whatsapp")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppWebhookController {

    private final WhatsAppService whatsAppService;
    private final OrderService orderService;
    private final ProductService productService;

    @Value("${whatsapp.webhook-verify-token}")
    private String verifyToken;

    // ── WEBHOOK VERIFICATION ─────────────────

    @GetMapping
    public ResponseEntity<String> verifyWebhook(
        @RequestParam("hub.mode") String mode,
        @RequestParam("hub.verify_token") String token,
        @RequestParam("hub.challenge") String challenge
    ) {
        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("WhatsApp webhook verified");
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(403).body("Forbidden");
    }

    // ── RECEIVE MESSAGES ─────────────────────

    @PostMapping
    public ResponseEntity<String> handleWebhook(@RequestBody JsonNode payload) {
        try {
            payload.path("entry").forEach(entry ->
                entry.path("changes").forEach(change -> {
                    JsonNode value = change.path("value");
                    JsonNode messages = value.path("messages");
                    if (!messages.isMissingNode() && messages.isArray()) {
                        messages.forEach(msg -> processMessage(msg, value));
                    }
                })
            );
        } catch (Exception e) {
            log.error("WhatsApp webhook error: {}", e.getMessage());
        }
        return ResponseEntity.ok("EVENT_RECEIVED");
    }

    // ── MESSAGE HANDLER ──────────────────────

    private void processMessage(JsonNode message, JsonNode value) {
        String from = message.path("from").asText();
        String type = message.path("type").asText();

        log.info("WhatsApp message from {} type {}", from, type);

        switch (type) {
            case "text" -> handleTextMessage(from, message.path("text").path("body").asText());
            case "interactive" -> handleInteractiveMessage(from, message.path("interactive"));
            case "order" -> handleOrderMessage(from, message.path("order"));
            default -> log.debug("Unhandled WA message type: {}", type);
        }
    }

    private void handleTextMessage(String from, String body) {
        String command = body.trim().toUpperCase();
        switch (command) {
            case "CATALOG", "PRODUCTS", "SHOP" -> {
                var products = productService
                    .findByChannel(SalesChannel.WHATSAPP, 0, 10)
                    .getContent();
                whatsAppService.sendProductCatalog(from, products);
            }
            case "ORDERS" -> {
                whatsAppService.sendTextMessage(from,
                    "To check your orders, visit:\n" +
                    "https://zimshop.co.zw/orders\n\nOr reply with your order number.");
            }
            case "HELP", "HI", "HELLO", "HEY" -> {
                whatsAppService.sendWelcomeMessage(from, "there");
            }
            default -> {
                // Check if it's an order number lookup
                if (body.startsWith("ZS-")) {
                    handleOrderLookup(from, body.trim());
                } else {
                    whatsAppService.sendTextMessage(from,
                        "Hi! Reply with:\n• *CATALOG* - Browse products\n• *ORDERS* - Check orders\n• *HELP* - Get assistance");
                }
            }
        }
    }

    private void handleInteractiveMessage(String from, JsonNode interactive) {
        String interactiveType = interactive.path("type").asText();

        if ("list_reply".equals(interactiveType)) {
            // Customer selected a product from the catalog list
            String productId = interactive.path("list_reply").path("id").asText();
            sendProductDetail(from, productId);
        } else if ("button_reply".equals(interactiveType)) {
            String buttonId = interactive.path("button_reply").path("id").asText();
            if (buttonId.startsWith("add_cart_")) {
                String variantId = buttonId.replace("add_cart_", "");
                initiateWhatsAppOrder(from, variantId);
            }
        }
    }

    private void handleOrderMessage(String from, JsonNode order) {
        // Native WhatsApp Commerce order (if using WA catalog)
        log.info("Native WhatsApp order from {}: {}", from, order);
        orderService.createOrderFromWhatsApp(from, order);
    }

    private void sendProductDetail(String from, String productId) {
        try {
            var product = productService.findById(java.util.UUID.fromString(productId));
            product.ifPresent(p -> {
                var variant = p.getVariants().isEmpty() ? null : p.getVariants().get(0);
                String priceText = variant != null ? "$" + variant.getPrice() : "Contact for price";
                String stockText = (variant != null && variant.getInventoryQuantity() > 0)
                    ? "✅ In stock" : "❌ Out of stock";

                // Send product info with Buy button
                Map<String, Object> payload = Map.of(
                    "messaging_product", "whatsapp",
                    "recipient_type", "individual",
                    "to", from,
                    "type", "interactive",
                    "interactive", Map.of(
                        "type", "button",
                        "header", Map.of("type", "image",
                            "image", Map.of("link",
                                p.getImages().isEmpty() ? "" : p.getImages().get(0).getUrl())),
                        "body", Map.of("text",
                            String.format("*%s*\n\n%s\n\nPrice: *%s*\n%s",
                                p.getTitle(),
                                p.getDescription() != null
                                    ? p.getDescription().substring(0, Math.min(200, p.getDescription().length()))
                                    : "",
                                priceText, stockText)),
                        "action", Map.of(
                            "buttons", List.of(
                                Map.of("type", "reply", "reply",
                                    Map.of("id", "add_cart_" + (variant != null ? variant.getId() : productId),
                                           "title", "🛒 Buy Now")),
                                Map.of("type", "reply", "reply",
                                    Map.of("id", "view_web_" + productId,
                                           "title", "🌐 View on Web"))
                            )
                        )
                    )
                );
                // Send via WhatsAppService sendMessage (expose method or use WebClient directly)
                whatsAppService.sendTextMessage(from,
                    String.format("*%s*\n\n%s\n\nPrice: *%s*\n%s\n\nTo order, visit: %s/products/%s",
                        p.getTitle(),
                        p.getDescription() != null ? p.getDescription().substring(0, Math.min(200, p.getDescription().length())) : "",
                        priceText, stockText,
                        "https://zimshop.co.zw", p.getHandle()));
            });
        } catch (Exception e) {
            log.error("Error sending product detail: {}", e.getMessage());
            whatsAppService.sendTextMessage(from, "Sorry, I couldn't find that product. Type CATALOG to browse.");
        }
    }

    private void initiateWhatsAppOrder(String from, String variantId) {
        try {
            var order = orderService.createDraftOrderFromWhatsApp(from, variantId);
            var paymentUrl = "https://zimshop.co.zw/checkout?order=" + order.getId();
            whatsAppService.sendPaymentLink(order, paymentUrl, from);
        } catch (Exception e) {
            log.error("WhatsApp order initiation failed: {}", e.getMessage());
            whatsAppService.sendTextMessage(from,
                "Sorry, I couldn't process your order. Please try again or visit our website.");
        }
    }

    private void handleOrderLookup(String from, String orderNumber) {
        whatsAppService.sendTextMessage(from,
            String.format("Track order *%s* here:\nhttps://zimshop.co.zw/orders/%s",
                orderNumber, orderNumber));
    }
}
