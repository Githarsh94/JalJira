package com.agile.jaljira.config;

import com.agile.jaljira.services.SprintTemplateService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final SprintTemplateService sprintTemplateService;

    public DataInitializer(SprintTemplateService sprintTemplateService) {
        this.sprintTemplateService = sprintTemplateService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // Initialize default sprint templates on application startup
        sprintTemplateService.initializeDefaultTemplates();
    }
}
