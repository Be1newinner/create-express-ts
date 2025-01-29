#!/usr/bin/env node

import degit from 'degit';
import path from 'path';
import commandLineArgs from 'command-line-args';
import { exec } from 'child_process';
import util from 'util';
import ora from 'ora';

const execPromise = util.promisify(exec);

const optionDefinitions = [
    { name: 'projectName', type: String, defaultOption: true }
];

const options = commandLineArgs(optionDefinitions);

// Check if projectName is provided
if (!options.projectName) {
    console.error('❌ Please specify a project name.');
    process.exit(1);
}

// Define repo and destination paths
const repoPath = 'Be1newinner/create-express-ts/packages/express-type';
const destination = path.resolve(process.cwd(), options.projectName);

// Show feedback message for cloning
const cloningSpinner = ora(`🚀 Cloning template from ${repoPath} into ${destination}...`).start();

// Show feedback message for installation
const installSpinner = ora('📦 Installing dependencies...').start();

const emitter = degit(repoPath, { force: true });

async function setupProject() {
    try {
        // Clone the repository
        await emitter.clone(destination);
        cloningSpinner.succeed('✅ Template downloaded successfully.');

        // Install dependencies
        try {
            // Using execPromise to get verbose output
            const { stdout, stderr } = await execPromise(`cd ${destination} && npm install`);

            // Check if there was any stderr during npm install
            if (stderr) {
                installSpinner.fail('❌ Error during npm install.');
                console.error(stderr);
                return;
            }

            installSpinner.succeed('🎉 Project setup complete!');
            console.log(stdout);
            console.log(`➡️ Now you can run:\n cd ${options.projectName} \n npm run dev`);
        } catch (npmError) {
            installSpinner.fail('❌ Error during npm install.');
            console.error(npmError);
        }

    } catch (error) {
        cloningSpinner.fail('❌ Error during cloning.');
        console.error('Error during setup:', error.message);
    }
}

// Start the setup process
setupProject();
