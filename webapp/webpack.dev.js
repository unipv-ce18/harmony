const merge = require('webpack-merge');
const webpack = require('webpack');

const HarmonyConf = require('./harmony-webapp.conf');

module.exports = merge(require('./webpack.common'), {

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
    new webpack.DefinePlugin({
      API_BASE_URL: JSON.stringify(HarmonyConf.API_BASE_URL)
    }),
    new webpack.HotModuleReplacementPlugin()
  ]

});
