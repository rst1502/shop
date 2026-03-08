package com.zimshop.channels.whatsapp;

import com.zimshop.orders.Order;
import com.zimshop.products.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * WhatsApp Business Cloud API integration.
 *
 * Supports:
 *  - Sending product catalogs via interactive list messages
 *  - Order confirmation messages
 *  - Checkout link messages (redirects to Paynow)
 *  - Order status update notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final WebClient.Builder webClientBuilder;

    @Value("${whatsapp.access-token}")      private String accessToken;
    @Value("${whatsapp.phone-number-id}")   private String phoneNumberId;
    @Value("${whatsapp.api-url}")           private String apiUrl;
    @Value("${whatsapp.storefront-url}")    private String storefrontUrl;

    // ── SEND TEXT MESSAGE ────────────────────

    public void sendTextMessage(String to, String text) {
        Map<String, Object> payload = Map.of(
            "messaging_product", "whatsapp",
            "recipient_type", "individual",
            "to", sanitizePhone(to),
            "type", "text",
            "text", Map.of("body", text, "preview_url", false)
        );
        sendMessage(payload);
    }

    // ── SEND ORDER CONFIRMATION ──────────────

    public void sendOrderConfirmation(Order order, String customerPhone) {
        String message = String.format(
            "✅ *Order Confirmed!*\n\n" +
            "Order #%s has been received.\n" +
            "Total: *$%.2f*\n\n" +
            "Track your order: %s/orders/%s\n\n" +
            "Thank you for shopping with us! 🛍️",
            order.getOrderNumber(),
            order.getTotal(),
            storefrontUrl,
            order.getId()
        );
        sendTextMessage(customerPhone, message);
    }

    // ── SEND PAYMENT LINK ────────────────────

    public void sendPaymentLink(Order order, String paymentUrl, String customerPhone) {
        Map<String, Object> payload = Map.of(
            "messaging_product", "whatsapp",
            "recipient_type", "individual",
            "to", sanitizePhone(customerPhone),
            "type", "interactive",
            "interactive", Map.of(
                "type", "cta_url",
                "body", Map.of("text",
                    String.format("Your order #%s is ready!\nTotal: *$%.2f*\n\nClick below to pay securely with Paynow:",
                        order.getOrderNumber(), order.getTotal())),
                "action", Map.of(
                    "name", "cta_url",
                    "parameters", Map.of(
                        "display_text", "Pay Now 💳",
                        "url", paymentUrl
                    )
                )
            )
        );
        sendMessage(payload);
    }

    // ── SEND PRODUCT CATALOG (list message) ──

    public void sendProductCatalog(String to, List<Product> products) {
        if (products.isEmpty()) return;

        // WhatsApp list messages support up to 10 sections of 10 items
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Product p : products.subList(0, Math.min(products.size(), 10))) {
            String price = p.getVariants().isEmpty() ? "Contact for price"
                : "$" + p.getVariants().get(0).getPrice();
            rows.add(Map.of(
                "id", p.getId().toString(),
                "title", p.getTitle().substring(0, Math.min(p.getTitle().length(), 24)),
                "description", price
            ));
        }

        Map<String, Object> payload = Map.of(
            "messaging_product", "whatsapp",
            "recipient_type", "individual",
            "to", sanitizePhone(to),
            "type", "interactive",
            "interactive", Map.of(
                "type", "list",
                "header", Map.of("type", "text", "text", "🛍️ Our Products"),
                "body", Map.of("text", "Browse our latest products. Reply with a number to learn more or place an order!"),
                "footer", Map.of("text", "Tap a product to view details"),
                "action", Map.of(
                    "button", "View Products",
                    "sections", List.of(Map.of(
                        "title", "Available Products",
                        "rows", rows
                    ))
                )
            )
        );
        sendMessage(payload);
    }

    // ── SEND ORDER STATUS UPDATE ─────────────

    public void sendOrderStatusUpdate(Order order, String customerPhone) {
        Map<String, String> statusEmojis = Map.of(
            "PROCESSING", "⚙️ Processing",
            "SHIPPED", "🚚 Shipped",
            "DELIVERED", "✅ Delivered",
            "CANCELLED", "❌ Cancelled"
        );

        String statusText = statusEmojis.getOrDefault(order.getStatus().name(),
            order.getStatus().name());

        String message = String.format(
            "*Order Update* 📦\n\nOrder #%s is now: *%s*\n\nView details: %s/orders/%s",
            order.getOrderNumber(), statusText, storefrontUrl, order.getId()
        );
        sendTextMessage(customerPhone, message);
    }

    // ── SEND WELCOME MESSAGE ─────────────────

    public void sendWelcomeMessage(String to, String customerName) {
        sendTextMessage(to, String.format(
            "👋 Hello %s!\n\nWelcome to ZimShop! 🛍️\n\n" +
            "You can:\n" +
            "• Type *CATALOG* to browse products\n" +
            "• Type *ORDERS* to check your orders\n" +
            "• Type *HELP* for assistance\n\n" +
            "Or visit our website: %s",
            customerName, storefrontUrl
        ));
    }

    // ── ASYNC PRODUCT SYNC ───────────────────

    @Async
    public void syncProductAsync(Product product) {
        // Update WhatsApp catalog if using WhatsApp Commerce
        // (requires WhatsApp Business Catalog API)
        log.info("Product {} flagged for WhatsApp catalog sync", product.getId());
    }

    // ── PRIVATE HELPERS ──────────────────────

    private void sendMessage(Map<String, Object> payload) {
        buildClient()
            .post()
            .uri("/{phoneNumberId}/messages", phoneNumberId)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(Map.class)
            .doOnSuccess(r -> log.debug("WhatsApp message sent: {}", r))
            .doOnError(e -> log.error("WhatsApp send failed: {}", e.getMessage()))
            .subscribe();
    }

    private WebClient buildClient() {
        return webClientBuilder
            .baseUrl(apiUrl)
            .defaultHeader("Authorization", "Bearer " + accessToken)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    private String sanitizePhone(String phone) {
        // Remove spaces, dashes, +; ensure starts with country code
        return phone.replaceAll("[\\s\\-()]", "").replaceFirst("^\\+", "");
    }
}
