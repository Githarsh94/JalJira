package com.agile.jaljira.config;

import com.agile.jaljira.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

import java.io.IOException;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
    
    @Autowired
    private UserService userService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/", "/home", "/index.html", "/oauth2/**", "/login/**", "/static/**", "/*.css", "/*.js").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/manager/**").hasAnyRole("ADMIN", "MANAGER")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/")
                .defaultSuccessUrl("/dashboard", true)
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(oauth2UserService())
                )
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
            );
        return http.build();
    }
    
    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        
        return request -> {
            try {
                logger.info("OAuth2 login initiated for provider: {}", 
                           request.getClientRegistration().getRegistrationId());
                
                OAuth2User oauth2User = delegate.loadUser(request);
                logger.debug("OAuth2User loaded successfully with attributes: {}", 
                            oauth2User.getAttributes().keySet());
                
                // Get or create user in database
                var user = userService.getOrCreateUser(oauth2User);
                
                // Add role as Spring Security authority
                var authorities = Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                );
                
                logger.info("User authenticated successfully: email={}, role={}", 
                           user.getEmail(), user.getRole());
                
                return new DefaultOAuth2User(
                    authorities,
                    oauth2User.getAttributes(),
                    "email"
                );
            } catch (Exception e) {
                logger.error("Error during OAuth2 user processing", e);
                throw e;
            }
        };
    }

    /**
     * Custom entry point that returns 401 for API requests and redirects browsers to login page
     */
    private static class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
        @Override
        public void commence(HttpServletRequest request, HttpServletResponse response,
                           AuthenticationException authException) throws IOException {
            
            String requestUri = request.getRequestURI();
            String acceptHeader = request.getHeader("Accept");
            
            // Check if this is an API request
            boolean isApiRequest = requestUri.startsWith("/api/");
            
            // Check if client explicitly wants JSON
            boolean wantsJson = acceptHeader != null && 
                              (acceptHeader.contains(MediaType.APPLICATION_JSON_VALUE) ||
                               acceptHeader.contains("application/json"));
            
            // For API endpoints or JSON requests, return 401 instead of redirecting
            if (isApiRequest || wantsJson) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}");
            } else {
                // For browser requests, redirect to login page
                response.sendRedirect("/");
            }
        }
    }
}