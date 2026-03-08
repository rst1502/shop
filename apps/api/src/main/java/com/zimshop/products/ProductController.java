package com.zimshop.products;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4201"})
public class ProductController {

    private final ProductService productService;

    // ── PUBLIC STOREFRONT ENDPOINTS ──────────

    /** GET /products?page=0&size=20&channel=WEB */
    @GetMapping
    public ResponseEntity<Page<Product>> listProducts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String channel
    ) {
        if (channel != null) {
            return ResponseEntity.ok(
                productService.findByChannel(SalesChannel.valueOf(channel), page, size));
        }
        return ResponseEntity.ok(productService.findAll(page, size, status));
    }

    /** GET /products/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable UUID id) {
        return productService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /products/handle/{handle} */
    @GetMapping("/handle/{handle}")
    public ResponseEntity<Product> getProductByHandle(@PathVariable String handle) {
        return productService.findByHandle(handle)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // ── ADMIN ENDPOINTS ──────────────────────

    /** POST /products */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(@RequestBody CreateProductRequest request) {
        return productService.createProduct(request);
    }

    /** PUT /products/{id} */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product updateProduct(@PathVariable UUID id,
                                 @RequestBody UpdateProductRequest request) {
        return productService.updateProduct(id, request);
    }

    /** POST /products/{id}/publish - publish to sales channels */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public Product publishToChannels(@PathVariable UUID id,
                                     @RequestBody PublishToChannelRequest request) {
        return productService.publishToChannels(id, request.channels());
    }

    /** POST /products/{id}/images */
    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductImage uploadImage(
        @PathVariable UUID id,
        @RequestParam("file") MultipartFile file,
        @RequestParam(defaultValue = "0") int position
    ) {
        return productService.uploadImage(id, file, position);
    }

    /** DELETE /products/{id} */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
    }
}
