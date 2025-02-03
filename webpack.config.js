const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['expo-router']
    }
  }, argv);

  // Add resolve.alias for expo-router
  config.resolve.alias = {
    ...config.resolve.alias,
    'expo-router': path.resolve(__dirname, 'node_modules/expo-router'),
  };

  // Only apply fromDir to babel-loader
  if (config.module && config.module.rules) {
    config.module.rules.forEach(rule => {
      if (rule.use && Array.isArray(rule.use)) {
        rule.use.forEach(loader => {
          if (
            loader.loader && 
            loader.loader.includes('babel-loader') && 
            loader.options
          ) {
            loader.options.fromDir = path.resolve(__dirname);
          }
        });
      }
    });
  }

  // Set the app root for expo-router
  process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

  return config;
};