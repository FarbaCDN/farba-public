const path = require("path");

module.exports = (env, argv) => {
    return {
        output: {
            path: path.resolve(__dirname, "build"),
            publicPath: ((argv.mode === 'production') ? ('https://farbacdn.github.io/farba-public/build/') : '/'),
            filename: "[name].min.js",
            chunkFilename: "farbacdn.[id].js"
        },
        entry: {
            "farbacdn": "./src/farba.js"
            //"farbacdn-worker": "./src/farba-worker.js"
        },
        module: {
            rules: [
                {
                    loader: 'worker-loader',
                    options: { inline: true, fallback: false, name: "farbacdn.worker.js" },
                    test: /\.worker\.js$/
                }
            ]
        },
        devServer: {
            index: 'example/index.html'
        }
    }
};
