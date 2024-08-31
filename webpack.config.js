/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
const path = require("path");

module.exports = [
  {
    entry: "./main.ts",
    context: __dirname,
    target: "electron-main",
    mode: process.env.NODE_ENV ?? "production",
    devtool:
      process.env.NODE_ENV === "development"
        ? "cheap-module-source-map"
        : "source-map",
    cache:
      process.env.NODE_ENV === "development" ? { type: "filesystem" } : false,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          // test: /\.s[ac]ss$/i,
          test: /\.(sa|sc|c)ss$/,
          use: [
            "style-loader",
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                // Prefer `dart-sass`
                // implementation: require("sass"),
                // sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(jpg|png|gif)$/, // 针对这三种格式的文件使用file-loader处理
          use: {
            loader: "file-loader",
            options: {
              // 定义打包后文件的名称；
              // [name]:原文件名，[hash]:hash字符串（如果不定义名称，默认就以hash命名，[ext]:原文件的后缀名）
              name: "[name]_[hash].[ext]",
              outputPath: "images/", //  定义图片输出的文件夹名（在output.path目录下）
              limit: 204800, // 大于200kb的图片会被打包在images文件夹里面，小于这个值的会被以base64的格式写在js文件中
            },
          },
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
        },
      ],
    },
    externals: [
      {
        "@k8slens/extensions": "var global.LensExtensions",
        mobx: "var global.Mobx",
      },
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      libraryTarget: "commonjs2",
      filename: "main.js",
      path: path.resolve(__dirname, "dist"),
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  {
    entry: "./renderer.tsx",
    context: __dirname,
    target: "electron-renderer",
    mode: "production",
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          // test: /\.s[ac]ss$/i,
          test: /\.(sa|sc|c)ss$/,
          use: [
            "style-loader",
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                // Prefer `dart-sass`
                // implementation: require("sass"),
                // sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(js|jsx)$/, // 这里加入jsx
          use: {
            loader: "babel-loader",
            options: {
              //用babel-loader需要把es6->es5
              presets: [
                "@babel/preset-env",
                "@babel/preset-react", //yarn add @babel/core @babel/preset-react -D
              ],
              plugins: [
                "@babel/plugin-transform-class-properties",
                // '@babel/plugin-syntax-dynamic-import'
              ],
            },
          },
          exclude: /node_module/, //优化项(2):排除某个文件
          // include:path.resolve('src')  //包含
        },
        {
          test: /\.(jpg|png|gif)$/, // 针对这三种格式的文件使用file-loader处理
          use: {
            loader: "file-loader",
            options: {
              // 定义打包后文件的名称；
              // [name]:原文件名，[hash]:hash字符串（如果不定义名称，默认就以hash命名，[ext]:原文件的后缀名）
              name: "[name]_[hash].[ext]",
              outputPath: "images/", //  定义图片输出的文件夹名（在output.path目录下）
              limit: 204800, // 大于200kb的图片会被打包在images文件夹里面，小于这个值的会被以base64的格式写在js文件中
            },
          },
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
        },
      ],
    },
    externals: [
      {
        "@k8slens/extensions": "var global.LensExtensions",
        react: "var global.React",
        "react-dom": "var global.ReactDOM",
        mobx: "var global.Mobx",
        "mobx-react": "var global.MobxReact",
      },
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      libraryTarget: "commonjs2",
      globalObject: "this",
      filename: "renderer.js",
      path: path.resolve(__dirname, "dist"),
    },
  },
];
