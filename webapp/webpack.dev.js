const merge = require('webpack-merge');
const webpack = require('webpack');

module.exports = (env, config) => merge(require('./webpack.common')(env, config), {

  mode: 'development',
  devtool: 'inline-source-map',

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {modules: true}
          },
          {
            loader: 'postcss-loader',
            options: {plugins: [require('postcss-preset-env')]}
          },
          'sass-loader'
        ]
      }
    ]
  },

  devServer: {
    contentBase: false,
    hot: true,
    historyApiFallback: true
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]

});
