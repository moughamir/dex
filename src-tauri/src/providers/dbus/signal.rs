use std::collections::HashMap;

use zvariant::OwnedValue;

/// A D-Bus signal emitted by a remote service.
///
/// Signals are asynchronous events published by services such as:
/// - NetworkManager
/// - ModemManager
/// - UPower
/// - BlueZ
/// - Secret Service
#[derive(Debug, Clone)]
pub struct DbusSignal {
    /// Sender's unique bus name.
    pub sender: Option<String>,

    /// Object path that emitted the signal.
    pub path: String,

    /// Interface that defines the signal.
    pub interface: String,

    /// Signal name.
    pub member: String,

    /// Signal payload.
    pub body: HashMap<String, OwnedValue>,
}

impl DbusSignal {
    /// Creates a new signal.
    #[must_use]
    pub fn new(
        path: impl Into<String>,
        interface: impl Into<String>,
        member: impl Into<String>,
    ) -> Self {
        Self {
            sender: None,
            path: path.into(),
            interface: interface.into(),
            member: member.into(),
            body: HashMap::new(),
        }
    }

    /// Sets the sender.
    #[must_use]
    pub fn with_sender(
        mut self,
        sender: impl Into<String>,
    ) -> Self {
        self.sender = Some(sender.into());
        self
    }

    /// Adds a payload field.
    #[must_use]
    pub fn with_argument(
        mut self,
        name: impl Into<String>,
        value: OwnedValue,
    ) -> Self {
        self.body.insert(name.into(), value);
        self
    }

    /// Returns an argument by name.
    #[must_use]
    pub fn argument(
        &self,
        name: &str,
    ) -> Option<&OwnedValue> {
        self.body.get(name)
    }

    /// Returns true if the signal has a payload.
    #[must_use]
    pub fn has_arguments(&self) -> bool {
        !self.body.is_empty()
    }
}

impl Default for DbusSignal {
    fn default() -> Self {
        Self {
            sender: None,
            path: String::new(),
            interface: String::new(),
            member: String::new(),
            body: HashMap::new(),
        }
    }
}
