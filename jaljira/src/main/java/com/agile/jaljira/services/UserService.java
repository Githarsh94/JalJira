package com.agile.jaljira.services;

import com.agile.jaljira.models.User;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public User getOrCreateUser(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        
        logger.info("OAuth login attempt for email: {}", email);
        logger.debug("OAuth2User attributes: {}", oauth2User.getAttributes());
        
        if (email == null || email.isEmpty()) {
            logger.error("Email is null or empty in OAuth2User attributes");
            throw new IllegalArgumentException("Email not provided by OAuth provider");
        }
        
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            logger.info("Existing user found for email: {}", email);
            return existingUser.get();
        }
        
        // Create new user with MEMBER role by default
        User newUser = new User();
        newUser.setEmail(email);
        
        // Handle different OAuth providers
        // Google provides: given_name, family_name
        // GitHub provides: name (full name), login (username)
        String givenName = oauth2User.getAttribute("given_name");
        String familyName = oauth2User.getAttribute("family_name");
        String fullName = oauth2User.getAttribute("name");
        
        if (givenName != null && familyName != null) {
            // Google-style attributes
            newUser.setFirstName(givenName);
            newUser.setLastName(familyName);
            logger.info("Using given_name and family_name from OAuth provider");
        } else if (fullName != null) {
            // GitHub-style attributes - split the full name
            String[] nameParts = fullName.trim().split("\\s+", 2);
            newUser.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                newUser.setLastName(nameParts[1]);
            } else {
                newUser.setLastName(""); // Default to empty if no last name
            }
            logger.info("Parsed name from 'name' attribute: {} {}", newUser.getFirstName(), newUser.getLastName());
        } else {
            // Fallback - use email username as first name
            String emailUsername = email.split("@")[0];
            newUser.setFirstName(emailUsername);
            newUser.setLastName("");
            logger.warn("No name attributes found, using email username: {}", emailUsername);
        }
        
        newUser.setRole(Role.MEMBER);
        
        logger.info("Creating new user: email={}, firstName={}, lastName={}, role={}", 
                    email, newUser.getFirstName(), newUser.getLastName(), newUser.getRole());
        
        User savedUser = userRepository.save(newUser);
        logger.info("User saved successfully with ID: {}", savedUser.getId());
        
        return savedUser;
    }
    
    @Transactional
    public User updateUserRole(String email, Role newRole, User requestedBy) {
        // Only admins can change roles
        if (requestedBy.getRole() != Role.ADMIN) {
            throw new SecurityException("Only admins can change user roles");
        }
        
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setRole(newRole);
        return userRepository.save(user);
    }
}
