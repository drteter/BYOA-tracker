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

  // Set the app root for expo-router
  process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

  return config;
};