package com.zimshop.channels.facebook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zimshop.products.Product;
import com.zimshop.products.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;

/**
 * Syncs products to Facebook Commerce Catalog.
 * This is how Shopify pushes products to Facebook Shop —
 * we replicate the same pattern using the Catalog Batch API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FacebookCatalogService {

    private final WebClient.Builder webClientBuilder;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    @Value("${facebook.access-token}") private String accessToken;
    @Value("${facebook.catalog-id}")   private String catalogId;
    @Value("${facebook.graph-api-url}") private String graphApiUrl;
    @Value("${facebook.api-version}")  private String apiVersion;
    @Value("${store.storefront-url}")  private String storefrontUrl;

    // ── SYNC PRODUCT (called when admin publishes) ──

    @Async
    public void syncProductAsync(Product product) {
        try {
            if (product.getFacebookProductId() == null) {
                createFacebookProduct(product);
            } else {
                updateFacebookProduct(product);
            }
        } catch (Exception e) {
            log.error("Failed to sync product {} to Facebook: {}", product.getId(), e.getMessage());
        }
    }

    // ── CREATE IN FACEBOOK CATALOG ──────────

    public void createFacebookProduct(Product product) {
        Map<String, Object> item = buildCatalogItem(product);

        WebClient client = buildClient();
        Map response = client.post()
            .uri("/{version}/{catalogId}/items_batch", apiVersion, catalogId)
            .bodyValue(Map.of(
                "allow_upsert", true,
                "requests", List.of(Map.of(
                    "method", "CREATE",
                    "data", item
                ))
            ))
            .retrieve()
            .bodyToMono(Map.class)
            .block();

        if (response != null) {
            // Facebook returns handles; poll for the actual item ID
            log.info("Product {} queued for Facebook catalog creation", product.getId());
            // In production: store the Facebook product ID after batch processes
            // For direct creation use the product endpoint:
            createDirectFacebookProduct(product, item);
        }
    }

    private void createDirectFacebookProduct(Product product, Map<String, Object> item) {
        WebClient client = buildClient();
        Map response = client.post()
            .uri("/{version}/{catalogId}/products", apiVersion, catalogId)
            .bodyValue(item)
            .retrieve()
            .bodyToMono(Map.class)
            .onErrorResume(e -> {
                log.error("Facebook API error: {}", e.getMessage());
                return Mono.empty();
            })
            .block();

        if (response != null && response.containsKey("id")) {
            String fbProductId = (String) response.get("id");
            product.setFacebookProductId(fbProductId);
            productRepository.save(product);
            log.info("Product {} synced to Facebook catalog as {}", product.getId(), fbProductId);
        }
    }

    // ── UPDATE IN FACEBOOK CATALOG ──────────

    public void updateFacebookProduct(Product product) {
        Map<String, Object> item = buildCatalogItem(product);

        WebClient client = buildClient();
        client.post()
            .uri("/{version}/{productId}", apiVersion, product.getFacebookProductId())
            .bodyValue(item)
            .retrieve()
            .bodyToMono(Map.class)
            .doOnSuccess(r -> log.info("Updated Facebook product {}", product.getFacebookProductId()))
            .doOnError(e -> log.error("Facebook update failed: {}", e.getMessage()))
            .subscribe();
    }

    // ── DELETE FROM FACEBOOK CATALOG ────────

    public void deleteProduct(String facebookProductId) {
        WebClient client = buildClient();
        client.delete()
            .uri("/{version}/{productId}", apiVersion, facebookProductId)
            .retrieve()
            .bodyToMono(Map.class)
            .doOnSuccess(r -> log.info("Deleted Facebook product {}", facebookProductId))
            .doOnError(e -> log.error("Facebook delete failed: {}", e.getMessage()))
            .subscribe();
    }

    // ── BULK SYNC ALL ACTIVE PRODUCTS ────────

    public void bulkSyncCatalog(List<Product> products) {
        List<Map<String, Object>> requests = new ArrayList<>();
        for (Product product : products) {
            requests.add(Map.of(
                "method", product.getFacebookProductId() != null ? "UPDATE" : "CREATE",
                "retailer_id", product.getId().toString(),
                "data", buildCatalogItem(product)
            ));
        }

        // Facebook batch API supports up to 1000 items per request
        int batchSize = 1000;
        for (int i = 0; i < requests.size(); i += batchSize) {
            List<Map<String, Object>> batch = requests.subList(i,
                Math.min(i + batchSize, requests.size()));

            WebClient client = buildClient();
            client.post()
                .uri("/{version}/{catalogId}/items_batch", apiVersion, catalogId)
                .bodyValue(Map.of("requests", batch))
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(r -> log.info("Batch sync sent {} items to Facebook", batch.size()))
                .doOnError(e -> log.error("Batch sync failed: {}", e.getMessage()))
                .subscribe();
        }
    }

    // ── BUILD CATALOG ITEM ───────────────────

    private Map<String, Object> buildCatalogItem(Product product) {
        // Get first active variant for price
        var firstVariant = product.getVariants().isEmpty() ? null : product.getVariants().get(0);
        String price = firstVariant != null
            ? firstVariant.getPrice().multiply(java.math.BigDecimal.valueOf(100)).intValue() + " " +
              firstVariant.getCurrency().name()   // Facebook uses cents: "2500 USD"
            : "0 USD";

        String imageUrl = product.getImages().isEmpty() ? ""
            : product.getImages().get(0).getUrl();

        String availability = (firstVariant != null && firstVariant.getInventoryQuantity() > 0)
            ? "in stock" : "out of stock";

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", product.getTitle());
        item.put("description", product.getDescription() != null
            ? product.getDescription().substring(0, Math.min(product.getDescription().length(), 5000))
            : "");
        item.put("availability", availability);
        item.put("condition", "new");
        item.put("price", price);
        item.put("link", storefrontUrl + "/products/" + product.getHandle());
        item.put("image_link", imageUrl);
        item.put("retailer_id", product.getId().toString());

        if (product.getVendor() != null) item.put("brand", product.getVendor());
        if (product.getProductType() != null) item.put("product_type", product.getProductType());

        return item;
    }

    private WebClient buildClient() {
        return webClientBuilder
            .baseUrl(graphApiUrl)
            .defaultHeader("Authorization", "Bearer " + accessToken)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }
}
