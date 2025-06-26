// Import the initializer and the classes from the WASM module's JS glue
import init, { LifeAxiom0, LifePulse, LifeAxiom } from './wasm/pfosix_rust_core.js';

let selectedAxiom = LifeAxiom.Wheelz; // Default to HeartCenter (Wheelz is 3)

async function main() {
    const logOutputDiv = document.getElementById('logContainer'); // Changed ID for general logs

    function logToPage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        if (logOutputDiv) { // Check if logOutputDiv exists
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = `<span class="label">[${type.toUpperCase()}]</span> ${message.replace(/\n/g, "<br>")}`;
            logOutputDiv.appendChild(entry);
        }
    }

    // Clear initial "Loading..." message
    if (logOutputDiv) logOutputDiv.innerHTML = '';
    logToPage("Attempting to initialize WASM module...", 'status');

    try {
        // Initialize the WASM module.
        await init();
        logToPage("WASM module initialized successfully.", 'success');

        // Interact with LifeAxiom0
        logToPage("Instantiating LifeAxiom0...", 'info');
        const axiom = new LifeAxiom0();
        logToPage(`LifeAxiom0 Description: <span style="color: #007bff;">${axiom.description}</span>`, 'data');

        // Interact with LifePulse
        logToPage("Instantiating LifePulse with 'Initial User Data from JS'...", 'info');
        const pulse = new LifePulse("Initial User Data from JS"); // pulse is local to main's try block

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

        // Setup LifeWheelz Axiom Button Controls
        const controls = document.getElementById('lifewheel-controls');
        const axiomButtons = controls.querySelectorAll('button');

        logToPage("Setting up LifeWheelz controls...", 'info');
        if (controls && axiomButtons.length > 0) {
            controls.addEventListener('click', (event) => {
                if (event.target.tagName === 'BUTTON') {
                    const axiomName = event.target.dataset.axiom;
                    if (LifeAxiom[axiomName] !== undefined) {
                        selectedAxiom = LifeAxiom[axiomName];

                        axiomButtons.forEach(btn => btn.classList.remove('selected'));
                        event.target.classList.add('selected');

                        logToPage(`Selected Axiom: ${axiomName} (Value: ${selectedAxiom})`, 'ui');
                        console.log(`Selected Axiom: ${axiomName}`, selectedAxiom);
                    }
                }
            });
            // Set initial selected style for default axiom (Wheelz)
            const defaultAxiomButton = document.getElementById('lifewheel-wheelz');
            if (defaultAxiomButton) { // Ensure default button exists
                 // Remove selected from all first, then add to default (in case HTML had multiple)
                axiomButtons.forEach(btn => btn.classList.remove('selected'));
                defaultAxiomButton.classList.add('selected');
            }
            logToPage(`Default Axiom: Wheelz (Value: ${selectedAxiom})`, 'ui');
        } else {
            logToPage("Could not find LifeWheelz controls or buttons.", 'error');
        }

        // Event Listener for interactive resonate_string
        const resonateInput = document.getElementById('resonate-input'); // New ID
        const resonateButton = document.getElementById('resonate-button'); // New ID
        const outputDisplay = document.getElementById('output'); // New ID for resonate result

        if (resonateButton && resonateInput && outputDisplay) {
            resonateButton.addEventListener('click', async () => {
                if (!pulse) {
                    logToPage("LifePulse instance not available yet.", 'error');
                    outputDisplay.textContent = "Error: LifePulse not initialized.";
                    return;
                }
                const inputValue = resonateInput.value;
                if (inputValue.trim() === "") {
                    outputDisplay.textContent = "Please enter some text to resonate.";
                    return;
                }

                logToPage(`User input for resonance: "${inputValue}" with Axiom: ${Object.keys(LifeAxiom)[selectedAxiom]}`, 'action');
                try {
                    const resonatedText = pulse.resonate_string(selectedAxiom, inputValue);
                    logToPage(`Rust resonated: "${resonatedText}"`, 'data');
                    outputDisplay.innerHTML = `<span style="color: #28a745;">${resonatedText}</span>`;
                    // resonateInput.value = ""; // Decided to keep input

                    const historyArray = pulse.get_history();
                    console.log("LifePulse History:", historyArray);
                    logToPage(`Current History (logged to console): ${JSON.stringify(historyArray)}`, 'debug');

                } catch (e) {
                    logToPage(`Error calling resonate_string: ${e.message}\n${e.stack}`, 'error');
                    outputDisplay.textContent = `Error: ${e.message}`;
                    console.error("Error in resonate_string call:", e);
                }
            });
            logToPage("Event listener for 'Resonate' button updated.", 'info');
        } else {
            logToPage("Could not find 'resonate-button', 'resonate-input', or 'output' display.", 'error');
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
