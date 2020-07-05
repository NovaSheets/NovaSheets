module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("src");
    return {
        passthroughFileCopy: true,
        dir: {
            includes: "assets/includes"
        }
    };
}