const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
	mode: "production",
	entry: {
		background: "./src/background/background.ts",
		popup: "./src/popup/popup.ts",
		content: "./src/content/content.ts",
		options: "./src/options/options.ts",
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].js",
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{ test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ },
			{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, "css-loader"] },
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css",
		}),
		new HtmlWebpackPlugin({
			template: "./src/popup/popup.html",
			filename: "popup.html",
			chunks: ["popup"],
		}),
		new HtmlWebpackPlugin({
			template: "./src/options/options.html",
			filename: "options.html",
			chunks: ["options"],
		}),
	],
};
