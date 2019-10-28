const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const APPLICATION_NAME = 'Harmony';

module.exports = {

  entry: './src/main.js',

  module: {
    rules: [
      {
        test: /\.(ttf|otf|eot|svg|woff(2)?|png|jpg|mp4)$/,
        loader: 'file-loader',
        options: {
          name: 'assets/[hash].[ext]'
        }
      },
      {
        test: /\.m?js$/,
        //exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-syntax-jsx',
              "@babel/plugin-transform-property-mutators",
              ["@babel/plugin-proposal-class-properties", {"loose": true}],
              ['@babel/plugin-transform-react-jsx', {'pragma': 'h', 'pragmaFrag': 'Fragment'}]
            ]
          }
        }
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      APP_NAME: JSON.stringify(APPLICATION_NAME)
    }),
    new HtmlPlugin({
      title: APPLICATION_NAME,
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
    path: path.resolve(__dirname, 'dist')
  }

};
