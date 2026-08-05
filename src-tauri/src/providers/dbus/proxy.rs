use zbus::Proxy;

use super::{
    connection::DbusConnection,
    error::DbusError,
};

/// Generic D-Bus proxy.
///
/// Wraps a `zbus::Proxy` and provides a stable abstraction for all
/// DEX providers that communicate over D-Bus.
///
/// Specialized providers (NetworkManager, ModemManager, UPower,
/// BlueZ, Secret Service, etc.) compose this type rather than
/// interacting with `zbus::Proxy` directly.
pub struct DbusProxy<'a> {
    proxy: Proxy<'a>,
}

impl<'a> DbusProxy<'a> {
    /// Creates a new D-Bus proxy.
    pub async fn new(
        connection: &'a DbusConnection,
        destination: &str,
        path: &str,
        interface: &str,
    ) -> Result<Self, DbusError> {
        let proxy = Proxy::new(
            connection.inner(),
            destination,
            path,
            interface,
        )
        .await
        .map_err(|_| DbusError::ProxyCreationFailed {
            service: destination.to_owned(),
            path: path.to_owned(),
            interface: interface.to_owned(),
        })?;

        Ok(Self { proxy })
    }

    /// Returns the underlying zbus proxy.
    #[must_use]
    pub fn inner(&self) -> &Proxy<'a> {
        &self.proxy
    }

    /// Returns the destination service.
    #[must_use]
    pub fn destination(&self) -> &str {
        self.proxy.destination()
    }

    /// Returns the object path.
    #[must_use]
    pub fn path(&self) -> &str {
        self.proxy.path()
    }

    /// Returns the interface name.
    #[must_use]
    pub fn interface(&self) -> &str {
        self.proxy.interface()
    }

    /// Calls a D-Bus method.
    pub async fn call<R, B>(
        &self,
        method: &str,
        body: &B,
    ) -> Result<R, DbusError>
    where
        R: zvariant::Type + serde::de::DeserializeOwned,
        B: serde::ser::Serialize + zvariant::DynamicType,
    {
        self.proxy
            .call(method, body)
            .await
            .map_err(|error| DbusError::MethodCallFailed {
                method: method.to_owned(),
                reason: error.to_string(),
            })
    }
}
