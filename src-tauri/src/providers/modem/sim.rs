use serde::{Deserialize, Serialize};

/// SIM card information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimCard {
    /// Stable identifier.
    pub id: String,

    /// ICCID.
    pub iccid: Option<String>,

    /// IMSI.
    pub imsi: Option<String>,

    /// Operator name.
    pub operator: Option<String>,

    /// Mobile Country Code.
    pub mcc: Option<String>,

    /// Mobile Network Code.
    pub mnc: Option<String>,

    /// Phone number (MSISDN).
    pub number: Option<String>,

    /// Current SIM state.
    pub state: SimState,
}

impl SimCard {
    #[must_use]
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            iccid: None,
            imsi: None,
            operator: None,
            mcc: None,
            mnc: None,
            number: None,
            state: SimState::Unknown,
        }
    }

    #[must_use]
    pub fn is_ready(&self) -> bool {
        self.state == SimState::Ready
    }

    #[must_use]
    pub fn requires_pin(&self) -> bool {
        self.state == SimState::PinRequired
    }

    #[must_use]
    pub fn requires_puk(&self) -> bool {
        self.state == SimState::PukRequired
    }

    #[must_use]
    pub fn is_present(&self) -> bool {
        self.state != SimState::Absent
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SimState {
    Unknown,
    Absent,
    Locked,
    PinRequired,
    PukRequired,
    Ready,
    Error,
}
