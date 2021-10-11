import type { Configuration } from 'webpack'

import CopyWebpackPlugin from 'copy-webpack-plugin'
import EslintWebpackPlugin from 'eslint-webpack-plugin'
import * as path from 'path'
import WebpackNodeExternals from 'webpack-node-externals'
import RouteManifestPlugin from 'webpack-route-manifest'

const isProd         = process.env.ENV === 'prod'
process.env.NODE_ENV = isProd ? 'production' : 'development'

const server: Configuration = {
  mode: isProd ? 'production' : 'development',
  context: __dirname,
  ...(isProd ? {} : { devtool: 'inline-source-map' }),
  entry: {
    server: { import: './server' },
  },
  target: 'node',
  externalsPresets: { node: true },
  externals: [
    // @ts-expect-error
    WebpackNodeExternals({}),
    {
      ['./public/route-manifest.json']:
        'require("./public/route-manifest.json")',
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: ['babel-plugin-styled-components'],
              presets: [['@babel/preset-react', { runtime: 'automatic' }]],
            },
          },
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['ignore-loader'],
      },
    ],
  },
  plugins: [
    new EslintWebpackPlugin({
      extensions: ['ts', 'tsx'],
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  experiments: {
    topLevelAwait: true,
  },
}

const client: Configuration & { devServer?: {} } = {
  mode: isProd ? 'production' : 'development',
  context: __dirname,
  entry: './src/index',
  ...(isProd ? {} : { devtool: 'inline-source-map' }),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: ['babel-plugin-styled-components'],
              presets: [['@babel/preset-react', { runtime: 'automatic' }]],
            },
          },
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  output: {
    path: path.resolve(__dirname, 'dist/public'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].[contenthash].js',
    publicPath: '/',
  },
  plugins: [
    new EslintWebpackPlugin({
      extensions: ['ts', 'tsx'],
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, 'assets'), to: 'assets' }],
    }),
    new RouteManifestPlugin({
      inline: false,
      filename: 'route-manifest.json',
      routes: (file) => {
        /* eslint-disable-next-line no-param-reassign */
        file = file
          .replace(path.join(__dirname, '../src'), '')
          .replace(/\.[tj]sx?$/, '')

        if (!file.includes('/pages/')) return '*'
        let name = '/' + file.replace('../pages/', '').toLowerCase()
        return name === '/home' ? '/' : name
      },
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    client: {
      overlay: false,
    },
    hot: true,
    compress: true,
    port: 4000,
  },
}

export default [client, server]
