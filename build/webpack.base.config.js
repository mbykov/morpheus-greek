const path = require("path");
const nodeExternals = require("webpack-node-externals");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

module.exports = env => {
  return {
    target: "node",
    node: {
      __dirname: false,
      __filename: false
    },
    externals: [nodeExternals()],
    resolve: {
      alias: {
        env: path.resolve(__dirname, `../config/env_${env}.json`),
        assets: path.resolve(__dirname, '../resources')
      }
    },
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ["babel-loader"]
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader?url=false"]
        },
        {
          test: /\.png$/,
          use: ["file-loader?url=false"]
        },
      ]
    },
    plugins: [
      new FriendlyErrorsWebpackPlugin({ clearConsole: env === "development" })
    ]
  };
};
