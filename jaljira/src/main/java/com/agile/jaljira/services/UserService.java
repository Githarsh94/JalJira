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
        User user = existingUser.orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setRole(Role.ADMIN);
            logger.info("Creating new user for email: {}", email);
            return newUser;
        });

        // Update name if missing (for both new and invited users without names)
        if (user.getFirstName() == null || user.getFirstName().isBlank()) {
            String givenName = (String) attributes.get("given_name");
            String familyName = (String) attributes.get("family_name");
            String fullName = (String) attributes.get("name");

            if (givenName != null && familyName != null) {
                user.setFirstName(givenName);
                user.setLastName(familyName);
            } else if (fullName != null) {
                String[] parts = fullName.trim().split("\\s+", 2);
                user.setFirstName(parts[0]);
                user.setLastName(parts.length > 1 ? parts[1] : "");
            } else {
                user.setFirstName(email.split("@")[0]);
                user.setLastName("");
            }

            logger.info("Updated user name: email={}, firstName={}, lastName={}", 
                    email, user.getFirstName(), user.getLastName());
        }

        return userRepository.save(user);
    }
}
