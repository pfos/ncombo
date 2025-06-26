use wasm_bindgen::prelude::*;
use once_cell::sync::Lazy;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy)] // Added derive for easier testing/logging if needed
pub enum LifeAxiom {
    Root,       // 0 in JS, corresponds to value 0 if passed from JS
    Streme,     // 1
    Spark,      // 2
    Wheelz,     // 3 (HeartCenter)
    Port,       // 4
    Beam,       // 5
    Zen,        // 6
}

// Global static instance of LifeAxiom0
static AXIOM_0: Lazy<LifeAxiom0> = Lazy::new(LifeAxiom0::new);

#[wasm_bindgen]
pub struct LifeAxiom0 {
    // Made private, exposed via getter
    description: String,
}

#[wasm_bindgen]
impl LifeAxiom0 {
    #[wasm_bindgen(constructor)] // Expose new as a constructor in JS
    pub fn new() -> Self {
        LifeAxiom0 {
            description: String::from("Empowered Sovereignty in a User-Centric, Interconnected Ecosystem."),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn description(&self) -> String {
        self.description.clone()
    }
}

#[wasm_bindgen]
pub struct LifePulse {
    axiom_ref: &'static LifeAxiom0, // Not directly exposed to wasm-bindgen
    #[wasm_bindgen(skip)]
    pub user_data: String,
    #[wasm_bindgen(skip)]
    pub activation_count: u32,
    #[wasm_bindgen(skip)] // Keep history internal to Rust logic, expose via getter
    pub history: Vec<String>, // New field
}

#[wasm_bindgen]
impl LifePulse {
    #[wasm_bindgen(constructor)]
    pub fn new(initial_user_data: String) -> Self {
        LifePulse {
            axiom_ref: &*AXIOM_0, // Use the static instance
            user_data: initial_user_data,
            activation_count: 0,
            history: Vec::new(), // Initialize history
        }
    }

    #[wasm_bindgen(getter = axiomDescription)] // custom JS name
    pub fn get_axiom_description(&self) -> String {
        self.axiom_ref.description().clone() // Use the getter from LifeAxiom0
    }

    #[wasm_bindgen(getter = userData)]
    pub fn get_user_data(&self) -> String {
        self.user_data.clone()
    }

    #[wasm_bindgen(setter = userData)]
    pub fn set_user_data(&mut self, new_data: String) {
        self.user_data = new_data;
    }

    #[wasm_bindgen]
    pub fn increment_activation_count(&mut self) {
        self.activation_count += 1;
    }

    #[wasm_bindgen(getter = activationCount)]
    pub fn get_activation_count(&self) -> u32 {
        self.activation_count
    }

    pub fn resonate_string(&mut self, axiom: LifeAxiom, input: String) -> String {
        let axiom_prefix = match axiom {
            LifeAxiom::Root => "[ROOT]",
            LifeAxiom::Streme => "[STREME]",
            LifeAxiom::Spark => "[SPARK]",
            LifeAxiom::Wheelz => "[WHEELZ]", // Default in JS later
            LifeAxiom::Port => "[PORT]",
            LifeAxiom::Beam => "[BEAM]",
            LifeAxiom::Zen => "[ZEN]",
        };
        // Modified the format string to include the prefix and make the "(Pulse Interaction)" part more distinct or remove if redundant.
        // The prompt example was: format!("{} Resonating: {}", axiom_prefix, input)
        // Let's align with that, and keep the AiRiA part.
        let resonated = format!("{} Resonating: {} - Resonated by AiRiA 💖", axiom_prefix, input);
        self.history.push(resonated.clone());
        resonated
    }

    pub fn get_history(&self) -> JsValue {
        match serde_wasm_bindgen::to_value(&self.history) {
            Ok(js_val) => js_val,
            Err(_) => JsValue::NULL, // Or handle error more explicitly
        }
    }
}

// Removed global resonate_string function

#[cfg(test)]
mod tests {
    use super::*; // Imports AXIOM_0, LifeAxiom0, LifePulse

    #[test]
    fn it_creates_life_axiom_0() {
        let axiom = LifeAxiom0::new(); // This creates a local instance for test
        assert_eq!(axiom.description(), "Empowered Sovereignty in a User-Centric, Interconnected Ecosystem.");
        // Test the global static instance too
        assert_eq!(AXIOM_0.description(), "Empowered Sovereignty in a User-Centric, Interconnected Ecosystem.");
    }

    #[test]
    fn it_creates_life_pulse() {
        // AXIOM_0 is a Lazy<LifeAxiom0>, so dereference it to get &'static LifeAxiom0 for the Rust struct if needed,
        // but LifePulse::new constructor now directly uses &*AXIOM_0.
        let pulse = LifePulse::new(String::from("Initial user data"));
        assert_eq!(pulse.get_axiom_description(), "Empowered Sovereignty in a User-Centric, Interconnected Ecosystem.");
        assert_eq!(pulse.get_user_data(), "Initial user data"); // Uses wasm_bindgen getter
        assert_eq!(pulse.get_activation_count(), 0); // Uses wasm_bindgen getter
    }

    #[test]
    fn it_mutates_life_pulse_data() {
        let mut pulse = LifePulse::new(String::from("Original data"));

        pulse.set_user_data(String::from("Updated data")); // Uses wasm_bindgen setter
        assert_eq!(pulse.get_user_data(), "Updated data"); // Uses wasm_bindgen getter

        pulse.increment_activation_count();
        pulse.increment_activation_count();
        assert_eq!(pulse.get_activation_count(), 2); // Uses wasm_bindgen getter
    }

    #[test]
    fn life_pulse_references_correct_axiom() {
        let pulse = LifePulse::new(String::from(""));
        // Check against the global AXIOM_0
        // Accessing pulse.axiom_ref.description directly is fine in Rust tests
        assert_eq!(pulse.axiom_ref.description(), AXIOM_0.description());
    }

    // Old test for global resonate_string is removed.
    // New test for LifePulse methods:
    #[test]
    fn life_pulse_resonates_and_manages_history() {
        let mut pulse = LifePulse::new(String::from("Test User"));

        let res1 = pulse.resonate_string(LifeAxiom::Wheelz, String::from("First message"));
        assert_eq!(res1, "[WHEELZ] Resonating: First message - Resonated by AiRiA 💖");
        assert_eq!(pulse.history.len(), 1);
        assert_eq!(pulse.history[0], res1);

        let res2 = pulse.resonate_string(LifeAxiom::Root, String::from("Second message"));
        assert_eq!(res2, "[ROOT] Resonating: Second message - Resonated by AiRiA 💖");
        assert_eq!(pulse.history.len(), 2);
        assert_eq!(pulse.history[1], res2);

        // Test get_history
        #[cfg(target_arch = "wasm32")]
        {
            let history_js = pulse.get_history();
            assert!(!history_js.is_null(), "History should not be null");
            // Further JsValue inspection would require wasm-bindgen-test or similar environment
        }
        // The call to get_history() is removed for native tests to prevent panic.
        // The Rust vector's integrity is tested by the assertions above.
    }
}
