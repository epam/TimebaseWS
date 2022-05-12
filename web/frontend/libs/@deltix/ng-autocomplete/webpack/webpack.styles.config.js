const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const path = require("path");

module.exports = {
    entry: "./src/scss/autocomplete.scss",
    output: {
        path: path.resolve(__dirname, "../dist"),
    },
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: false,
                            sourceMap: false,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                autoprefixer({
                                    browsers: ['> 0.25%', 'not dead'],
                                }),
                            ],
                            sourceMap: false,
                        },
                    },
                    'sass-loader',
                ],
                exclude: [/node_modules/],
            },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'autocomplete.css',
            chunkFilename: 'autocomplete.css',
        }),
    ],
    resolve: {
        extensions: [".css"]
    },
    mode: 'production',
    optimization: {
        nodeEnv: 'production'
    },
    devtool: false,
};