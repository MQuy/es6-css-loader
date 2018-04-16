module.exports = {
  styleLoader: require.resolve('./style-loader/index'),
  MiniCssExtractPlugin: require('./mini-css-extract-plugin/cjs'),
  miniCssExtractLoader: require.resolve('./mini-css-extract-plugin/loader'),
};