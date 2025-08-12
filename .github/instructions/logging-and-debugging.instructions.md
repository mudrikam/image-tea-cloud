---
applyTo: '**'
description: Logging and Debugging Guidelines for GitHub Copilot
---

# Logging and Debugging Guidelines for GitHub Copilot

## CRITICAL PROHIBITION: NO GUI DEBUG OUTPUT

1. **ABSOLUTE BAN ON GUI DEBUG MESSAGES**
   - NEVER send debug messages to dialog boxes
   - NEVER display debug information in status bars
   - NEVER show debug output in message boxes or tooltips
   - FORBIDDEN: Any debug output that appears in the user interface

2. **CONSOLE-ONLY DEBUG OUTPUT MANDATE**
   - ALL debug messages MUST go to console/terminal output
   - Use `print()` statements for debug information
   - Use Python's `logging` module for structured debugging
   - Debug information should be visible in terminal where application was launched

## REASONING FOR CONSOLE-ONLY DEBUGGING

1. **DEVELOPER ACCESSIBILITY**
   - Developers run applications from terminals and expect debug output there
   - Console output can be easily redirected to files for analysis
   - Terminal output doesn't interfere with application user interface
   - Console debugging allows real-time monitoring during development

2. **NON-INTRUSIVE DEBUGGING**
   - GUI debug messages disrupt user experience testing
   - Dialog boxes and status bar messages interfere with normal application flow
   - Console output can be ignored by end users but accessed by developers
   - Debug information doesn't pollute the visual interface

3. **PROBLEM SOLVING EFFICIENCY**
   - Console output can be copied, searched, and analyzed easily
   - Multiple debug messages can be viewed simultaneously in terminal
   - Debug logs can be timestamped and structured for better analysis
   - Terminal output integrates with developer tools and IDEs

## MANDATORY DEBUG OUTPUT LOCATIONS

1. **STANDARD OUTPUT (STDOUT)**
   ```python
   # REQUIRED - debug to console
   print(f"Debug: Variable value is {variable}")
   print(f"Debug: Function called with parameters: {params}")
   
   # REQUIRED - using logging module
   import logging
   logging.debug("Debug information here")
   logging.info("Informational message")
   logging.warning("Warning message")
   logging.error("Error message")
   ```

2. **TERMINAL/CONSOLE VISIBILITY**
   - Debug messages must be visible when application runs from command line
   - Use `python main.py` and see debug output in same terminal
   - Debug information should not require special tools to view
   - Output should be immediate and real-time during application execution

## FORBIDDEN DEBUG OUTPUT LOCATIONS

1. **BANNED GUI DEBUG PATTERNS**
   ```python
   # FORBIDDEN - debug in dialog boxes
   QMessageBox.information(self, "Debug", f"Value: {variable}")
   
   # FORBIDDEN - debug in status bar
   self.statusbar.showMessage(f"Debug: {debug_info}")
   
   # FORBIDDEN - debug in tooltips
   widget.setToolTip(f"Debug info: {data}")
   
   # FORBIDDEN - debug in window title
   self.setWindowTitle(f"App - Debug: {state}")
   
   # FORBIDDEN - debug in labels or text widgets
   self.debug_label.setText(f"Debug: {information}")
   ```

2. **USER INTERFACE POLLUTION**
   - Debug information should never appear in production-like UI elements
   - Temporary debugging should not modify visual components
   - Debug output should not affect application layout or appearance
   - End users should never see debug information in normal usage

## STRUCTURED LOGGING REQUIREMENTS

1. **PROPER LOGGING IMPLEMENTATION**
   ```python
   import logging
   
   # REQUIRED - configure logging to console
   logging.basicConfig(level=logging.DEBUG, 
                      format='%(asctime)s - %(levelname)s - %(message)s')
   
   # REQUIRED - use appropriate log levels
   logging.debug("Detailed debug information")
   logging.info("General information")
   logging.warning("Warning about potential issues")
   logging.error("Error that occurred")
   logging.critical("Critical error that may stop application")
   ```

2. **DEBUG INFORMATION CONTENT**
   - Include variable names and values
   - Show function entry and exit points
   - Display configuration values being used
   - Log error conditions and exception details
   - Timestamp all debug messages for chronological analysis

## DEBUGGING WORKFLOW BENEFITS

1. **DEVELOPER EXPERIENCE**
   - Debug output visible immediately in development environment
   - Can run application with `python main.py` and see all debug information
   - Terminal output can be redirected to files: `python main.py > debug.log`
   - Debug information doesn't interfere with UI testing and interaction

2. **PRODUCTION CONSIDERATIONS**
   - Console debug output can be easily disabled for production builds
   - No cleanup required to remove GUI debug elements
   - Debug logging can be controlled through configuration
   - Terminal output doesn't affect end-user experience

3. **COLLABORATION AND SUPPORT**
   - Debug output can be easily shared with other developers
   - Console logs can be attached to bug reports
   - Debug information format is standardized and readable
   - Terminal output works consistently across different platforms

## IMPLEMENTATION GUIDELINES

1. **DEBUG MESSAGE PLACEMENT**
   - Add debug prints at function entry points
   - Log important variable values and state changes
   - Show configuration loading and validation
   - Display error conditions and recovery attempts

2. **DEBUG OUTPUT FORMAT**
   - Use consistent formatting for debug messages
   - Include context information (function name, operation being performed)
   - Make debug output searchable and filterable
   - Use appropriate log levels for different types of information

## REMEMBER

GUI debug output creates problems:
- Interferes with user interface testing
- Makes debug information hard to collect and analyze
- Pollutes the visual design with temporary information
- Disrupts normal application workflow
- Makes it difficult to share debug information with other developers

Console debugging provides solutions:
- Non-intrusive development debugging
- Easy collection and analysis of debug information
- Professional debugging workflow
- Seamless integration with development tools
- Clear separation between debug information and user interface