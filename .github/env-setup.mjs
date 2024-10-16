// import necessary modules
import { Octokit } from "octokit";
import fs from 'fs';
import envSetup from './env-setup-ci.js';

// Delete existing folder ./types if exists
if (fs.existsSync('./types')) {
    fs.rmSync('./types', { recursive: true });
}

// Create a new instance of the Octokit client
const github = new Octokit();

// Call the envSetup function
await envSetup(github, true);