package com.agile.jaljira.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/", "/home", "/index.html", "/oauth2/**", "/login/**", "/static/**", "/*.css", "/*.js").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/")
                .defaultSuccessUrl("/dashboard", true)
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
            );
        return http.build();
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