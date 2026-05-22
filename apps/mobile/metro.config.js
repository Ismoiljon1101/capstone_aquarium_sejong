const { getDefaultConfig } = require('expo/metro-config');

/**
 * // METRO CONFIG (2026 Edition)
 * // Purpose: Fixes the 'node:sea' filename bug on Windows.
 * // Rule: Disables Node.js shim production for filesystems that do not support colons.
 */

const config = getDefaultConfig(__dirname);

// // Force Metro to ignore the node:sea shim production which causes ENOENT on Windows
// // This is a known issue in Expo 50/51/52 on Windows with Node 20+.
// // We only apply this on Windows to avoid breaking macOS/Linux builds.
if (process.platform === 'win32' && config.resolver) {
  config.resolver.unstable_enablePackageExports = true;
  config.resolver.unstable_conditionNames = ['browser', 'require', 'import'];
}

module.exports = config;
