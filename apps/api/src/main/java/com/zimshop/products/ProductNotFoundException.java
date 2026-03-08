package com.zimshop.products;
import java.util.UUID;
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(UUID id) { super("Product not found: " + id); }
    public ProductNotFoundException(String handle) { super("Product not found: " + handle); }
}
