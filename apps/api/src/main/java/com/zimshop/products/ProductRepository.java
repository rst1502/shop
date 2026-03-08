package com.zimshop.products;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findByHandle(String handle);
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);
    @Query("SELECT p FROM Product p WHERE :channel MEMBER OF p.channels AND p.status = 'ACTIVE'")
    Page<Product> findByChannel(SalesChannel channel, Pageable pageable);
    boolean existsByHandle(String handle);
}
