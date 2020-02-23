var ip = require('ip');
var path = require('path');
var webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const { getManifest } = require('workbox-build');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

const MAX_CACHED_FILE_SIZE = 100000000; //100mb

const PLUGINS = [
  new CleanWebpackPlugin(),
  new webpack.EnvironmentPlugin({
    NODE_ENV: 'development' // use 'development' unless process.env.NODE_ENV is defined
  }),
  new HtmlWebpackPlugin( {
    template: 'src/index.ejs', // Load a custom template (lodash by default)    
    inject: 'head'
  }),
  // new ForkTsCheckerWebpackPlugin(),
];

let config = 
{
  mode: nodeEnv,
  devtool: isProd ? "hidden-source-map" : "source-map",
  devServer: {
    // disableHostCheck: true,
    hotOnly: true,
    https: true,
  },
  //entry parameter set dynamicaly below
  output: {
    path: path.resolve("./dist"), //__dirname
    filename: 'build.js'
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
  exclude:  [/(node_modules)/, path.resolve(__dirname, 'src/index.html')],
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
  return new Promise((resolve) => {
    getManifest({
      globDirectory: ".",
      globPatterns: ["assets/**"],
      maximumFileSizeToCacheInBytes: MAX_CACHED_FILE_SIZE,
    }).then(({manifestEntries}) => {      
      if (isProd) {
        PLUGINS.push(
          new WorkboxPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: MAX_CACHED_FILE_SIZE, 
            additionalManifestEntries: manifestEntries
          })
        );
      }
      let dir = './src'
      if (argv.td) {
        dir = `./test/${argv.td}`;
      }
      // config.devServer = { contentBase: [path.join(__dirname, dir),  path.join(__dirname)], ...config.devServer };
      config.devServer = { contentBase: [path.join(__dirname)], ...config.devServer };
      config = { entry: { build: dir + '/app.ts' }, ...config };
      config.module.rules = [htmlRules( {dir} ), ...config.module.rules];  
      resolve(config);
    });
  });
};
