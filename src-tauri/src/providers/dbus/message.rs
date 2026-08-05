use std::collections::HashMap;

use zvariant::OwnedValue;

/// Generic D-Bus message.
///
/// This is a transport-independent representation used internally by DEX.
/// It is intentionally decoupled from `zbus::Message` so providers are not
/// tightly coupled to the underlying D-Bus library.
#[derive(Debug, Clone, Default)]
pub struct DbusMessage {
    /// Destination service.
    pub destination: String,

    /// Object path.
    pub path: String,

    /// Interface name.
    pub interface: String,

    /// Method or signal member.
    pub member: String,

    /// Named arguments.
    pub body: HashMap<String, OwnedValue>,
}

impl DbusMessage {
    /// Creates a new D-Bus message.
    #[must_use]
    pub fn new(
        destination: impl Into<String>,
        path: impl Into<String>,
        interface: impl Into<String>,
        member: impl Into<String>,
    ) -> Self {
        Self {
            destination: destination.into(),
            path: path.into(),
            interface: interface.into(),
            member: member.into(),
            body: HashMap::new(),
        }
    }

    /// Adds an argument to the message body.
    #[must_use]
    pub fn with_argument(mut self, name: impl Into<String>, value: OwnedValue) -> Self {
        self.body.insert(name.into(), value);
        self
    }

    /// Returns true if the message has arguments.
    #[must_use]
    pub fn has_arguments(&self) -> bool {
        !self.body.is_empty()
    }

    /// Returns an argument by name.
    #[must_use]
    pub fn argument(&self, name: &str) -> Option<&OwnedValue> {
        self.body.get(name)
    }
}
