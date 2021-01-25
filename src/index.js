#!/usr/bin/env node

/* --- NovaSheets ---
 * See cli.js for command-line usage
 * See novasheets.js for the main functions
 * See functions.js for built-in NovaSheets functions
 */

// Command-line usage
if (require.main === module) require('./cli')();

// Node usage
module.exports = require('./novasheets');
