const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    index: "./lib/index.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre",
        // eslint-disable-next-line no-undef
        exclude: /node_modules/
      },
      { test: /\.js.map$/, use: "file-loader" }
    ]
  },
  resolve: {
    extensions: [".js"]
  },
  target: "web",
  node: {
    dns: "empty",
    fs: "empty"
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    library: "dat-sdk-webpack",
    libraryTarget: "umd"
  },
  devtool: "source-map"
};
