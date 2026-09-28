export type TelemetryPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type SeverityLevel = 'nominal' | 'observation' | 'action' | 'critical';
export type AudioProfileTone = 'none' | 'soft' | 'attention' | 'urgent';
export type InterruptionLevel = 'background' | 'passive' | 'active' | 'mandatory';

export interface TelemetryEvent {
  event_id: string;
  mission_id: string;
  astronaut_id: string;
  timestamp: string;
  source_node: string;
  source_sensor: string;
  measurement: {
    type: string;
    value: number;
    unit: string;
  };
  quality: {
    confidence: number;
    error_margin: number;
    signal_quality: number;
  };
  priority: TelemetryPriority;
}

export interface HealthEvent {
  event_id: string;
  mission_id: string;
  astronaut_id: string;
  timestamp: string;
  status: SeverityLevel;
  confidence: number;
  factors: string[];
  priority: TelemetryPriority;
}

export interface EnvironmentalEvent {
  event_id: string;
  mission_id: string;
  timestamp: string;
  event_type: 'quiet' | 'solar_event' | 'solar_proton_pulse' | 'radiation_spike' | 'geomagnetic_storm';
  flux_value: number;
  unit: string;
  shielding_condition: 'nominal' | 'low' | 'enhanced';
  risk_score: number;
  priority: TelemetryPriority;
}

export interface RiskEvent {
  event_id: string;
  mission_id: string;
  astronaut_id: string;
  timestamp: string;
  risk_level: SeverityLevel;
  score: number;
  factors: string[];
  recommendation: string;
  priority: TelemetryPriority;
}

export interface AlertEvent {
  event_id: string;
  mission_id: string;
  astronaut_id: string;
  timestamp: string;
  severity: SeverityLevel;
  hud_symbol: string;
  hud_label: string;
  title: string;
  message: string;
  action_hint: string;
  audio_tone: AudioProfileTone;
  haptic_pattern: string;
  interruption_level: InterruptionLevel;
  priority: TelemetryPriority;
}

export interface DTNBundle {
  bundle_id: string;
  source_node: string;
  destination_node: string;
  creation_timestamp: string;
  priority: TelemetryPriority;
  ttl_seconds: number;
  payload: Record<string, unknown>;
  delivered: boolean;
  hop_count: number;
}

export interface CrewState {
  physiology: number;
  behavior: number;
  cognitive_load: number;
  fatigue: number;
  environmental_exposure: number;
  radiation_risk: number;
  mission_stress: number;
}

export interface MissionSnapshot {
  mission_id: string;
  crew_id: string;
  step: number;
  phase: string;
  phase_title: string;
  phase_message: string;
  link_status: 'live' | 'buffering' | 'restored';
  crew_state: CrewState;
  readings: Record<string, number>;
  health: {
    status: SeverityLevel;
    confidence: number;
    factors: string[];
  };
  behavior: {
    state: string;
    confidence: number;
    factors: string[];
  };
  environment: {
    event: 'quiet' | 'solar_event' | 'solar_storm';
    event_name: string;
    radiation_trend: 'stable' | 'increasing' | 'decreasing';
    shielding: 'high' | 'low';
    risk_score: number;
  };
  risk: {
    level: SeverityLevel;
    score: number;
    priority: TelemetryPriority;
    summary: string;
    factors: string[];
    recommendation: string;
  };
  alert: AlertEvent;
  anomalies: string[];
  telemetry: TelemetryEvent[];
  dtn: Record<string, unknown>;
  updated_at: string;
}