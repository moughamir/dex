use std::collections::HashMap;

use crate::providers::{
    capability::Capability,
    error::ProviderError,
    provider::Provider,
};

/// Central registry for all providers.
///
/// The registry owns provider instances and allows lookup by identifier
/// or by exposed capability.
pub struct ProviderRegistry {
    providers: HashMap<&'static str, Box<dyn Provider>>,
}

impl ProviderRegistry {
    /// Creates an empty registry.
    #[must_use]
    pub fn new() -> Self {
        Self {
            providers: HashMap::new(),
        }
    }

    /// Registers a provider.
    pub fn register(
        &mut self,
        provider: Box<dyn Provider>,
    ) -> Result<(), ProviderError> {
        let id = provider.id();

        if self.providers.contains_key(id) {
            return Err(ProviderError::AlreadyRegistered {
                id: id.to_owned(),
            });
        }

        self.providers.insert(id, provider);

        Ok(())
    }

    /// Unregisters a provider.
    pub fn unregister(
        &mut self,
        id: &str,
    ) -> Result<Box<dyn Provider>, ProviderError> {
        self.providers.remove(id).ok_or_else(|| ProviderError::NotFound {
            id: id.to_owned(),
        })
    }

    /// Returns a provider by identifier.
    #[must_use]
    pub fn provider(
        &self,
        id: &str,
    ) -> Option<&dyn Provider> {
        self.providers.get(id).map(Box::as_ref)
    }

    /// Returns all registered providers.
    #[must_use]
    pub fn providers(
        &self,
    ) -> Vec<&dyn Provider> {
        self.providers.values().map(Box::as_ref).collect()
    }

    /// Finds the first provider exposing the requested capability.
    #[must_use]
    pub fn capability(
        &self,
        capability: Capability,
    ) -> Option<&dyn Provider> {
        self.providers
            .values()
            .find(|provider| {
                provider.capabilities().contains(&capability)
            })
            .map(Box::as_ref)
    }

    /// Initializes all providers.
    pub fn initialize_all(
        &mut self,
    ) -> Result<(), ProviderError> {
        for provider in self.providers.values_mut() {
            provider.initialize()?;
        }

        Ok(())
    }

    /// Shuts down all providers.
    pub fn shutdown_all(
        &mut self,
    ) -> Result<(), ProviderError> {
        for provider in self.providers.values_mut() {
            provider.shutdown()?;
        }

        Ok(())
    }
}

impl Default for ProviderRegistry {
    fn default() -> Self {
        Self::new()
    }
}
