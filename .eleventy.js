module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("src");
    eleventyConfig.addPassthroughCopy("test");
    eleventyConfig.addWatchTarget("assets");
    eleventyConfig.addWatchTarget("test");
    return {
        passthroughFileCopy: true,
        dir: {
            includes: "assets/includes"
        }
    };
}