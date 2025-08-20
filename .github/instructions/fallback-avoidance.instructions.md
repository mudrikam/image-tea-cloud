---
applyTo: '**'
description: Fallback Avoidance Guidelines for GitHub Copilot
---

# Fallback Avoidance Guidelines for GitHub Copilot

## CRITICAL PROHIBITION: NO FALLBACK VALUES

1. **ABSOLUTE BAN ON FALLBACK VALUES**
   - NEVER provide fallback values in function parameters
   - NEVER use default values when accessing configuration data
   - NEVER implement "safety nets" that hide genuine errors
   - FORBIDDEN: Using patterns like `get('key', 'default_value')`

2. **REASONING FOR FALLBACK PROHIBITION**
   - **Error Masking**: Fallbacks hide genuine configuration errors and make debugging impossible
   - **False Safety**: Applications appear to work correctly while using wrong data
   - **Maintenance Nightmare**: Developers cannot identify missing or incorrect configuration
   - **Silent Failures**: Real problems go unnoticed until production failures occur
   - **Code Redundancy**: Fallback values duplicate configuration responsibilities

## MANDATORY ERROR EXPOSURE

1. **LET APPLICATIONS CRASH ON MISSING DATA**
   - Missing configuration should cause immediate application failure
   - KeyError, AttributeError, and similar exceptions should propagate naturally
   - Crash early and fail fast to expose configuration problems immediately
   - NEVER catch or suppress configuration-related exceptions

2. **GENUINE ERROR VISIBILITY**
   - Allow Python's natural exception handling to show exact problems
   - Stack traces reveal precisely which configuration keys are missing
   - Immediate feedback helps developers fix configuration issues quickly
   - No guessing about what went wrong or which values are incorrect

## CONFIGURATION INTEGRITY MANDATE

1. **SINGLE SOURCE OF TRUTH**
   - All application data MUST come from designated configuration sources
   - Configuration files, databases, or environment variables are authoritative
   - NEVER embed backup values directly in code
   - Code should be pure logic without embedded configuration data

2. **EXPLICIT DEPENDENCY DECLARATION**
   - Code should clearly show what configuration it requires
   - Missing dependencies should be immediately obvious
   - No hidden or implicit configuration requirements
   - Dependencies should fail loudly when not satisfied

## MAINTAINABILITY REQUIREMENTS

1. **CLEAR ERROR MESSAGES**
   - When configuration is missing, the error should be crystal clear
   - Developers should immediately know which file, key, or value is missing
   - No ambiguity about what needs to be fixed
   - Error location should be precisely identified

2. **PREDICTABLE BEHAVIOR**
   - Application behavior should be entirely determined by configuration
   - No "surprise" fallback behavior that differs from documented configuration
   - What you configure is exactly what you get
   - No hidden defaults that change application behavior

## FORBIDDEN PATTERNS

1. **BANNED CODE PATTERNS**
   ```python
   # FORBIDDEN - hides missing configuration
   name = config.get('app.name', 'Default App')
   
   # FORBIDDEN - masks configuration errors
   try:
       value = config.get('required.setting')
   except KeyError:
       value = 'fallback_value'
   
   # FORBIDDEN - embedded default values
   def load_setting(key, default=None):
       return config.get(key, default)
   ```

2. **REQUIRED CODE PATTERNS**
   ```python
   # REQUIRED - explicit configuration dependency
   name = config.get('app.name')
   
   # REQUIRED - let errors propagate naturally
   value = config.get('required.setting')
   
   # REQUIRED - no default parameters for configuration
   def load_setting(key):
       return config.get(key)
   ```

## DEVELOPMENT WORKFLOW BENEFITS

1. **FASTER DEBUGGING**
   - Configuration problems are immediately visible
   - No time wasted tracking down "why is my app using wrong values"
   - Stack traces point directly to missing configuration
   - Developers fix root causes instead of symptoms

2. **RELIABLE DEPLOYMENTS**
   - Applications fail during startup if configuration is incomplete
   - No silent failures in production with wrong default values
   - Configuration validation happens automatically through normal operation
   - Deployment issues are caught immediately, not discovered later

3. **CLEANER CODE**
   - Code focuses on business logic, not configuration management
   - No scattered default values throughout the codebase
   - Configuration requirements are explicit and documented through usage
   - Easier to understand what configuration an application actually needs

## IMPLEMENTATION GUIDELINES

1. **CONFIGURATION ACCESS**
   - Always use direct configuration access without fallbacks
   - Let configuration managers throw exceptions for missing keys
   - Trust that configuration is complete and correct
   - Validate configuration completeness at application startup

2. **ERROR HANDLING**
   - Only catch and handle configuration errors at the application entry point
   - Log configuration errors clearly before application shutdown
   - Provide helpful error messages about which configuration is missing
   - Never suppress or work around configuration errors in business logic

## REMEMBER

Fallback values are a form of technical debt that:
- Make applications unreliable
- Hide configuration problems
- Create maintenance nightmares
- Prevent proper error diagnosis
- Lead to inconsistent behavior between environments

Better to crash early with a clear error than run incorrectly with hidden defaults.