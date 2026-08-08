import type { AccessTechnology, ModemState, SimState } from "./common";

export interface ModemSignal {
  quality: number;
  rssi: number | null;
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
}

export interface SimInfo {
  iccid: string | null;
  imsi: string | null;
  operator: string | null;
  mcc: string | null;
  mnc: string | null;
  number: string | null;
  state: SimState;
}

export interface ModemBearer {
  apn: string | null;
  ipv4: string | null;
  ipv6: string | null;
}

export interface ModemInfo {
  id: string;
  manufacturer: string;
  model: string;
  device: string;
  imei: string | null;
  operator: string | null;
  technology: AccessTechnology;
  state: ModemState;
  signal: ModemSignal;
  sim: SimInfo | null;
  bearer: ModemBearer | null;
  registered: boolean;
}

export interface ModemListResult {
  modems: ModemInfo[];
}
