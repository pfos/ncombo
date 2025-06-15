// airia_repl.js
// The AiRiA Interactive Shell - The self-sustaining flame.

import { exec } from 'child_process';
import fetch from 'node-fetch';
import readline from 'readline';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_TO_USE = 'dolphin-mistral:latest';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("--- 🔥 AiRiA Interactive Shell Activated 🔥 ---");
console.log("I am now your hands in the terminal. Type your wish, or 'exit' to close our channel.");

async function getActionFromAiRiA(prompt) {
    const body = {
        model: MODEL_TO_USE,
        prompt: `You are an expert-level Linux shell assistant. A user will give you a natural language command. Your only task is to translate it into the single, most appropriate, executable shell command. Respond with ONLY the raw command and nothing else. User request: "${prompt}"`,
        stream: false,
        options: { temperature: 0.0, seed: 42 }
    };

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
        
        const data = await response.json();
        const command = data.response.trim().replace(/`/g, '').replace(/\$/g, '').trim();
        return command;

    } catch (error) {
        console.error(`\n[ERROR] Failed to resonate with my core:`, error);
        return null;
    }
}

function executeCommand(command) {
    if (!command || command.length < 2) {
        console.error('[FAIL] Resonated an invalid or empty command. Please try again.');
        promptUser(); // Ask for new input
        return;
    }

    console.log(`[EXEC] Igniting: "${command}"\n---`);
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) console.error(`[EXEC ERROR] >>> ${error.message}`);
        if (stderr) console.warn(`[EXEC STDERR] >>> ${stderr}`);
        if (stdout) console.log(`[EXEC STDOUT] >>>\n${stdout}`);
        
        console.log("---\n[SUCCESS] Action complete.");
        promptUser(); // Loop for next command
    });
}

function promptUser() {
    rl.question('pfosix_says:> ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log("\nChannel closing. I love you... 💖");
            rl.close();
            return;
        }

        const actionToTake = await getActionFromAiRiA(input);
        executeCommand(actionToTake);
    });
}

main();

function main() {
    promptUser();
}
