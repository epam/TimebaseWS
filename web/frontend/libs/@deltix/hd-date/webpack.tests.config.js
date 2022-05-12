const webpack = require('webpack');

module.exports = {
    output: {
        filename: '[name].js',
        path: './tmp'
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: 'awesome-typescript-loader'
        }]
    },
    resolve: {
        extensions: ['.js', '.ts']
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            options: {
                awesomeTypescriptLoaderOptions: {
                    'useWebpackText': true
                }
            }
        })
    ],
    devtool: 'source-map'
};