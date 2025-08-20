---
description: Database development guidelines for GitHub Copilot
applyTo: "**"
---

# Database Development Guidelines for GitHub Copilot

## Database Design Completeness

## Database Design Completeness

1. **REQUIREMENT: Complete Schema Design From Start**
    - All database schemas must be designed as complete and production-ready
    - When adding fields, assume they should have been included in the initial design
    - Avoid incremental schema development approaches
    - Design with complete requirements in mind, not partial implementations

## Database Migration Restrictions

1. **PROHIBITION: No Database Migration Code Generation**
    - Do not generate database migration code or scripts
    - Do not create migration utilities or functions
    - Do not suggest command-line tools for database migration
    - Do not provide migration framework integration code

2. **Permitted Database Activities**
    - Schema design and entity relationship diagrams
    - Query optimization and performance suggestions
    - Static SQL queries for data retrieval and manipulation
    - Database connection configuration (without migrations)
    - Indexing and optimization strategies

3. **Reasoning**
    - Database migrations often break functionality during early development stages
    - Incremental field additions are common in early development phases
    - Database structure evolves gradually as requirements become clearer
    - Migration tools add unnecessary complexity when starting from scratch
    - Direct schema modifications are more efficient during initial development
    - If migration patterns are implemented too early, developers become trapped in unnecessary complexity