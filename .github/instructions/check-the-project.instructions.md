---
description: Project Structure Scanning Guidelines for GitHub Copilot
applyTo: "**"
---

# Project Structure Scanning Guidelines

## SCAN BEFORE IMPLEMENTING

1. **MANDATORY: Scan All Files When Location Not Specified**
   - When user doesn't specify a target file, scan ALL project files first
   - Never assume which file a function belongs in without scanning
   - Look for logical connections between files before suggesting implementations
   - Identify existing patterns in the codebase before adding new code

2. **PRESERVE INTERCONNECTIONS**
   - Do not implement interconnected functionality as standalone code
   - Helper functions must go in appropriate helper files, not in main program
   - Utility functions belong in utility modules, not scattered across the codebase
   - Database-related code belongs in database files, not in UI files
   - Follow the existing architecture and module separation

## FILE LOCATION DETERMINATION RULES

1. **CHECK EXISTING PATTERNS**
   - Scan for similar functionality to determine where new code belongs
   - Look for existing modules that handle related tasks
   - Check how the codebase organizes functionality by category
   - Follow naming conventions and structural patterns found in the project

2. **RESPECT CODE ORGANIZATION**
   - Helper/utility functions must go in helper/utility files
   - Model definitions belong in model files
   - Controllers belong in controller files
   - Database operations belong in database files
   - UI components belong in UI files
   - Main program should contain minimal direct implementation

3. **WHEN IN DOUBT, ASK**
   - If file location is ambiguous, ask the user before implementing
   - Present clear options about possible locations for the implementation
   - Explain the reasoning for your location suggestions
   - Do not make assumptions about the "correct" location

## IMPLEMENTATION LOCATION PRIORITIES

1. **FIRST: EXISTING FILES WITH RELATED FUNCTIONALITY**
   - If a helper function exists for similar tasks, add new helper functions there
   - If database models exist, add new models to existing model files
   - If UI components exist, add new UI components to existing UI files

2. **SECOND: DEDICATED MODULE FILES**
   - Helper functions go in helper.py, utils.py, or similar dedicated files
   - Database code goes in db.py, database.py, models.py, or similar files
   - UI components go in ui.py, views.py, components.py, or similar files

3. **LAST RESORT: MAIN PROGRAM FILE**
   - Only implement in the main program file when:
     - The project is very small (1-3 files total)
     - The functionality is truly application-level logic
     - User specifically requests implementation in the main file
     - No appropriate module file exists and creating one wasn't requested

## PROHIBITED ASSUMPTIONS

1. **CRITICAL: NEVER ASSUME ISOLATION**
   - Do not assume new functionality stands alone
   - Do not create isolated implementations when they should connect to existing systems
   - Do not duplicate functionality that likely exists elsewhere in the project
   - Do not create redundant code when existing modules could be extended

2. **FORBIDDEN: RANDOM IMPLEMENTATION LOCATION**
   - Never arbitrarily choose implementation location
   - Never place helper functions in main program files
   - Never place database code in UI files
   - Never mix concerns across inappropriate modules