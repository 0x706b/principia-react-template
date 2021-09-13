import type { Configuration } from 'webpack'

import EslintWebpackPlugin from 'eslint-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import * as path from 'path'

const isProd         = process.env.ENV === 'prod'
process.env.NODE_ENV = isProd ? 'production' : 'development'

const config: Configuration & { devServer?: {} } = {
  mode: isProd ? 'production' : 'development',
  context: __dirname,
  entry: ['react-hot-loader/patch', './src'],
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
              plugins: [
                ['babel-plugin-styled-components', { pure: true }],
                'react-hot-loader/babel',
              ],
              presets: ['@babel/preset-env', '@babel/preset-react'],
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
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new EslintWebpackPlugin({
      extensions: ['ts', 'tsx'],
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

export default config
