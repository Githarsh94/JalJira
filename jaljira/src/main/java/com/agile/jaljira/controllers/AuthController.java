package com.agile.jaljira.controllers;

import com.agile.jaljira.models.User;
import com.agile.jaljira.services.JwtService;
import com.agile.jaljira.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final JwtService jwtService;
    private final RestClient restClient;

    // Google config
    @Value("${app.oauth2.google.client-id}")
    private String googleClientId;
    @Value("${app.oauth2.google.client-secret}")
    private String googleClientSecret;
    @Value("${app.oauth2.google.redirect-uri}")
    private String googleRedirectUri;

    // GitHub config
    @Value("${app.oauth2.github.client-id}")
    private String githubClientId;
    @Value("${app.oauth2.github.client-secret}")
    private String githubClientSecret;
    @Value("${app.oauth2.github.redirect-uri}")
    private String githubRedirectUri;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.restClient = RestClient.create();
    }

    @PostMapping("/oauth2/google")
    public ResponseEntity<Map<String, Object>> googleAuth(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
        }

        try {
            // Exchange code for tokens with Google
            var tokenBody = new LinkedMultiValueMap<String, String>();
            tokenBody.add("code", code);
            tokenBody.add("client_id", googleClientId);
            tokenBody.add("client_secret", googleClientSecret);
            tokenBody.add("redirect_uri", googleRedirectUri);
            tokenBody.add("grant_type", "authorization_code");

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = restClient.post()
                    .uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(tokenBody)
                    .retrieve()
                    .body(Map.class);

            String accessToken = (String) tokenResponse.get("access_token");

            // Fetch user info from Google
            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = restClient.get()
                    .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            logger.info("Google user info retrieved for: {}", userInfo.get("email"));
            return buildAuthResponse(userInfo);

        } catch (Exception e) {
            logger.error("Google OAuth2 token exchange failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication failed: " + e.getMessage()));
        }
    }

    @PostMapping("/oauth2/github")
    public ResponseEntity<Map<String, Object>> githubAuth(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
        }

        try {
            // Exchange code for access token with GitHub
            var tokenBody = new LinkedMultiValueMap<String, String>();
            tokenBody.add("code", code);
            tokenBody.add("client_id", githubClientId);
            tokenBody.add("client_secret", githubClientSecret);
            tokenBody.add("redirect_uri", githubRedirectUri);

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = restClient.post()
                    .uri("https://github.com/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(tokenBody)
                    .retrieve()
                    .body(Map.class);

            String accessToken = (String) tokenResponse.get("access_token");

            // Fetch user info from GitHub
            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = restClient.get()
                    .uri("https://api.github.com/user")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(Map.class);

            // GitHub may not include email in user info — fetch separately
            if (userInfo.get("email") == null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> emails = restClient.get()
                        .uri("https://api.github.com/user/emails")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .retrieve()
                        .body(List.class);

                if (emails != null) {
                    String primaryEmail = emails.stream()
                            .filter(e -> Boolean.TRUE.equals(e.get("primary")))
                            .map(e -> (String) e.get("email"))
                            .findFirst()
                            .orElse(null);
                    userInfo.put("email", primaryEmail);
                }
            }

            logger.info("GitHub user info retrieved for: {}", userInfo.get("email"));
            return buildAuthResponse(userInfo);

        } catch (Exception e) {
            logger.error("GitHub OAuth2 token exchange failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication failed: " + e.getMessage()));
        }
    }

    private ResponseEntity<Map<String, Object>> buildAuthResponse(Map<String, Object> userInfo) {
        User user = userService.getUser(userInfo);
        logger.info("User: {}", user);
        if(user == null) {
            logger.info("User not found, returning null token and user");
            return ResponseEntity.ok(Map.of(
                "token", null,
                "user", null
            ));
        }
        String jwt = jwtService.generateToken(user);

        return ResponseEntity.ok(Map.of(
                "token", jwt,
                "user", Map.of(
                        "id", user.getId().toString(),
                        "email", user.getEmail(),
                        "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                        "lastName", user.getLastName() != null ? user.getLastName() : "",
                        "role", user.getRole().name()
                )
        ));
    }
}
