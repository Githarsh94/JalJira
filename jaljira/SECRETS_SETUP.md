# Secrets Configuration Guide

## Overview
This project uses a separate `application-secrets.yml` file to store sensitive configuration data like database credentials and OAuth client secrets. This file is **excluded from git** for security.

## Setup Instructions

### 1. Create Your Secrets File
Copy the example file and fill in your actual credentials:

```bash
cd jaljira/src/main/resources/
cp application-secrets.yml.example application-secrets.yml
```

### 2. Edit application-secrets.yml
Open `application-secrets.yml` and replace the placeholder values with your actual credentials:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://your-actual-database-host:5432/postgres
    username: your-actual-username
    password: your-actual-password

  security:
    oauth2:
      client:
        registration:
          google:
            client-id: your-actual-google-client-id
            client-secret: your-actual-google-client-secret
          github:
            client-id: your-actual-github-client-id
            client-secret: your-actual-github-client-secret
```

### 3. Alternative: Use Environment Variables
Instead of using `application-secrets.yml`, you can also set environment variables:

```bash
export DB_URL="jdbc:postgresql://your-host:5432/postgres"
export DB_USERNAME="your-username"
export DB_PASSWORD="your-password"
export DB_DRIVER="org.postgresql.Driver"
export GOOGLE_CLIENT_ID="your-google-client-id"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
export GITHUB_CLIENT_ID="your-github-client-id"
export GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 4. Default Development Mode
If no secrets file or environment variables are provided, the application will default to using an in-memory H2 database for local development.

## Files Structure

- `application.yml` - Main configuration (safe to commit to git)
- `application-secrets.yml` - **Your actual secrets (DO NOT COMMIT)**
- `application-secrets.yml.example` - Example template (safe to commit)

## Security Notes

✅ **Safe to commit:**
- `application.yml` (contains no secrets)
- `application-secrets.yml.example` (contains only placeholders)

❌ **NEVER commit:**
- `application-secrets.yml` (contains real credentials)

The `.gitignore` file is configured to automatically exclude `application-secrets.yml` from version control.

## Team Setup

When new team members clone the repository:
1. They copy `application-secrets.yml.example` to `application-secrets.yml`
2. They obtain credentials from the team lead or credential manager
3. They fill in their local `application-secrets.yml` file
4. The application runs with their local secrets
