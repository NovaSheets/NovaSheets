module.exports = {
    mode: 'production',
    entry: './src/browser.js',
    target: 'node',
    node: {
        global: false,
        __filename: false,
        __dirname: false,
    },
};
