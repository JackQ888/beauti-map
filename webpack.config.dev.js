const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: {
        main: './src/main.ts'
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
    },
    mode: "development",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: { transpileOnly: true }
                },
                exclude: /node_modules/
            },
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    devServer: {
        host: '0.0.0.0',
        port: '88',
        static: {
            directory: path.join(__dirname, "./public"),
        },
        historyApiFallback: true,
        client: {
            overlay: { errors: true }
        },
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: './index.html',
            template: './public/index.html',
            inject: false
        })
    ]
}
