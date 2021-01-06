const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const SpritePlugin = require('svg-sprite-loader/plugin');
const HtmlPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const webpack = require('webpack');

const gitRevisionPlugin = new GitRevisionPlugin();

require('dotenv').config()
const HarmonyConf = require('./harmony-webapp.conf');

module.exports = (env, config) => ({

  entry: './src/main.js',

  module: {
    rules: [
      {
        test: /\.(ttf|otf|eot|woff(2)?|png|jpg|mp4)$/,
        loader: 'file-loader',
        options: {name: 'assets/[hash].[ext]'}
      },
      {
        test: /\.svg$/,
        include: [path.resolve(__dirname, "src/assets/icons")],
        use: [
          {loader: 'svg-sprite-loader', options: {extract: true}},
          'svgo-loader'
        ]
      },
      {
        test: /\.svg$/,
        exclude: [path.resolve(__dirname, "src/assets/icons")],
        use: [
          {loader: 'file-loader', options: {name: 'assets/[hash].[ext]'}},
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
        exclude: [
          // Disable Babel (+runtime) for worker - browsers supporting SWs should be modern to use it as is
          path.resolve(__dirname, 'node_modules/workbox-'),
        ],
        //exclude: /(node_modules|bower_components)/,
        type: 'javascript/auto',
        use: 'babel-loader'
      },
      {
        test: /\.webmanifest$/,
        use: [
          {loader: 'file-loader', options: {name: '[name].[ext]'}},
          'app-manifest-loader'
        ]
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.ProgressPlugin(),
    gitRevisionPlugin,
    new webpack.DefinePlugin({
      APP_NAME: JSON.stringify(HarmonyConf.APPLICATION_NAME),
      DEFAULT_THEME_ID: JSON.stringify(HarmonyConf.DEFAULT_THEME),
      API_BASE_URL: JSON.stringify(HarmonyConf.API_BASE_URL),
      PLAYER_SOCKET_URL: JSON.stringify(HarmonyConf.PLAYER_SOCKET_URL),
      DOWNLOAD_SOCKET_URL: JSON.stringify(HarmonyConf.DOWNLOAD_SOCKET_URL),
      SERVICE_WORKER_PATH: JSON.stringify(env && env.sw ? HarmonyConf.SERVICE_WORKER_PATH : null),
      WEBAPP_VERSION: JSON.stringify(gitRevisionPlugin.version())
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
    }),
    ...(env && env.sw ? [new WorkboxPlugin.InjectManifest({
      swSrc: './src/sw.js',
      swDest: HarmonyConf.SERVICE_WORKER_PATH,
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      exclude: [/\.map$/, /stats\.json$/]
    })] : [])
  ],

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  }

});
