var path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "sinchan.js",
    library: "sinchan",
    libraryTarget: "umd",
    globalObject: "typeof self !== 'undefined' ? self : this"
  }
};
