const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['expo-router', '@react-navigation']
    }
  }, argv);

  // Configure the webpack config
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'app': path.resolve(__dirname, './app'),
    },
    fallback: {
      ...config.resolve.fallback,
      'fs': false,
      'path': false,
    }
  };

  // Add support for both CommonJS and ES Modules
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  });

  // Update the babel-loader configuration
  config.module.rules.push({
    test: /\.(js|jsx|ts|tsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        plugins: [
          '@babel/plugin-transform-runtime',
          '@babel/plugin-proposal-class-properties'
        ]
      }
    }
  });

  // Enable webpack context
  config.node = {
    ...config.node,
    __dirname: true,
  };

  // Disable performance hints
  config.performance = {
    hints: false
  };

  // Add a rule for handling image assets
  config.module.rules.push({
    test: /\.(png|jpe?g|gif|svg|webp)$/i,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'assets/'
        }
      }
    ]
  });

  return config;
}; 