const { getDefaultConfig } = require('expo/metro-config');

/**
 * // METRO CONFIG (2026 Edition)
 * // Purpose: Fixes the 'node:sea' filename bug on Windows.
 * // Rule: Disables Node.js shim production for filesystems that do not support colons.
 */

const config = getDefaultConfig(__dirname);

// // Force Metro to enable package exports for Node 20+ / Web compatibility
// // Do not hardcode conditionNames, let Expo handle 'react-native' vs 'browser' automatically.
if (config.resolver) {
  config.resolver.unstable_enablePackageExports = true;
}

module.exports = config;
