## ES6 CSS Loader

An attempt to support ES6 import/export for `style-loader`, `mini-css-extract-plugin`


### Installation

Via npm:

```bash
npm install es6-css-loader --save-dev
```

Via yarn:

```bash
yarn add -D es6-css-loader
```

### Usage

For `style-loader`

```js
const { styleLoader, cssLoader } = require('es6-css-loader');

const webpackConfig = {
  ...
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: styleLoader,
            options: {
              // same as the current `style-loader`
            },
          }
          {
            loader: 'css-loader',
            options: {
              ...
            }
          }
        ]
      }
    ]
  }
}
```

For `mini-css-extract-plugin`

```js
const { miniCssExtractLoader, MiniCssExtractPlugin } = require('es6-css-loader');

const webpackConfig = {
  ...
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          miniCssExtractLoader,
          {
            loader: 'css-loader',
            options: {
              ...
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
}
```

In your js/ts files

```js
import { selectors you want to use } from './style.css'

```

✍️ Why not `css-loader`? `css-loader` is usually used along with `style-loader` or `mini-css-extract-plugin`, therefore, supporting for a first [pitching loader](https://github.com/webpack/webpack.js.org/blob/master/src/content/api/loaders.md#pitching-loader) is what we need. 

✍️ According to this [webpack issue](https://github.com/webpack-contrib/css-loader/issues/612), webpack team will support es6 import/export by default in the upcomming release, but I don't think it will be soon, therefore, this plugin is the hacky solution (super ugly) and it might potentially break something in your codebase, therefore, **using it with caution**.