const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// --- Watch monorepo root ---
config.watchFolders = [monorepoRoot]

// --- Mobile app node_modules takes priority over root node_modules ---
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// --- Prevent Metro from walking up to root node_modules first ---
config.resolver.disableHierarchicalLookup = true

module.exports = config
