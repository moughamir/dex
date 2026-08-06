use serde::{Deserialize, Serialize};

/// Capabilities exposed by providers.
///
/// Modules request capabilities from the ProviderRegistry rather than
/// depending on concrete provider implementations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Capability {
    DBus,
    Network,
    Modem,
    Filesystem,
    Terminal,
    Process,
    Git,
    SSH,
    GPG,
    Notifications,
    Secrets,
    Wayland,
    Hyprland,
    /// Ability to spawn new OS processes.
    SpawnProcess,
    /// Ability to terminate running OS processes.
    KillProcess,
}

impl Capability {
    /// Stable identifier for serialization, logging and diagnostics.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::DBus => "dbus",
            Self::Network => "network",
            Self::Modem => "modem",
            Self::Filesystem => "filesystem",
            Self::Terminal => "terminal",
            Self::Process => "process",
            Self::Git => "git",
            Self::SSH => "ssh",
            Self::GPG => "gpg",
            Self::Notifications => "notifications",
            Self::Secrets => "secrets",
            Self::Wayland => "wayland",
            Self::Hyprland => "hyprland",
            Self::SpawnProcess => "spawn_process",
            Self::KillProcess => "kill_process",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Capability;

    /// Every capability maps to a stable, documented wire identifier.
    #[test]
    fn as_str_is_stable_and_snake_case() {
        let cases = [
            (Capability::DBus, "dbus"),
            (Capability::Network, "network"),
            (Capability::Modem, "modem"),
            (Capability::Filesystem, "filesystem"),
            (Capability::Terminal, "terminal"),
            (Capability::Process, "process"),
            (Capability::Git, "git"),
            (Capability::SSH, "ssh"),
            (Capability::GPG, "gpg"),
            (Capability::Notifications, "notifications"),
            (Capability::Secrets, "secrets"),
            (Capability::Wayland, "wayland"),
            (Capability::Hyprland, "hyprland"),
            (Capability::SpawnProcess, "spawn_process"),
            (Capability::KillProcess, "kill_process"),
        ];

        for (capability, expected) in cases {
            assert_eq!(capability.as_str(), expected);
        }
    }

    /// The derived serde round-trip preserves variant identity.
    #[test]
    fn serde_round_trip_preserves_variant() {
        for capability in [
            Capability::DBus,
            Capability::Process,
            Capability::SpawnProcess,
            Capability::KillProcess,
            Capability::Hyprland,
        ] {
            let serialized = serde_json::to_value(capability).expect("serialize");
            let parsed: Capability = serde_json::from_value(serialized).expect("deserialize");
            assert_eq!(parsed, capability);
        }
    }

    /// The process provider advertises spawn/kill as distinct capabilities.
    #[test]
    fn process_capabilities_are_distinct() {
        assert_ne!(Capability::Process, Capability::SpawnProcess);
        assert_ne!(Capability::Process, Capability::KillProcess);
        assert_ne!(Capability::SpawnProcess, Capability::KillProcess);
    }
}
