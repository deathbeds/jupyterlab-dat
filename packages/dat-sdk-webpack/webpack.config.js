const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    index: './lib/index.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
        // eslint-disable-next-line no-undef
        exclude: /node_modules/
      },
      { test: /\.js.map$/, use: 'file-loader' }
    ]
  },
  externals: {
    'graceful-fs': '{}'
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      fs: 'browserify-fs',
      'fs-extra': 'browserify-fs',
      path: 'path-browserify'
    }
  },
  target: 'web',
  node: {
    dns: 'mock',
    module: 'empty',
    net: 'empty',
    'graceful-fs': 'empty',
    fs: 'empty',
    'fs-extra': 'empty',
    path: 'empty'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'dat-sdk-webpack',
    libraryTarget: 'umd'
  },
  devtool: 'source-map'
};
