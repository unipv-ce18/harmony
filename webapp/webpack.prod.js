const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (env, config) => merge(require('./webpack.common')({...env, sw: true}, config), {
  
  mode: 'production',
  devtool: 'source-map',

  output: {
    filename: '[name].[contenthash].js'
  },

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: { /* publicPath: '../' */ }
          },
          {
            loader: 'css-loader',
            options: {modules: true}
          },
          {
            loader: 'postcss-loader',
            options: {plugins: [require('postcss-preset-env')] }
          },
          'sass-loader'
        ]
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    })
  ],

  optimization: {
    minimizer: [
      new TerserPlugin({cache: true, parallel: true, sourceMap: true}),
      new OptimizeCssPlugin({cssProcessorOptions: {map: {inline: false}}})
    ]
  }

});
