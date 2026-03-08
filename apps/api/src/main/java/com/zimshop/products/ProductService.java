package com.zimshop.products;

import com.zimshop.channels.facebook.FacebookCatalogService;
import com.zimshop.channels.whatsapp.WhatsAppService;
import com.zimshop.common.SlugUtils;
import com.zimshop.common.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

// ─────────────────────────────────────────────
//  DTOs
// ─────────────────────────────────────────────

record ProductImageDto(UUID id, String url, String altText, int position) {}

record ProductVariantDto(
    UUID id, String title, String sku,
    java.math.BigDecimal price, java.math.BigDecimal compareAtPrice,
    String currency, int inventoryQuantity, String imageUrl
) {}

record ProductDto(
    UUID id, String title, String description, String handle,
    String status, String vendor, String productType,
    List<String> tags, List<String> channels,
    List<ProductImageDto> images, List<ProductVariantDto> variants,
    String facebookProductId, String createdAt, String updatedAt
) {}

record CreateProductRequest(
    String title, String description, String descriptionHtml,
    String status, String vendor, String productType,
    List<String> tags, List<String> channels,
    List<CreateVariantRequest> variants
) {}

record CreateVariantRequest(
    String title, String sku, java.math.BigDecimal price,
    java.math.BigDecimal compareAtPrice, int inventoryQuantity
) {}

record UpdateProductRequest(
    String title, String description, String status,
    String vendor, String productType,
    List<String> tags, List<String> channels
) {}

record PublishToChannelRequest(List<String> channels) {}

// ─────────────────────────────────────────────
//  Service
// ─────────────────────────────────────────────

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final FacebookCatalogService facebookCatalogService;
    private final WhatsAppService whatsAppService;
    private final StorageService storageService;

    // ── CREATE ──────────────────────────────

    public Product createProduct(CreateProductRequest request) {
        String handle = SlugUtils.toSlug(request.title());
        // Ensure unique handle
        if (productRepository.existsByHandle(handle)) {
            handle = handle + "-" + System.currentTimeMillis();
        }

        Product product = Product.builder()
            .title(request.title())
            .description(request.description())
            .descriptionHtml(request.descriptionHtml())
            .handle(handle)
            .status(ProductStatus.valueOf(request.status()))
            .vendor(request.vendor())
            .productType(request.productType())
            .tags(request.tags() != null ? request.tags() : new ArrayList<>())
            .channels(request.channels() != null
                ? parseChannels(request.channels())
                : new HashSet<>())
            .build();

        // Add default variant if none provided
        List<CreateVariantRequest> variantRequests = request.variants() != null
            ? request.variants()
            : List.of(new CreateVariantRequest("Default", null,
                java.math.BigDecimal.ZERO, null, 0));

        for (int i = 0; i < variantRequests.size(); i++) {
            CreateVariantRequest vr = variantRequests.get(i);
            ProductVariant variant = ProductVariant.builder()
                .product(product)
                .title(vr.title())
                .sku(vr.sku())
                .price(vr.price())
                .compareAtPrice(vr.compareAtPrice())
                .inventoryQuantity(vr.inventoryQuantity())
                .currency(Currency.USD)
                .position(i)
                .build();
            product.getVariants().add(variant);
        }

        Product saved = productRepository.save(product);
        log.info("Created product: {} ({})", saved.getTitle(), saved.getId());

        // Async: sync to enabled channels
        syncToChannelsAsync(saved);

        return saved;
    }

    // ── READ ─────────────────────────────────

    @Cacheable(value = "products", key = "#id")
    public Optional<Product> findById(UUID id) {
        return productRepository.findById(id);
    }

    @Cacheable(value = "products", key = "#handle")
    public Optional<Product> findByHandle(String handle) {
        return productRepository.findByHandle(handle);
    }

    public Page<Product> findAll(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (status != null) {
            return productRepository.findByStatus(ProductStatus.valueOf(status), pageable);
        }
        return productRepository.findAll(pageable);
    }

    public Page<Product> findByChannel(SalesChannel channel, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByChannel(channel, pageable);
    }

    // ── UPDATE ───────────────────────────────

    @CacheEvict(value = "products", allEntries = true)
    public Product updateProduct(UUID id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));

        if (request.title() != null) product.setTitle(request.title());
        if (request.description() != null) product.setDescription(request.description());
        if (request.status() != null) product.setStatus(ProductStatus.valueOf(request.status()));
        if (request.vendor() != null) product.setVendor(request.vendor());
        if (request.productType() != null) product.setProductType(request.productType());
        if (request.tags() != null) product.setTags(request.tags());
        if (request.channels() != null) product.setChannels(parseChannels(request.channels()));

        Product saved = productRepository.save(product);

        // Re-sync to channels
        syncToChannelsAsync(saved);

        return saved;
    }

    // ── PUBLISH TO CHANNELS ──────────────────

    @CacheEvict(value = "products", allEntries = true)
    public Product publishToChannels(UUID id, List<String> channels) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));

        Set<SalesChannel> newChannels = parseChannels(channels);
        product.setChannels(newChannels);
        Product saved = productRepository.save(product);

        syncToChannelsAsync(saved);
        return saved;
    }

    // ── IMAGE UPLOAD ─────────────────────────

    @CacheEvict(value = "products", allEntries = true)
    public ProductImage uploadImage(UUID productId, MultipartFile file, int position) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));

        String url = storageService.upload(file, "products/" + productId);
        ProductImage image = ProductImage.builder()
            .product(product)
            .url(url)
            .position(position)
            .build();
        product.getImages().add(image);
        productRepository.save(product);

        return image;
    }

    // ── DELETE ───────────────────────────────

    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));

        // Remove from Facebook catalog if published
        if (product.getFacebookProductId() != null) {
            facebookCatalogService.deleteProduct(product.getFacebookProductId());
        }

        productRepository.delete(product);
        log.info("Deleted product: {}", id);
    }

    // ── PRIVATE HELPERS ──────────────────────

    private Set<SalesChannel> parseChannels(List<String> channels) {
        Set<SalesChannel> result = new HashSet<>();
        for (String ch : channels) {
            try { result.add(SalesChannel.valueOf(ch.toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }
        return result;
    }

    private void syncToChannelsAsync(Product product) {
        if (product.getChannels().contains(SalesChannel.FACEBOOK)) {
            facebookCatalogService.syncProductAsync(product);
        }
        // WhatsApp catalog sync (product availability update)
        if (product.getChannels().contains(SalesChannel.WHATSAPP)) {
            whatsAppService.syncProductAsync(product);
        }
    }
}
