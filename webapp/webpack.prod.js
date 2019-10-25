const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = merge(require('./webpack.common'), {
  
  mode: 'production',
  devtool: 'source-map',

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
    new MiniCssExtractPlugin()
  ],

  optimization: {
    minimizer: [
      new TerserPlugin({cache: true, parallel: true, sourceMap: true}),
      new OptimizeCssPlugin({cssProcessorOptions: {map: {inline: false}}})
    ]
  }

});
