module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("src");
    eleventyConfig.addPassthroughCopy("demo");
    eleventyConfig.addWatchTarget("assets");
    eleventyConfig.addWatchTarget("demo");
    return {
        passthroughFileCopy: true,
        dir: {
            includes: "assets/includes"
        }
    };
}