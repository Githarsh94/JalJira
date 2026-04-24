# JalJira - Agile Project Management System

[![Java](https://img.shields.io/badge/Java-21-blue.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue.svg)](https://supabase.com/)
[![Maven](https://img.shields.io/badge/Maven-4.0.0-red.svg)](https://maven.apache.org/)
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow.svg)]()

**JalJira** is a Jira-like agile project management system built with Spring Boot and PostgreSQL. This project is currently in the **initial development phase** with database models and configuration complete.

---
# Set up Instructions for this Project
1.Add application-secrets.yml file into jaljira/src/resources which will have information like this:
spring:
  datasource:
    url: <supabase-url>
    username: <supabase-username>
    password: <supabase-passwd>
    driver-class-name: org.postgresql.Driver

app:
  oauth2:
    google:
      client-id: <google-auth-provider-client-id>
      client-secret: <google-auth-provider-client-secret>
    github:
      client-id: <github-auth-provider-client-id>
      client-secret: <github-auth-provider-client-secret>
      
2.Create .env file in jaljira/
# Supabase Database Configuration
# Get these values from your Supabase project settings > Database

# Database Host (Connection Pooler - found in Database Settings > Connection String)
SUPABASE_DB_HOST=<supabase-db-host>

# Database Port (6543 for pooler, 5432 for direct connection)
SUPABASE_DB_PORT=<supabase-port>

# Database Name (usually postgres)
SUPABASE_DB_NAME=<supabase-db_name>

# Database User (format: postgres.YOUR_PROJECT_ID for pooler)
SUPABASE_DB_USER=<supabase-username>

# Database Password (found in Database Settings > Database password)
SUPABASE_DB_PASSWORD=<supabase-passwd>

3.Create .env.local file into jaljira-frontend/
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# OAuth2 Client IDs (public — safe to expose in frontend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-auth-provider-client-id>
NEXT_PUBLIC_GITHUB_CLIENT_ID=<google-auth-provider-client-secret>

# OAuth2 Redirect URI (must match Google/GitHub console settings)
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

## 📋 Table of Contents

- [Current Status](#-current-status)
- [Planned Features](#-planned-features)
- [Architecture](#-architecture)
- [Database Design](#-database-design)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Data Models](#-data-models)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## ✅ Current Status

### Implemented
- ✅ **Database Schema Design** - Complete entity-relationship model
- ✅ **JPA Entity Models** - All core domain models (User, Team, Sprint, Task, etc.)
- ✅ **Database Configuration** - Supabase PostgreSQL connection setup
- ✅ **Materialized Path Pattern** - Task hierarchy support
- ✅ **Maven Project Structure** - Spring Boot 4.0.1 with dependencies

### In Development
- 🔄 **Repository Layer** - JPA repositories for data access
- 🔄 **Service Layer** - Business logic implementation
- 🔄 **REST Controllers** - API endpoints
- 🔄 **Authentication** - User authentication and authorization

---

## 🎯 Planned Features

Once the backend infrastructure is complete, JalJira will support:

1. **Team Management** - Multiple teams with role-based access control (QA, Dev, Manager)
2. **Task States** - Draft, Ready, WIP, RFT, Complete, Duplicate, Backlog, Dependent
3. **Hierarchical Tasks** - Epics → Stories → Tasks → Subtasks (unlimited depth)
4. **Sprint Management** - Sprint tracking with auto-creation
5. **Story Points & Dependencies** - Estimation and blocker tracking
6. **GitHub Integration** - Repository linking via unique Task IDs
7. **Sprint Reports** - End-of-sprint report generation
8. **Bug Tracking** - Bug reporting with time allocation
9. **Dependency Routing** - Auto-assignment when dependencies arise
10. **Email Notifications** - Manager alerts for dependencies

---

## 🏗️ Architecture

### Design Principles

JalJira follows enterprise-grade architectural patterns:

- **Layered Architecture**: Separation of concerns (Controller → Service → Repository → Entity)
- **RESTful API Design**: Stateless, resource-oriented endpoints
- **Domain-Driven Design**: Rich domain models with business logic encapsulation
- **Materialized Path Pattern**: Efficient hierarchical data retrieval
- **ACID Compliance**: Strong consistency guarantees via PostgreSQL

### Why SQL over NoSQL?

JalJira uses **PostgreSQL** for several critical reasons:

1. **Relational Integrity**: Complex many-to-many relationships (tasks ↔ sprints, users ↔ teams)
2. **Self-Referencing**: Task hierarchies with parent-child relationships
3. **Business Logic Enforcement**: ENUMs, constraints, and triggers at database level
4. **Analytics-First**: Native aggregation functions for reporting without ETL
5. **ACID Guarantees**: State transitions require strong consistency
6. **Cross-Entity Queries**: Complex JOINs across multiple entities
7. **Auditability**: Transaction logs for compliance and debugging

---

## 🗄️ Database Design

### Schema Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    USERS    │       │    TEAMS    │       │   SPRINTS   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (UUID)   │──────▶│ id (UUID)   │◀──────│ id (UUID)   │
│ first_name  │       │ team_name   │       │ start       │
│ last_name   │       └─────────────┘       │ end         │
│ email       │                             └─────────────┘
│ phone       │                                     │
│ address     │                                     │
│ team_id     │                                     │
└─────────────┘                                     │
       │                                           │
       │         ┌─────────────────────────────────┘
       │         │
       │         │       ┌─────────────┐       ┌─────────────┐
       │         │       │    TYPES    │       │TASK_STATUS  │
       │         │       ├─────────────┤       ├─────────────┤
       │         │       │ id (UUID)   │       │ id (UUID)   │
       │         │       │ label       │       │ status_type │
       │         │       └─────────────┘       └─────────────┘
       │         │              │                      │
       │         │              │                      │
       │         │              │                      │
       │         ▼              ▼                      ▼
       │    ┌───────────────────────────────────────────────┐
       │    │                   TASKS                       │
       │    ├───────────────────────────────────────────────┤
       └───▶│ id (UUID)                                     │
            │ parent_id (UUID) ──┐                          │
            │ path (TEXT)        │  ← Materialized Path     │
            │ depth (INT)        │    for hierarchy         │
            │ user_id (FK)       │                          │
            │ sprint_id (FK)     │                          │
            │ team_id (FK)       │                          │
            │ type_id (FK)       │                          │
            │ status_id (FK)     │                          │
            │ title              │                          │
            │ description        │                          │
            │ priority (ENUM)    │                          │
            │ story_points       │                          │
            │ metadata (JSONB)   │                          │
            │ created_at         │                          │
            └────────────────────┘                          │
                      │                                      │
                      └──────────────────────────────────────┘
                         (Self-referencing hierarchy)
```

### Materialized Path Pattern

JalJira uses the **Materialized Path** approach for task hierarchies:

```sql
-- Example hierarchy:
EPIC-001 (path: '0001')
  └─ STORY-001 (path: '0001.0001')
      ├─ TASK-001 (path: '0001.0001.0001')
      │   └─ SUBTASK-001 (path: '0001.0001.0001.0001')
      └─ TASK-002 (path: '0001.0001.0002')

-- Fast subtree query:
SELECT * FROM tasks WHERE path LIKE '0001.0001.%';
```

**Advantages:**
- ✅ Extremely fast subtree queries (no recursion)
- ✅ Simple SQL without CTEs
- ✅ Easy depth calculation
- ✅ Efficient ordering
- ✅ Scales well for typical depths (< 10 levels)

---

## 🛠️ Tech Stack

### Backend
- **Java 21** - Latest LTS version
- **Spring Boot 4.0.1** - Web framework
- **Spring Data JPA** - ORM and data access
- **Hibernate** - JPA implementation
- **PostgreSQL** - Primary database
- **Maven** - Dependency management

### Database
- **Supabase PostgreSQL** - Managed database service
- **Transaction Pooler** - IPv4-compatible connection pooling
- **HikariCP** - High-performance JDBC connection pool

### Planned Integrations
- **GitHub API** - Repository linking
- **Email Service** - Notification system
- **WebSocket** - Real-time updates

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Java Development Kit (JDK) 21+**
  ```bash
  java -version  # Should show version 21 or higher
  ```

- **Maven 3.8+**
  ```bash
  mvn -version
  ```

- **PostgreSQL Client** (optional, for database inspection)
  ```bash
  psql --version
  ```

- **Supabase Account** (already configured)
  - Project URL: `aws-1-ap-southeast-1.pooler.supabase.com`
  - Database: `postgres`

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd jaljira
```

### 2. Install Dependencies

```bash
mvn clean install
```

### 3. Database Setup

The application uses **Supabase PostgreSQL** with automatic schema creation via Hibernate DDL.

**Database Connection Details:**
- **Host**: `your-host-name`
- **Port**: `6543` (Transaction Pooler)
- **Database**: `postgres`
- **Username**: `your-username`
- **Password**: `your-passwd`

**Important Notes:**
- ✅ Use **Transaction Pooler** (IPv4 compatible)
- ❌ Do NOT use **Direct Connection** (IPv6 only)
- ✅ Connection type: **JDBC**
- ✅ SSL Mode: **required**
- ✅ `prepareThreshold=0` (prevents prepared statement issues)


### 4. Run the Application

```bash
# Using Maven
mvn spring-boot:run

# Or using Maven Wrapper (Linux/Mac)
./mvnw spring-boot:run

# Or using Maven Wrapper (Windows)
mvnw.cmd spring-boot:run
```

The application will start on `http://localhost:8080`

> **Note**: Currently, the application only initializes the database schema. API endpoints are not yet implemented.

---

## ⚙️ Configuration

### Database Connection Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `sslmode` | `require` | Enforce SSL/TLS encryption |
| `prepareThreshold` | `0` | Disable prepared statements (Supabase compatibility) |
| `maximum-pool-size` | `10` | Max concurrent connections |
| `minimum-idle` | `5` | Minimum idle connections |
| `connection-timeout` | `30000ms` | Connection acquisition timeout |

### Hibernate DDL Modes

```properties
# Development (auto-create/update schema)
spring.jpa.hibernate.ddl-auto=update

# Production (validate only, no auto-changes)
spring.jpa.hibernate.ddl-auto=validate

# Fresh start (drop and recreate)
spring.jpa.hibernate.ddl-auto=create-drop
```

---

## 📊 Data Models

### User
```java
{
  id: UUID
  firstName: String
  lastName: String
  email: String (unique, required)
  phone: String
  address: String
  team: Team (many-to-one)
}
```

### Team
```java
{
  id: UUID
  teamName: String (required)
}
```

### Sprint
```java
{
  id: UUID
  start: LocalDateTime
  end: LocalDateTime
}
```

### Task
```java
{
  id: UUID
  parentId: UUID (self-referencing)
  path: String (materialized path)
  depth: Integer
  user: User (many-to-one)
  sprint: Sprint (many-to-one)
  team: Team (many-to-one)
  type: Type (many-to-one)
  status: TaskStatus (many-to-one)
  title: String
  description: String (text)
  priority: Priority (enum)
  storyPoints: Integer
  metadata: JSONB
  createdAt: LocalDateTime
}
```

### TaskStatus
```java
{
  id: UUID
  statusType: String (Draft, Ready, WIP, RFT, Complete, Duplicate, Backlog, Dependent)
}
```

### Type
```java
{
  id: UUID
  label: String (Epic, Story, Task, Bug, Feature, Custom)
}
```

### Priority (Enum)
```java
VERY_HIGH, HIGH, MEDIUM, LOW
```

---

## 📁 Project Structure

```
jaljira/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/agile/jaljira/
│   │   │       ├── JaljiraApplication.java
│   │   │       ├── controllers/
│   │   │       │   ├── UserController.java (planned)
│   │   │       │   ├── TeamController.java (planned)
│   │   │       │   ├── SprintController.java (planned)
│   │   │       │   └── TaskController.java (planned)
│   │   │       ├── services/
│   │   │       │   ├── UserService.java (planned)
│   │   │       │   ├── TeamService.java (planned)
│   │   │       │   ├── SprintService.java (planned)
│   │   │       │   └── TaskService.java (planned)
│   │   │       ├── repositories/
│   │   │       │   ├── UserRepository.java (planned)
│   │   │       │   ├── TeamRepository.java (planned)
│   │   │       │   ├── SprintRepository.java (planned)
│   │   │       │   └── TaskRepository.java (planned)
│   │   │       └── models/
│   │   │           ├── User.java ✅
│   │   │           ├── Team.java ✅
│   │   │           ├── Sprint.java ✅
│   │   │           ├── Task.java ✅
│   │   │           ├── TaskStatus.java ✅
│   │   │           ├── Type.java ✅
│   │   │           └── Priority.java ✅
│   │   └── resources/
│   │       └── application.properties ✅
│   └── test/
│       └── java/
│           └── com/agile/jaljira/
│               └── JaljiraApplicationTests.java
├── target/
├── pom.xml ✅
├── mvnw
├── mvnw.cmd
└── README.md ✅
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style
- Follow Java naming conventions
- Use meaningful variable names
- Add Javadoc comments for public methods
- Write unit tests for new features

---

## 📖 References

### Database Design Resources
- [Storing Hierarchical Data in Relational Databases](https://medium.com/@rishabhdevmanu/from-trees-to-tables-storing-hierarchical-data-in-relational-databases-a5e5e6e1bd64)
- [ER Diagram](https://app.eraser.io/workspace/Ycg6O69pZbCPP0uEyXLC)

### Spring Boot Documentation
- [Spring Data JPA](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)

### Supabase
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

## 📄 License

Project licensing has not yet been finalized. A LICENSE file with the full terms will be added before the first stable release.

---

## 👥 Team

**JalJira Development Team**

For questions or support, please contact the development team.

---

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- Supabase for managed PostgreSQL hosting
- The Jira product for inspiration
- Open source community for valuable resources

---

**Built with ❤️ using Java & Spring Boot**
