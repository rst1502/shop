package com.zimshop.common;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class SlugUtils {
    private static final Pattern NON_LATIN  = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern MULTI_DASH = Pattern.compile("-+");

    public static String toSlug(String input) {
        if (input == null) return "";
        String n = Normalizer.normalize(input, Normalizer.Form.NFD);
        return MULTI_DASH.matcher(
            NON_LATIN.matcher(
                WHITESPACE.matcher(n.toLowerCase(Locale.ENGLISH)).replaceAll("-")
            ).replaceAll("")
        ).replaceAll("-").replaceAll("^-|-$", "");
    }
}
