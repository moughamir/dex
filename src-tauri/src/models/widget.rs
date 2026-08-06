//! Widget wire models: layout placement and widget descriptors.

use serde::{Deserialize, Serialize};

/// Placement of one widget instance on the dashboard grid.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct WidgetPlacement {
    pub id: String,
    pub kind: String,
    pub column: i64,
    pub row: i64,
    pub width: i64,
    pub height: i64,
}

/// The active widget layout (ordered placements).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WidgetLayout {
    pub active: Vec<WidgetPlacement>,
}

/// Width/height of a widget in grid cells.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct WidgetSize {
    pub width: i64,
    pub height: i64,
}

/// Static descriptor of a widget kind available in the catalog.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WidgetDescriptor {
    pub kind: String,
    pub name: String,
    pub description: String,
    pub default_size: WidgetSize,
}