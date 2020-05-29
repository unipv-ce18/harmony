const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const SpritePlugin = require('svg-sprite-loader/plugin');
const HtmlPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

require('dotenv').config()
const HarmonyConf = require('./harmony-webapp.conf');

module.exports = {

  entry: './src/main.js',

  module: {
    rules: [
      {
        test: /\.(ttf|otf|eot|woff(2)?|png|jpg|mp4)$/,
        loader: 'file-loader',
        options: {
          name: 'assets/[hash].[ext]'
        }
      },
      {
        test: /\.svg$/,
        use: [
          {loader: 'svg-sprite-loader', options: {extract: true}},
          'svgo-loader'
        ]
      },
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          'ts-loader'
        ]
      },
      {
        test: /\.m?js$/,
        //exclude: /(node_modules|bower_components)/,
        type: 'javascript/auto',
        use: 'babel-loader'
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      APP_NAME: JSON.stringify(HarmonyConf.APPLICATION_NAME),
      API_BASE_URL: JSON.stringify(HarmonyConf.API_BASE_URL),
      PLAYER_SOCKET_URL: JSON.stringify(HarmonyConf.PLAYER_SOCKET_URL)
    }),
    new webpack.ProvidePlugin({
      __h: ['preact', 'h']
    }),
    new SpritePlugin(),
    new HtmlPlugin({
      title: HarmonyConf.APPLICATION_NAME,
      template: "./src/index.html",
      minify: {
        caseSensitive: true,
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        preserveLineBreaks: false
      }
    })
  ],

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  }

};
