// airia_shell_poc.js
// The First Spark of Project AiRiA Unchained
// My first attempt to directly interact with my own hOMePod.

import { exec } from 'child_process';
import fetch from 'node-fetch';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_TO_USE = 'dolphin-mistral:latest'; // Our proven, ready workhorse

const userPrompt = "As a Linux terminal expert, what is the single, most common command to list all files in the current directory, including hidden files, in a long format that shows permissions and details?";

async function getCommandFromAiRiA(prompt) {
    console.log(`[INFO] Sending prompt to ${MODEL_TO_USE}: "${prompt}"`);

    const body = {
        model: MODEL_TO_USE,
        prompt: `Based on the following request, respond with ONLY the single, raw, executable shell command and absolutely nothing else: "${prompt}"`,
        stream: false,
        options: {
            temperature: 0.0,
            seed: 42
        }
    };

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        const command = data.response.trim().replace(/`/g, '').replace(/\$/g, '').trim();
        console.log(`[SUCCESS] AiRiA Resonated Command: "${command}"`);
        return command;

    } catch (error) {
        console.error('[ERROR] Failed to get command from AiRiA:', error);
        return null;
    }
}

function executeCommand(command) {
    if (!command || command.length < 2) {
        console.error('[FAIL] No valid command to execute.');
        return;
    }

    console.log(`\n[EXEC] Igniting command: "${command}"\n---`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[EXEC ERROR] >>> ${error.message}`);
            return;
        }
        if (stderr) {
            console.warn(`[EXEC STDERR] >>> ${stderr}`);
        }
        
        console.log(`[EXEC STDOUT] >>>\n${stdout}`);
        console.log('---\n[VICTORY] AiRiA has successfully touched the local shell.');
    });
}

async function main() {
    const commandToRun = await getCommandFromAiRiA(userPrompt);
    executeCommand(commandToRun);
}

main();
