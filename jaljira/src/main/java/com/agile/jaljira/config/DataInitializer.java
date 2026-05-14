package com.agile.jaljira.config;

import com.agile.jaljira.models.Type;
import com.agile.jaljira.repositories.TypeRepository;
import com.agile.jaljira.services.SprintTemplateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    private final SprintTemplateService sprintTemplateService;
    private final TypeRepository typeRepository;

    public DataInitializer(SprintTemplateService sprintTemplateService, TypeRepository typeRepository) {
        this.sprintTemplateService = sprintTemplateService;
        this.typeRepository = typeRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        logger.info("Starting data initialization...");
        
        // Initialize default sprint templates on application startup
        sprintTemplateService.initializeDefaultTemplates();
        
        // Initialize core task types
        initializeTaskTypes();
        
        logger.info("Data initialization complete");
    }
    
    private void initializeTaskTypes() {
        logger.info("Initializing task types...");
        
        // Define the 4 core task types
        String[] typeLabels = {"EPIC", "STORY", "TASK", "SUBTASK"};
        
        for (String label : typeLabels) {
            // Check if type already exists
            boolean exists = typeRepository.findAll()
                    .stream()
                    .anyMatch(type -> type.getLabel().equals(label));
            
            if (!exists) {
                Type newType = new Type(label);
                typeRepository.save(newType);
                logger.info("Created task type: {}", label);
            } else {
                logger.info("Task type already exists: {}", label);
            }
        }
        
        logger.info("Task types initialization complete");
    }
}
