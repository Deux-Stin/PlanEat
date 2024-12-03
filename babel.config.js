module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo', // Pour Expo
      // 'module:metro-react-native-babel-preset', // Compatible React Native
    ],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env', // Permet d'importer des variables depuis .env
        path: '.env',       // Chemin vers le fichier .env
        blocklist: null,    // Pas de variables exclues
        allowlist: null,    // Toutes les variables sont autorisées
        safe: false,        // Désactive le mode "safe"
        allowUndefined: true, // Permet des variables non définies
        verbose: false,     // Désactive les logs détaillés
      }],
    ],
  };
};
