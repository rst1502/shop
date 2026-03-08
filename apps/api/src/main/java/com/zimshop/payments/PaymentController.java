package com.zimshop.payments;

import com.zimshop.orders.OrderService;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

// ─────────────────────────────────────────────
//  DTOs
// ─────────────────────────────────────────────

@Builder @Getter @AllArgsConstructor
class PaynowResponse {
    private boolean success;
    private String redirectUrl;
    private String pollUrl;
    private String error;

    static PaynowResponse error(String message) {
        return PaynowResponse.builder().success(false).error(message).build();
    }
}

@Builder @Getter @AllArgsConstructor
class PaynowStatusResult {
    private boolean paid;
    private String status;
    private String paynowReference;
    private BigDecimal amount;
}

record InitiatePaymentRequest(
    UUID orderId,
    String method,      // WEB | ECOCASH | ONEMONEY
    String phone        // required for mobile payments
) {}

record InitiatePaymentResponse(
    boolean success,
    String redirectUrl,
    String pollUrl,
    String error
) {}

// ─────────────────────────────────────────────
//  Controller
// ─────────────────────────────────────────────

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaynowService paynowService;
    private final OrderService orderService;

    /**
     * POST /payments/initiate
     * Called by frontend checkout to get Paynow redirect URL.
     */
    @PostMapping("/initiate")
    public ResponseEntity<InitiatePaymentResponse> initiatePayment(
        @RequestBody InitiatePaymentRequest request
    ) {
        var order = orderService.findById(request.orderId())
            .orElseThrow(() -> new RuntimeException("Order not found"));

        PaynowResponse response = switch (request.method()) {
            case "ECOCASH"  -> paynowService.initiateEcocashPayment(order, request.phone());
            case "ONEMONEY" -> paynowService.initiateOneMoneyPayment(order, request.phone());
            default         -> paynowService.initiateWebPayment(order);
        };

        if (response.isSuccess()) {
            // Store poll URL on order for status polling
            orderService.storePaynowPollUrl(order.getId(), response.getPollUrl());
        }

        return ResponseEntity.ok(new InitiatePaymentResponse(
            response.isSuccess(),
            response.getRedirectUrl(),
            response.getPollUrl(),
            response.getError()
        ));
    }

    /**
     * GET /payments/status/{orderId}
     * Frontend polls this to check if payment is complete.
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable UUID orderId) {
        var order = orderService.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getPaynowPollUrl() != null) {
            var status = paynowService.checkPaymentStatus(order.getPaynowPollUrl());
            return ResponseEntity.ok(Map.of(
                "paid", status.isPaid(),
                "status", status.getStatus(),
                "orderStatus", order.getStatus().name()
            ));
        }

        return ResponseEntity.ok(Map.of(
            "paid", "PAID".equals(order.getPaymentStatus().name()),
            "orderStatus", order.getStatus().name()
        ));
    }

    /**
     * POST /payments/paynow/callback
     * Paynow POSTs here when a payment is completed.
     * URL must be publicly accessible (use ngrok in development).
     */
    @PostMapping("/paynow/callback")
    public ResponseEntity<String> paynowCallback(
        @RequestParam Map<String, String> params
    ) {
        log.info("Paynow callback received: {}", params);
        paynowService.handleCallback(params);
        return ResponseEntity.ok("OK");
    }
}
