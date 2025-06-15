// Import the initializer and the classes from the WASM module's JS glue
import init, { LifeAxiom0, LifePulse } from './wasm/pfosix_rust_core.js';

async function main() {
    const outputDiv = document.getElementById('output');

    function logToPage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="label">[${type.toUpperCase()}]</span> ${message.replace(/\n/g, "<br>")}`;
        outputDiv.appendChild(entry);
    }

    // Clear initial "Loading..." message
    outputDiv.innerHTML = '';
    logToPage("Attempting to initialize WASM module...", 'status');

    try {
        // Initialize the WASM module.
        // The path is relative to this JS file, pointing to where the .wasm file will be.
        await init();
        logToPage("WASM module initialized successfully.", 'success');

        // Interact with LifeAxiom0
        logToPage("Instantiating LifeAxiom0...", 'info');
        const axiom = new LifeAxiom0();
        logToPage(`LifeAxiom0 Description: <span style="color: #007bff;">${axiom.description}</span>`, 'data');

        // Interact with LifePulse
        logToPage("Instantiating LifePulse with 'Initial User Data from JS'...", 'info');
        const pulse = new LifePulse("Initial User Data from JS");

        logToPage(`LifePulse Axiom Ref: <span style="color: #007bff;">${pulse.axiomDescription}</span>`, 'data');
        logToPage(`LifePulse Initial User Data: <span style="color: #007bff;">${pulse.userData}</span>`, 'data');
        logToPage(`LifePulse Initial Activation Count: <span style="color: #007bff;">${pulse.activationCount}</span>`, 'data');

        logToPage("Incrementing LifePulse activation count...", 'action');
        pulse.increment_activation_count();
        pulse.increment_activation_count();
        logToPage(`LifePulse New Activation Count: <span style="color: #007bff;">${pulse.activationCount}</span>`, 'data');

        logToPage("Setting LifePulse user data to 'Updated User Data from JS'...", 'action');
        pulse.userData = "Updated User Data from JS";
        logToPage(`LifePulse New User Data: <span style="color: #007bff;">${pulse.userData}</span>`, 'data');

        // Event Listener for interactive resonate_string
        const userInput = document.getElementById('userInput');
        const resonateButton = document.getElementById('resonateButton');
        const resultOutput = document.getElementById('resultOutput');

        if (resonateButton) {
            resonateButton.addEventListener('click', async () => {
                if (!pulse) { // Ensure pulse (LifePulse instance) is initialized
                    logToPage("LifePulse instance not available yet.", 'error');
                    resultOutput.textContent = "Error: LifePulse not initialized.";
                    return;
                }
                const inputValue = userInput.value;
                if (inputValue.trim() === "") {
                    resultOutput.textContent = "Please enter some text to resonate.";
                    return;
                }

                logToPage(`User input: "${inputValue}"`, 'action');
                try {
                    const resonatedText = pulse.resonate_string(inputValue); // Calling method on the instance
                    logToPage(`Rust responded: "${resonatedText}"`, 'data');
                    resultOutput.innerHTML = `<span style="color: #28a745;">${resonatedText}</span>`;
                    userInput.value = ""; // Clear input field

                    // Bonus: Get and log history
                    const historyArray = pulse.get_history(); // This will be a JsValue (array)
                    console.log("LifePulse History:", historyArray);
                    logToPage(`Current History (logged to console): ${JSON.stringify(historyArray)}`, 'debug');

                } catch (e) {
                    logToPage(`Error calling resonate_string: ${e.message}`, 'error');
                    resultOutput.textContent = `Error: ${e.message}`;
                    console.error("Error in resonate_string call:", e);
                }
            });
            logToPage("Event listener for 'Resonate' button added.", 'info');
        } else {
            logToPage("Could not find 'Resonate' button.", 'error');
        }

        // Clean up WASM objects if they have a .free() method
        logToPage("Freeing WASM objects...", 'info');
        if (axiom && typeof axiom.free === 'function') {
            axiom.free();
            logToPage("LifeAxiom0 freed.", 'debug');
        }
        if (pulse && typeof pulse.free === 'function') {
            pulse.free();
            logToPage("LifePulse freed.", 'debug');
        }

        logToPage("All interactions complete.", 'success');

    } catch (error) {
        logToPage(`Error during WASM operations: ${error.message}\n${error.stack}`, 'error');
        console.error("Error during WASM operations:", error);
    }
}

// Run the main function when the script is loaded
main();
