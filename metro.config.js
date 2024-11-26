const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('otf', 'ttf'); // Assurez-vous d'ajouter les extensions de polices ici

module.exports = config;
