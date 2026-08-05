use zbus::Connection;

use super::error::DbusError;

/// Owns the connection to the system D-Bus.
///
/// This is the transport layer used by all D-Bus based providers
/// (NetworkManager, ModemManager, UPower, BlueZ, Secret Service, etc.).
pub struct DbusConnection {
    connection: Connection,
}

impl DbusConnection {
    /// Connect to the system bus.
    pub async fn system() -> Result<Self, DbusError> {
        let connection = Connection::system()
            .await
            .map_err(|error| DbusError::ConnectionFailed {
                reason: error.to_string(),
            })?;

        Ok(Self { connection })
    }

    /// Connect to the session bus.
    pub async fn session() -> Result<Self, DbusError> {
        let connection = Connection::session()
            .await
            .map_err(|error| DbusError::ConnectionFailed {
                reason: error.to_string(),
            })?;

        Ok(Self { connection })
    }

    /// Returns the underlying zbus connection.
    #[must_use]
    pub fn inner(&self) -> &Connection {
        &self.connection
    }

    /// Returns true if the connection is alive.
    #[must_use]
    pub fn is_connected(&self) -> bool {
        !self.connection.executor().is_finished()
    }

    /// Returns the unique bus name assigned by D-Bus.
    pub async fn unique_name(&self) -> Result<String, DbusError> {
        let name = self
            .connection
            .unique_name()
            .ok_or(DbusError::ConnectionClosed)?;

        Ok(name.to_string())
    }
}
