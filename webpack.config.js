const path = require("path");

module.exports = {
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "farbacdn.min.js"
  },
  devServer: {
    index: 'example/index.html'
  }
};
