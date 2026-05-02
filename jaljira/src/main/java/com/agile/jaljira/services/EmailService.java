package com.agile.jaljira.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.invitation.base-url:http://localhost:3000}")
    private String baseUrl;

    /**
     * Send manager invitation email
     * @param managerEmail Email address of the manager
     * @param managerName Name of the manager (optional)
     * @param teamName Name of the team they're assigned to
     * @param organizationName Name of the organization
     */
    public void sendManagerInvitation(String managerEmail, String managerName, String teamName, String organizationName) {
        String loginUrl = baseUrl + "/auth";
        String subject = "You're invited to manage a team at " + organizationName;
        
        String htmlBody = buildInvitationEmailBody(managerName, teamName, organizationName, loginUrl);

        logger.info("Sending manager invitation email to: {} for team: {} in org: {}", 
            managerEmail, teamName, organizationName);
        
        // Log email content (for debugging/testing)
        logger.debug("Email Subject: {}", subject);
        logger.debug("Email Body: {}", htmlBody);
        
        // TODO: Implement actual email sending using:
        // - Spring JavaMailSender with SMTP
        // - SendGrid API
        // - Brevo (Sendinblue) API
        // For now, we just log it
    }

    private String buildInvitationEmailBody(String managerName, String teamName, String organizationName, String loginUrl) {
        String name = managerName != null && !managerName.isEmpty() ? managerName : "Manager";
        
        return String.format(
            "<html>" +
            "<body style=\"font-family: Arial, sans-serif;\">" +
            "<h2>Welcome to Jaljira!</h2>" +
            "<p>Hello %s,</p>" +
            "<p>You have been invited to manage the team <strong>%s</strong> in the organization <strong>%s</strong>.</p>" +
            "<p>Click the link below to log in and complete your setup:</p>" +
            "<p><a href=\"%s\" style=\"background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;\">Log In to Jaljira</a></p>" +
            "<p>If you have any questions, please contact your organization administrator.</p>" +
            "<p>Best regards,<br/>Jaljira Team</p>" +
            "</body>" +
            "</html>",
            name, teamName, organizationName, loginUrl
        );
    }
}
