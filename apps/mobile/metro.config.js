const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname

const config = getDefaultConfig(projectRoot)

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
]

// --- Do NOT set disableHierarchicalLookup ---
// React Native internal packages need hierarchical resolution
// to find @react-native/* sub-packages within react-native itself

module.exports = config
