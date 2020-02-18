// var MinifyPlugin = require('babel-minify-webpack-plugin');
// var fs = require('fs');
var ip = require('ip');
var path = require('path');
var webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

const PLUGINS = [
  new webpack.EnvironmentPlugin({
    NODE_ENV: 'development' // use 'development' unless process.env.NODE_ENV is defined
  }),
  // new webpack.HotModuleReplacementPlugin(),
  new ForkTsCheckerWebpackPlugin()
];

let config = 
{
  // externals: {
  //   aframe: 'AFRAME'
  // },
  mode: nodeEnv,
  devtool: isProd ? "hidden-source-map" : "source-map",
  devServer: {
    // disableHostCheck: true,
    hotOnly: true,
    https: true,
  },
  //entry set dynamicaly below
  output: {
    path: __dirname,//path.resolve("./build"),
    filename: 'build/build.js'
  },
  plugins: PLUGINS,
  module: {
    rules: [
      {
        test:  /\.(js|ts)$/,
        exclude: [/(node_modules)/],
        use: ['babel-loader', 'aframe-super-hot-loader']
      },
      {
        test: /\.glsl/,
        exclude:  [/(node_modules)/],
        loader: 'webpack-glsl-loader'
      },
      {
        test: /\.css$/,
        exclude:  [/(node_modules)/],
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.png|\.jpg/,
        exclude:  [/(node_modules)/],
        use: ['url-loader']
      }
    ]
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')],
    extensions: [".ts", ".js"]
  },
  performance: {
    maxEntrypointSize: 1900000,
    maxAssetSize: 1900000
  },
}

const htmlRules = ({ dir } = {}) => ({
  test: /\.html/,
  exclude:  [/(node_modules)/],
  use: [
    'aframe-super-hot-html-loader',
    {
      loader: 'super-nunjucks-loader',
      options: {
        globals: {
          HOST: ip.address(),
          IS_PRODUCTION: process.env.NODE_ENV === 'production'
        },
        path: process.env.NUNJUCKS_PATH || path.join(__dirname, `${dir}`)
      }
    },
    {
    loader: 'html-require-loader',
      options: {
        root: path.join(__dirname, `${dir}`)
      }
    }
  ],
});

module.exports = (env, argv) => {
  let dir = './src'
  if (argv.td) {
    dir = `./test/${argv.td}`;
  }
  config.devServer = { ...config.devServer, contentBase: [path.join(__dirname, dir),  path.join(__dirname)] };
  config = { entry: { build: dir + '/app.ts' }, ...config };
  config.module.rules = [...config.module.rules, htmlRules( {dir} )];  
  return config;
};
