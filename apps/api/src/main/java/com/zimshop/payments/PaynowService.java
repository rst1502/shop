package com.zimshop.payments;

import com.zimshop.orders.Order;
import com.zimshop.orders.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/**
 * Paynow Zimbabwe Payment Gateway Integration.
 *
 * Supports:
 *  - Web payments (redirect to Paynow, then bank/card)
 *  - EcoCash mobile payments (push to phone)
 *  - OneMoney mobile payments (push to phone)
 *
 * Flow:
 *  1. Initiate → get redirectUrl (web) or pollUrl (mobile)
 *  2. Customer pays
 *  3. Paynow POSTs to resultUrl (callback) OR we poll pollUrl
 *  4. Verify hash, update order status
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaynowService {

    private final RestTemplate restTemplate;
    private final OrderService orderService;

    @Value("${paynow.integration-id}")   private String integrationId;
    @Value("${paynow.integration-key}")  private String integrationKey;
    @Value("${paynow.return-url}")       private String returnUrl;
    @Value("${paynow.result-url}")       private String resultUrl;
    @Value("${paynow.environment}")      private String environment;

    private static final String PAYNOW_INITIATE_URL =
        "https://www.paynow.co.zw/interface/initiatetransaction";
    private static final String PAYNOW_INITIATE_MOBILE_URL =
        "https://www.paynow.co.zw/interface/remotetransaction";

    // ── INITIATE WEB PAYMENT ─────────────────

    public PaynowResponse initiateWebPayment(Order order) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("id", integrationId);
        fields.put("reference", order.getOrderNumber());
        fields.put("amount", order.getTotal().toPlainString());
        fields.put("additionalinfo", buildCartDescription(order));
        fields.put("returnurl", returnUrl + "?order=" + order.getId());
        fields.put("resulturl", resultUrl);
        fields.put("status", "Message");
        fields.put("authemail", order.getCustomer().getEmail());

        // Hash = MD5(id + reference + amount + additionalinfo + returnurl + resulturl + integrationKey + status)
        String hash = generateHash(fields, integrationKey);
        fields.put("hash", hash);

        String responseBody = postToPaynow(PAYNOW_INITIATE_URL, fields);
        return parsePaynowResponse(responseBody);
    }

    // ── INITIATE ECOCASH PAYMENT ─────────────

    public PaynowResponse initiateEcocashPayment(Order order, String phone) {
        return initiateMobilePayment(order, phone, "ecocash");
    }

    // ── INITIATE ONEMONEY PAYMENT ────────────

    public PaynowResponse initiateOneMoneyPayment(Order order, String phone) {
        return initiateMobilePayment(order, phone, "onemoney");
    }

    private PaynowResponse initiateMobilePayment(Order order, String phone, String method) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("id", integrationId);
        fields.put("reference", order.getOrderNumber());
        fields.put("amount", order.getTotal().toPlainString());
        fields.put("additionalinfo", buildCartDescription(order));
        fields.put("returnurl", returnUrl + "?order=" + order.getId());
        fields.put("resulturl", resultUrl);
        fields.put("status", "Message");
        fields.put("authemail", order.getCustomer().getEmail());
        fields.put("phone", sanitizePhone(phone));
        fields.put("method", method);

        String hash = generateHash(fields, integrationKey);
        fields.put("hash", hash);

        String responseBody = postToPaynow(PAYNOW_INITIATE_MOBILE_URL, fields);
        return parsePaynowResponse(responseBody);
    }

    // ── POLL PAYMENT STATUS ──────────────────

    public PaynowStatusResult checkPaymentStatus(String pollUrl) {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(pollUrl, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, String> params = parseQueryString(response.getBody());

                // Verify the hash
                String receivedHash = params.remove("hash");
                String status = params.get("status");
                String reference = params.get("reference");

                return PaynowStatusResult.builder()
                    .paid("Ok".equalsIgnoreCase(status))
                    .status(status)
                    .paynowReference(params.get("paynowreference"))
                    .amount(params.containsKey("amount")
                        ? new BigDecimal(params.get("amount")) : BigDecimal.ZERO)
                    .build();
            }
        } catch (Exception e) {
            log.error("Error polling Paynow status: {}", e.getMessage());
        }
        return PaynowStatusResult.builder().paid(false).status("Error").build();
    }

    // ── HANDLE CALLBACK (from Paynow POST) ───

    public void handleCallback(Map<String, String> params) {
        String status = params.get("status");
        String reference = params.get("reference");       // Our order number
        String paynowRef = params.get("paynowreference");
        String hash = params.getOrDefault("hash", "");

        log.info("Paynow callback: order={} status={} paynowRef={}", reference, status, paynowRef);

        // Verify hash
        Map<String, String> toVerify = new LinkedHashMap<>(params);
        toVerify.remove("hash");
        String expectedHash = generateHash(toVerify, integrationKey);

        if (!expectedHash.equalsIgnoreCase(hash)) {
            log.warn("Paynow callback hash mismatch for order {}", reference);
            return;
        }

        if ("Ok".equalsIgnoreCase(status) || "Paid".equalsIgnoreCase(status)) {
            orderService.markOrderAsPaid(reference, paynowRef, "PAYNOW");
            log.info("Order {} marked as PAID via Paynow", reference);
        } else if ("Cancelled".equalsIgnoreCase(status)) {
            orderService.markOrderAsCancelled(reference, "Payment cancelled by customer");
        }
    }

    // ── HASH GENERATION ──────────────────────

    private String generateHash(Map<String, String> fields, String key) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            sb.append(entry.getValue());
        }
        sb.append(key);

        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] bytes = md.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) hex.append(String.format("%02x", b));
            return hex.toString().toUpperCase();
        } catch (Exception e) {
            throw new RuntimeException("Hash generation failed", e);
        }
    }

    // ── HELPERS ──────────────────────────────

    private String buildCartDescription(Order order) {
        return order.getLineItems().stream()
            .map(li -> li.getQuantity() + "x " + li.getProductTitle())
            .reduce((a, b) -> a + ", " + b)
            .orElse("Order " + order.getOrderNumber());
    }

    private String postToPaynow(String url, Map<String, String> fields) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        fields.forEach(formData::add);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(formData, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        return response.getBody();
    }

    private PaynowResponse parsePaynowResponse(String body) {
        if (body == null) return PaynowResponse.error("No response from Paynow");

        Map<String, String> params = parseQueryString(body);
        String status = params.getOrDefault("status", "");

        if ("Ok".equalsIgnoreCase(status)) {
            return PaynowResponse.builder()
                .success(true)
                .redirectUrl(params.get("browserurl"))
                .pollUrl(params.get("pollurl"))
                .build();
        } else {
            String error = params.getOrDefault("error", status);
            log.warn("Paynow initiation failed: {}", error);
            return PaynowResponse.error(error);
        }
    }

    private Map<String, String> parseQueryString(String queryString) {
        Map<String, String> result = new LinkedHashMap<>();
        if (queryString == null) return result;
        for (String pair : queryString.split("&")) {
            int idx = pair.indexOf("=");
            if (idx > 0) {
                try {
                    String key = URLEncoder.encode(pair.substring(0, idx), StandardCharsets.UTF_8);
                    String val = java.net.URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                    result.put(pair.substring(0, idx), val);
                } catch (Exception ignored) {}
            }
        }
        return result;
    }

    private String sanitizePhone(String phone) {
        String cleaned = phone.replaceAll("[^0-9]", "");
        // Convert 07... to 2637...
        if (cleaned.startsWith("07") || cleaned.startsWith("08")) {
            cleaned = "263" + cleaned.substring(1);
        } else if (cleaned.startsWith("7") || cleaned.startsWith("8")) {
            cleaned = "263" + cleaned;
        }
        return cleaned;
    }
}
