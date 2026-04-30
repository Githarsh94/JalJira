package com.agile.jaljira.services;

import com.agile.jaljira.models.User;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User getOrCreateUser(Map<String, Object> attributes) {
        String email = (String) attributes.get("email");

        logger.info("OAuth login attempt for email: {}", email);

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email not provided by OAuth provider");
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            logger.info("Existing user found for email: {}", email);
            return existingUser.get();
        }

        User newUser = new User();
        newUser.setEmail(email);

        // Google provides: given_name, family_name
        // GitHub provides: name (full name), login (username)
        String givenName = (String) attributes.get("given_name");
        String familyName = (String) attributes.get("family_name");
        String fullName = (String) attributes.get("name");

        if (givenName != null && familyName != null) {
            newUser.setFirstName(givenName);
            newUser.setLastName(familyName);
        } else if (fullName != null) {
            String[] parts = fullName.trim().split("\\s+", 2);
            newUser.setFirstName(parts[0]);
            newUser.setLastName(parts.length > 1 ? parts[1] : "");
        } else {
            newUser.setFirstName(email.split("@")[0]);
            newUser.setLastName("");
        }

        newUser.setRole(Role.ADMIN);

        logger.info("Creating new user: email={}, firstName={}, lastName={}",
                email, newUser.getFirstName(), newUser.getLastName());

        return userRepository.save(newUser);
    }
}
