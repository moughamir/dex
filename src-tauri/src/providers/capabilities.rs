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
        }
    }
}
