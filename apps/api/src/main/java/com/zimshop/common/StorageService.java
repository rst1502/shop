package com.zimshop.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service @Slf4j
public class StorageService {
    @Value("${storage.local.path:./uploads}") private String uploadPath;
    @Value("${store.storefront-url:http://localhost:4201}") private String storefrontUrl;

    public String upload(MultipartFile file, String folder) {
        try {
            Path dir = Paths.get(uploadPath, folder);
            Files.createDirectories(dir);
            String ext = getExt(file.getOriginalFilename());
            String filename = UUID.randomUUID() + ext;
            Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return storefrontUrl + "/uploads/" + folder + "/" + filename;
        } catch (IOException e) { throw new RuntimeException("Upload failed", e); }
    }

    public void delete(String url) {
        try { Files.deleteIfExists(Paths.get(uploadPath, url.replace(storefrontUrl + "/uploads/", ""))); }
        catch (IOException e) { log.warn("Delete failed: {}", url); }
    }

    private String getExt(String f) { return (f != null && f.contains(".")) ? f.substring(f.lastIndexOf(".")) : ".jpg"; }
}
