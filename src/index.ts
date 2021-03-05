#!/usr/bin/env node

// Command-line usage
if (require.main === module) require('./cli')();

// Node usage
export = require('./novasheets');
