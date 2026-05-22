const { getDefaultConfig } = require('expo/metro-config');

/**
 * // METRO CONFIG (2026 Edition)
 * // Purpose: Fixes the 'node:sea' filename bug on Windows.
 * // Rule: Disables Node.js shim production for filesystems that do not support colons.
 */

const config = getDefaultConfig(__dirname);

// // Force Metro to enable package exports for Node 20+ / Web compatibility ONLY on Windows
// // Doing this on macOS forces Metro to load Node.js CJS modules for react-native, causing white screens.
if (process.platform === 'win32' && config.resolver) {
  config.resolver.unstable_enablePackageExports = true;
}

module.exports = config;
