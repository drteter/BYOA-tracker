module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      '@babel/plugin-transform-runtime',
      '@babel/plugin-transform-export-namespace-from',
      '@babel/plugin-proposal-export-namespace-from'
    ],
  };
}; 