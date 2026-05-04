package com.agile.jaljira.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.invitation.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${app.email.from:noreply@jaljira.com}")
    private String fromEmail;

    @Value("${app.email.from-name:Jaljira Team}")
    private String fromName;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private String mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        logger.info("EmailService initialized with mail config: host={}, port={}, username={}", 
            mailHost, mailPort, mailUsername);
    }

    /**
     * Send manager invitation email
     * @param managerEmail Email address of the manager
     * @param managerName Name of the manager (optional)
     * @param teamName Name of the team they're assigned to
     * @param organizationName Name of the organization
     */
    public void sendManagerInvitation(String managerEmail, String managerName, String teamName, String organizationName) {
        String loginUrl = baseUrl + "/auth?manager_invite=true";
        String subject = "You're invited to manage a team at " + organizationName;
        
        String htmlBody = buildInvitationEmailBody(managerName, teamName, organizationName, loginUrl);

        try {
            logger.info("========== EMAIL SENDING ATTEMPT ==========");
            logger.info("To: {}", managerEmail);
            logger.info("From: {} <{}>", fromName, fromEmail);
            logger.info("Subject: {}", subject);
            logger.info("Mail Server: {}:{} (auth user: {})", mailHost, mailPort, mailUsername);
            logger.info("Sending HTML email...");
            
            sendHtmlEmail(managerEmail, subject, htmlBody);
            
            logger.info("========== EMAIL SENT SUCCESSFULLY ==========");
            logger.info("Manager invitation email sent to: {} for team: {} in org: {}", 
                managerEmail, teamName, organizationName);
        } catch (MessagingException e) {
            logger.error("========== EMAIL FAILED - MESSAGING ERROR ==========");
            logger.error("To: {}", managerEmail);
            logger.error("Error: {}", e.getMessage());
            logger.error("Error Details:", e);
        } catch (UnsupportedEncodingException e) {
            logger.error("========== EMAIL FAILED - ENCODING ERROR ==========");
            logger.error("To: {}", managerEmail);
            logger.error("Error: {}", e.getMessage());
            logger.error("Error Details:", e);
        } catch (Exception e) {
            logger.error("========== EMAIL FAILED - UNKNOWN ERROR ==========");
            logger.error("To: {}", managerEmail);
            logger.error("Error: {}", e.getMessage());
            logger.error("Error Details:", e);
        }
    }

    /**
     * Send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException, UnsupportedEncodingException {
        logger.info("Creating MIME message...");
        MimeMessage message = mailSender.createMimeMessage();
        logger.info("Message created, setting up helper...");
        
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        logger.info("Setting from: {} {}", fromEmail, fromName);
        helper.setFrom(fromEmail, fromName);
        
        logger.info("Setting to: {}", to);
        helper.setTo(to);
        
        logger.info("Setting subject: {}", subject);
        helper.setSubject(subject);
        
        logger.info("Setting text content (HTML: true)...");
        helper.setText(htmlContent, true);  // true = isHtml
        
        logger.info("Sending message via JavaMailSender...");
        mailSender.send(message);
        logger.info("Message sent successfully!");
    }

    private String buildInvitationEmailBody(String managerName, String teamName, String organizationName, String loginUrl) {
        String name = managerName != null && !managerName.isEmpty() ? managerName : "Manager";
        
        return String.format(
            "<!DOCTYPE html>" +
            "<html style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\">" +
            "<head>" +
            "  <meta charset=\"UTF-8\">" +
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
            "</head>" +
            "<body style=\"margin: 0; padding: 0; background-color: #f7f7f7;\">" +
            "  <div style=\"max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;\">" +
            "    <!-- Header -->" +
            "    <div style=\"background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px 20px; text-align: center;\">" +
            "      <h1 style=\"margin: 0; color: white; font-size: 24px; font-weight: 600;\">⚡ Jaljira</h1>" +
            "      <p style=\"margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;\">Agile Project Management</p>" +
            "    </div>" +
            "    <!-- Content -->" +
            "    <div style=\"padding: 40px 30px;\">" +
            "      <h2 style=\"margin: 0 0 20px 0; color: #333; font-size: 20px; font-weight: 600;\">Welcome to Jaljira!</h2>" +
            "      <p style=\"margin: 0 0 15px 0; color: #666; line-height: 1.6; font-size: 15px;\">Hello %s,</p>" +
            "      <p style=\"margin: 0 0 15px 0; color: #666; line-height: 1.6; font-size: 15px;\">You have been invited to manage the team <strong style=\"color: #333;\">%s</strong> in the organization <strong style=\"color: #333;\">%s</strong>.</p>" +
            "      <p style=\"margin: 0 0 30px 0; color: #666; line-height: 1.6; font-size: 15px;\">Click the button below to log in and start managing your team:</p>" +
            "      <!-- CTA Button -->" +
            "      <div style=\"text-align: center; margin-bottom: 30px;\">" +
            "        <a href=\"%s\" style=\"display: inline-block; background-color: #667eea; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.3s;\" onmouseover=\"this.style.backgroundColor='#764ba2';\" onmouseout=\"this.style.backgroundColor='#667eea';\">Log In to Jaljira</a>" +
            "      </div>" +
            "      <p style=\"margin: 0 0 15px 0; color: #999; font-size: 13px; line-height: 1.6;\"><strong>Don't know what this is?</strong> You were invited by your organization administrator to join Jaljira, an agile project management platform.</p>" +
            "      <p style=\"margin: 0; color: #999; font-size: 13px; line-height: 1.6;\"><strong>Questions?</strong> Contact your organization administrator for more information.</p>" +
            "    </div>" +
            "    <!-- Footer -->" +
            "    <div style=\"background-color: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee; text-align: center;\">" +
            "      <p style=\"margin: 0; color: #999; font-size: 12px;\">© 2026 Jaljira. All rights reserved.</p>" +
            "      <p style=\"margin: 5px 0 0 0; color: #bbb; font-size: 11px;\">This is an automated email, please do not reply.</p>" +
            "    </div>" +
            "  </div>" +
            "</body>" +
            "</html>",
            name, teamName, organizationName, loginUrl
        );
    }
}

