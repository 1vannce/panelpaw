// Keep Metro from crawling the separate landing site (site/ has its own node_modules and React).
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const siteDir = path.join(__dirname, 'site').split(path.sep).map(escape).join('[\\\\/]');
config.resolver.blockList = [new RegExp(`^${siteDir}[\\\\/].*`)];

module.exports = config;
