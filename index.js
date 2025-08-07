#!/usr/bin/env node

import degit from "degit";
import path from "path";
import commandLineArgs from "command-line-args";
import { exec } from "child_process";
import util from "util";
import ora from "ora";

const execPromise = util.promisify(exec);

const optionDefinitions = [
  { name: "projectName", type: String, defaultOption: true },
];

const options = commandLineArgs(optionDefinitions);

if (!options.projectName) {
  console.error("❌ Please specify a project name.");
  process.exit(1);
}

async function checkGitAvailability() {
  try {
    await execPromise("git --version");
    return true;
  } catch (error) {
    return false;
  }
}

const repoPath = "Be1newinner/create-express-ts/packages/express-type";
const destination = path.resolve(process.cwd(), options.projectName);

async function setupProject() {
  const isGitAvailable = await checkGitAvailability();
  if (!isGitAvailable) {
    console.error("❌ Git is not installed or not in your PATH.");
    console.error(
      "Please install Git to use this script. You can find it at https://git-scm.com/."
    );
    process.exit(1);
  }

  const cloningSpinner = ora(
    `🚀 Cloning template from ${repoPath} into ${destination}...`
  ).start();

  try {
    const emitter = degit(repoPath, { force: true });
    await emitter.clone(destination);
    cloningSpinner.succeed("✅ Template downloaded successfully.");

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
    cloningSpinner.fail("❌ Error during cloning.");
    console.error("Error during setup:", error.message);
  }
}

setupProject();
