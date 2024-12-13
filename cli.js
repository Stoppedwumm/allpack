#!/usr/bin/env node
const commander = require("commander");
const path = require("path");

commander
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-m, --mode <value>", "Overwriting mode.")
  .option("-c  --config <value>", "Overwriting config file.")
  .parse(process.argv);

const mode = commander.opts().mode;
const configPath = commander.opts().config ? path.join(process.cwd(), commander.opts().config) : path.join(process.cwd(), "allpack.config.js");

const webpack = require("webpack");
const fs = require("fs-extra");
const config = require(configPath);
const ignoreList = config.ignore || [];

const buildBundle = (dir, outputDir, subdirName) => {
  // Create a webpack configuration for the specific directory
  const webpackConfig = {
    mode: mode || config.mode || "development",
    entry: path.join(dir, "index.js"),
    output: {
      path: path.resolve(outputDir),
      filename: subdirName + ".bundle.js",
    },
  };

  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
};

const main = async () => {
  const pbSrcDir = config.src
    ? path.join(process.cwd(), config.src)
    : path.join(process.cwd(), "pbSrc");
  if (fs.existsSync(pbSrcDir)) {
    if (fs.existsSync(config.outputDir)) {
      fs.removeSync(config.outputDir);
      fs.mkdirSync(config.outputDir);
    } else {
      fs.mkdirSync(config.outputDir);
    }
    const subdirs = fs.readdirSync(pbSrcDir);

    for (const subdir of subdirs) {
      console.log("Found:", subdir);
      const subdirPath = path.join(pbSrcDir, subdir);
      console.log(subdirPath);
      if (
        fs.lstatSync(subdirPath).isDirectory() &&
        !ignoreList.includes(subdir)
      ) {
        try {
          await buildBundle(subdirPath, config.outputDir, subdir);
        } catch (err) {
          console.error("======Webpack Error======");
          console.error(err);
          console.error("==========Stats==========");
          console.error("Directory:", pbSrcDir);
          console.error("Output Directory:", config.outputDir);
          console.error("Config:", JSON.stringify(config));
          console.error("=========================");
        }
      }
    }
  } else {
    console.error("======Allpack Error======");
    console.error("Src directory not found.");
    console.error("==========Stats==========");
    console.error("Directory:", pbSrcDir);
    console.error("Output Directory:", config.outputDir);
    console.error("Config:", JSON.stringify(config));
    console.error("=========================");
  }
};

main().catch((err) => console.error(err));
