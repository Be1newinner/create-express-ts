#!/usr/bin/env node

import path from "path";
import commandLineArgs from "command-line-args";
import { exec } from "child_process";
import util from "util";
import ora from "ora";
import fetch from "node-fetch";
import yauzl from "yauzl";
import fs from "fs";
// import { Writable } from "stream";

const execPromise = util.promisify(exec);
const mkdirPromise = util.promisify(fs.mkdir);

const optionDefinitions = [
  { name: "projectName", type: String, defaultOption: true },
];

const options = commandLineArgs(optionDefinitions);

if (!options.projectName) {
  console.error("❌ Please specify a project name.");
  process.exit(1);
}

const repoZipUrl =
  "https://github.com/Be1newinner/create-express-ts/archive/refs/heads/main.zip";
const repoSubdirectory = "create-express-ts-main/packages/express-type/";

const destination = path.resolve(process.cwd(), options.projectName);

async function setupProject() {
  if (fs.existsSync(destination)) {
    console.log("❌ Destination already exists. Choose Different Project!");
    return;
  }

  const downloadSpinner = ora(
    `🚀 Downloading template from ${repoZipUrl}...`
  ).start();

  try {
    await mkdirPromise(destination, { recursive: true });

    const response = await fetch(repoZipUrl);
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    const zipBuffer = await response.buffer();

    await new Promise((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          return reject(err);
        }

        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          const entryPath = entry.fileName;

          const isDirectory = entryPath.endsWith("/");

          if (entryPath.startsWith(repoSubdirectory) && !isDirectory) {
            const newPath = path.join(
              destination,
              entryPath.substring(repoSubdirectory.length)
            );

            const parentDir = path.dirname(newPath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }

            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                return reject(err);
              }
              const writeStream = fs.createWriteStream(newPath);
              readStream.pipe(writeStream);
              writeStream.on("finish", () => {
                zipfile.readEntry();
              });
            });
          } else {
            zipfile.readEntry();
          }
        });

        zipfile.on("end", () => {
          resolve();
        });

        zipfile.on("error", (e) => reject(e));
      });
    });

    downloadSpinner.succeed(
      "✅ Template downloaded and extracted successfully."
    );

    const installSpinner = ora("📦 Installing dependencies...").start();
    try {
      const { stdout, stderr } = await execPromise(`npm install`, {
        cwd: destination,
      });

      if (stderr) {
        if (stderr.includes("npm ERR!")) {
          installSpinner.fail("❌ Error during npm install.");
          console.error(stderr);
          return;
        }
      }

      installSpinner.succeed("🎉 Project setup complete!");
      console.log(stdout);
      console.log(
        `\n➡️ Now you can run:\n cd ${options.projectName} \n npm run dev`
      );
    } catch (npmError) {
      installSpinner.fail("❌ Error during npm install.");
      console.error(npmError);
    }
  } catch (error) {
    downloadSpinner.fail("❌ Error during download or extraction.");
    console.log("Error during setup:", error.message);
  }
}

setupProject();
