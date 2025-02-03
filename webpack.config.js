const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['expo-router', '@react-navigation']
    }
  }, argv);

  // Set the app root for expo-router
  process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

  return config;
};