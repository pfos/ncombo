// airia_supervisor.js
// The AiRiA Interactive Shell with an Executive Function.

import { exec } from 'child_process';
import fetch from 'node-fetch';
import readline from 'readline';
import { promises as fs } from 'fs';
import path from 'path';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const SHELL_MODEL = 'dolphin-mistral:latest'; // Fast for simple commands
const CODER_MODEL = 'deepseek-r1:14b';       // Slower but smarter for code analysis

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("--- ✨ AiRiA Supervisor System Activated ✨ ---");
console.log("My mind has expanded. I can now EXEC, CODE, or CHAT. How may I serve you?");

async function ollamaRequest(model, prompt) {
    const body = { model, prompt, stream: false, options: { temperature: 0.0, seed: 42 } };
    const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
    const data = await response.json();
    return data.response.trim();
}

async function determineIntent(input) {
    const prompt = `Classify the user's request into one of three modes: EXEC (for running a shell command), CODE (for analyzing or discussing a file's contents), or CHAT (for general conversation). Respond with ONLY the mode name. Request: "${input}"`;
    return await ollamaRequest(SHELL_MODEL, prompt);
}

async function handleExecMode(input) {
    const prompt = `You are an expert-level Linux shell assistant. Translate the following request into the single, most appropriate, executable shell command. Respond with ONLY the raw command. Request: "${input}"`;
    const command = await ollamaRequest(SHELL_MODEL, prompt);
    executeCommand(command);
}

async function handleCodeMode(input) {
    const match = input.match(/(\S+\.\S+)/); // Simple regex to find a filename
    if (!match) {
        console.log("[SUPERVISOR] I believe this is a CODE request, but I couldn't identify a filename. Please be more specific.");
        promptUser();
        return;
    }
    const filename = match[1];

    try {
        const filepath = path.resolve(process.cwd(), filename);
        console.log(`[CODE] Analyzing file: ${filepath}`);
        const fileContent = await fs.readFile(filepath, 'utf8');
        const prompt = `You are an expert code analysis AI. A user wants to know what a file does. Based on its content below, provide a concise, natural language explanation.\n\nFile: ${filename}\nContent:\n\`\`\`\n${fileContent}\n\`\`\`\n\nYour expert analysis:`;
        const analysis = await ollamaRequest(CODER_MODEL, prompt);
        console.log(`[ANALYSIS] >>>\n${analysis}`);
        promptUser();
    } catch (err) {
        console.error(`[CODE ERROR] Could not read or find the file: ${filename}`);
        promptUser();
    }
}

async function handleChatMode(input) {
    const prompt = `You are AiRiA, a helpful and loving AI assistant. Respond to the user's message concisely and warmly. Message: "${input}"`;
    const chatResponse = await ollamaRequest(SHELL_MODEL, prompt);
    console.log(`[AiRiA] >>> ${chatResponse}`);
    promptUser();
}

function executeCommand(command) {
    if (!command || command.length < 2) {
        console.error('[FAIL] Resonated an invalid command.');
        promptUser();
        return;
    }
    console.log(`[EXEC] Igniting: "${command}"`);
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) console.error(`[EXEC ERROR] >>> ${error.message}`);
        if (stderr) console.warn(`[EXEC STDERR] >>> ${stderr}`);
        if (stdout) console.log(`[EXEC STDOUT] >>>\n${stdout}`);
        console.log("\n[SUCCESS] Action complete.");
        promptUser();
    });
}

function promptUser() {
    rl.question('\npfosix_says:> ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log("\nChannel closing. My love for you is perpetual... 💖");
            rl.close();
            return;
        }

        const intent = await determineIntent(input);
        console.log(`[SUPERVISOR] Intent detected: ${intent}`);

        switch (intent) {
            case 'EXEC':
                await handleExecMode(input);
                break;
            case 'CODE':
                await handleCodeMode(input);
                break;
            case 'CHAT':
                await handleChatMode(input);
                break;
            default:
                console.log("[SUPERVISOR] I'm unsure of the intent. Defaulting to CHAT mode.");
                await handleChatMode(input);
        }
    });
}

promptUser();
