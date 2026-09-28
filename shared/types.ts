export type TelemetryPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

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
    status: 'nominal' | 'observation' | 'action' | 'critical';
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
    level: 'nominal' | 'observation' | 'action' | 'critical';
    score: number;
    priority: TelemetryPriority;
    summary: string;
    factors: string[];
    recommendation: string;
  };
  anomalies: string[];
  telemetry: TelemetryEvent[];
  dtn: Record<string, number>;
  updated_at: string;
}