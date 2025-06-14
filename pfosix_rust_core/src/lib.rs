use wasm_bindgen::prelude::*;
use once_cell::sync::Lazy;

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
}

#[wasm_bindgen]
impl LifePulse {
    #[wasm_bindgen(constructor)]
    pub fn new(initial_user_data: String) -> Self {
        LifePulse {
            axiom_ref: &*AXIOM_0, // Use the static instance
            user_data: initial_user_data,
            activation_count: 0,
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
}

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
}
