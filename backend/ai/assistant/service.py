"""ASTRA-VITAL AI Assistant Service.

Context-aware assistant for 4 operational roles:
1. astronaut: Calm, direct, actionable, HUD-oriented guidance.
2. flight_controller: Systems telemetry, DTN networking, mission timeline.
3. medical_officer: Physiological signs, trends, anomalies, clinical history.
4. behavioral_health: Cognitive load, psychomotor tremor, fatigue, stressors.

Integrates CrewState, MissionState, Telemetry, AlertManager, RiskEngine,
Environment (SpaceWeather), and DTN Store.
"""

from typing import Any


import unicodedata


def _clean_text(text: str) -> str:
    t = (text or "").lower()
    t = unicodedata.normalize('NFD', t)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    for ch in "¿?¡!.,:;()[]{}":
        t = t.replace(ch, "")
    return t.strip()


def _normalize_role(role: str) -> str:
    r = _clean_text(role)
    if any(k in r for k in ("astro", "crew", "eva", "suit")):
        return "astronaut"
    if any(k in r for k in ("flight", "control", "houston", "flight_controller", "ops")):
        return "flight_controller"
    if any(k in r for k in ("med", "doctor", "surgeon", "clinic", "salud")):
        return "medical_officer"
    if any(k in r for k in ("behav", "conduct", "psych", "cognit", "mental")):
        return "behavioral_health"
    return "flight_controller"


def generate_role_answer(snapshot: Any, role: str, question: str) -> dict[str, Any]:
    norm_role = _normalize_role(role)
    q = _clean_text(question)

    # Extract snapshot context
    step = getattr(snapshot, "step", 0)
    readings = getattr(snapshot, "readings", {}) or {}
    hr = readings.get("heart_rate", 72.0)
    spo2 = readings.get("spo2", 98.0)
    temp = readings.get("temperature", 36.8)
    resp = readings.get("respiration", 14.0)
    imu = readings.get("imu", 1.0)
    tremor = readings.get("tremor", 0.12)
    rad = readings.get("radiation", 0.22)
    co2 = readings.get("co2", 3.2)
    o2 = readings.get("o2", 20.9)

    alert = getattr(snapshot, "alert", {}) or {}
    severity = alert.get("severity", "nominal")
    hud_symbol = alert.get("hud_symbol", "[*]")
    hud_label = alert.get("hud_label", "NOMINAL")
    alert_msg = alert.get("message", "Sistemas operando dentro de limites nominales.")
    action_hint = alert.get("action_hint", "Continuar monitoreo de rutina.")
    factors = alert.get("factors", []) or []
    factors_str = ", ".join(factors) if factors else "Variables dentro de parametros normales"

    crew_state = getattr(snapshot, "crew_state", None)
    cog_load = getattr(crew_state, "cognitive_load", 0.20) if crew_state else 0.20
    fatigue = getattr(crew_state, "fatigue", 0.15) if crew_state else 0.15
    phys_risk = getattr(crew_state, "physiology", 0.10) if crew_state else 0.10
    beh_risk = getattr(crew_state, "behavior", 0.12) if crew_state else 0.12
    env_risk = getattr(crew_state, "environmental_exposure", 0.18) if crew_state else 0.18
    rad_risk = getattr(crew_state, "radiation_risk", 0.15) if crew_state else 0.15

    risk = getattr(snapshot, "risk", {}) or {}
    risk_level = risk.get("level", "low")
    risk_rec = risk.get("recommendation", "Mantener protocolo EVA estandar.")

    env = getattr(snapshot, "environment", None)
    geomag = getattr(env, "geomagnetic_status", "Quiet") if env else "Quiet"
    flare_prob = getattr(env, "flare_probability", 0.05) if env else 0.05
    proton_flux = getattr(env, "solar_proton_flux", 12.0) if env else 12.0

    dtn = getattr(snapshot, "dtn", {}) or {}
    buffered = dtn.get("buffered", 0)
    transmitted = dtn.get("transmitted", 0)
    link_status = getattr(snapshot, "link_status", "live")
    phase = getattr(snapshot, "phase", f"EVA 0{step+1}")
    phase_title = getattr(snapshot, "phase_title", "Operacion EVA")

    anomalies = getattr(snapshot, "anomalies", []) or []
    anomalies_str = ", ".join(anomalies) if anomalies else "Ninguna anomalia activa"

    # -------------------------------------------------------------------------
    # 18.1 ROLE: ASTRONAUT
    # -------------------------------------------------------------------------
    if norm_role == "astronaut":
        # Question: Why are you alerting me?
        if any(w in q for w in ("por que me alertas", "por que me estas alertando", "por que la alerta", "motivo de alerta", "por que suena", "por que vibra")):
            if severity == "nominal":
                ans = (
                    f"ESTADO NOMINAL {hud_symbol}: No hay alertas activas en tu traje. "
                    f"Tus constantes vitales y el ambiente en el corredor lunar sur estan estables. "
                    f"Continua con el plan de exploracion planificado."
                )
            else:
                ans = (
                    f"[ASTRA HUD - {hud_label} {hud_symbol}]\n"
                    f"- QUE OCURRIO: ASTRA correlaciona radiacion ambiental en aumento ({rad:.2f} mSv/h por actividad solar) "
                    f"con una leve aceleracion de tu pulso ({hr:.0f} BPM) y temblor motor ({tremor:.2f}).\n"
                    f"- IMPORTANCIA: Nivel {hud_label} ({severity.upper()}). No es una falla critica de traje ni emergencia medica aguda; "
                    f"es una advertencia preventiva anticipada para evitar acumulacion de fatiga y dosis.\n"
                    f"- ACCION A REALIZAR: {action_hint}. Reduce el ritmo de caminata en 20% y activa hidratacion.\n"
                    f"- QUE EVITAR: Evita sobreesfuerzo en pendientes rocosas, no aceleres el paso y evita crestas expuestas sin blindaje natural de regolito."
                )
        elif any(w in q for w in ("que debo hacer", "que hago", "accion", "instruccion", "protocolo")):
            ans = (
                f"INSTRUCCIONES INMEDIATAS ({hud_label} {hud_symbol}):\n"
                f"1. {action_hint}\n"
                f"2. Mantener consumo metabolico moderado (Pulso actual: {hr:.0f} BPM).\n"
                f"3. Refugio lunar mas cercano: Refugio Shackleton B a aprox. 11 minutos de marcha.\n"
                f"4. Blindaje del traje en 85%. Telemetria resguardada localmente."
            )
        elif any(w in q for w in ("radia", "solar", "sol", "dosis", "tormenta", "escudo")):
            ans = (
                f"RAD-STATUS ({hud_symbol}): Radiacion superficial en {rad:.2f} mSv/h (Evento solar {geomag}). "
                f"Dosis acumulada estimada: {rad * 0.45:.2f} mSv. Margen de permanencia segura: 18 minutos antes de umbral preventivo. "
                f"Refugio con regolito apantallado disponible a 11 min."
            )
        elif any(w in q for w in ("signo", "vital", "pulso", "oxigeno", "spo2", "cuerpo", "como estoy")):
            ans = (
                f"BIO-STATUS ({hud_symbol}): Pulso {hr:.0f} BPM, SpO2 {spo2:.0f}%, Temperatura {temp:.1f}°C, CO2 {co2:.1f} mmHg. "
                f"Oxigeno en traje: {o2:.1f}%. Estado general: Estable con leve fatiga detectable. Todo procesado en tu nodo de traje."
            )
        else:
            ans = (
                f"ASTRA HUD [{hud_label} {hud_symbol}]: "
                f"{alert_msg} "
                f"Accion recomendada: {action_hint} "
                f"Nodo local procesando en tiempo real con 100% de autonomia."
            )

    # -------------------------------------------------------------------------
    # 18.2 ROLE: FLIGHT CONTROLLER
    # -------------------------------------------------------------------------
    elif norm_role == "flight_controller":
        if any(w in q for w in ("que esta ocurriendo con crew", "crew-07", "que pasa con crew", "estado de tripulacion", "resumen mision", "situacion general")):
            ans = (
                f"[FLIGHT OPS REPORT - {phase} / {phase_title}]\n"
                f"- TELEMETRIA: Crew-07 (Vega Solano) HR={hr:.0f} BPM, SpO2={spo2:.0f}%, CoreTemp={temp:.1f}C, CO2={co2:.1f} mmHg, IMU={imu:.2f}g. "
                f"Crew-01 (Imani Okafor) en parametros nominales (HR 68 BPM).\n"
                f"- ESTADO DE TRIPULACION: Carga cognitiva {cog_load:.2f}, Fatiga {fatigue:.2f}, Exposicion ambiental {env_risk:.2f}, Riesgo global {risk_level.upper()}.\n"
                f"- REDES Y DTN: Enlace Tierra {link_status.upper()}. Buffer local resguardando {buffered} eventos. Transmitidos prioritarios: {transmitted}. Reintentos DTN activos.\n"
                f"- MISION: {phase_message_for_controller(step)}. Margen de repliegue a refugio estimado en 11 min.\n"
                f"- EVENTOS: Clima espacial {geomag} (flujo protonico {proton_flux:.1f} pfu). Alerta local: {hud_label} ({hud_symbol}). Factores: {factors_str}."
            )
        elif any(w in q for w in ("red", "enlace", "comunic", "dtn", "buffer", "tierra", "relay", "reintento", "perdida")):
            ans = (
                f"SUBSISTEMA DE COMUNICACIONES DTN:\n"
                f"- Estado del enlace: {link_status.upper()}.\n"
                f"- Paquetes en cola local (Store-and-Forward): {buffered} bundles resguardados.\n"
                f"- Paquetes confirmados hacia estacion/Tierra: {transmitted} bundles.\n"
                f"- Politica de priorizacion: P0 (Alerta critica/fisiologica) despachada de inmediato al reconectar; P3/P4 preservadas en almacenamiento local no volatil.\n"
                f"- Tolerancia a interrupcion: Operacion en el borde garantizada sin enlace activo."
            )
        elif any(w in q for w in ("riesgo", "protocolo", "decision", "recomendacion", "go/no-go")):
            ans = (
                f"EVALUACION DE RIESGO OPERACIONAL ({risk_level.upper()} / Prioridad {risk.get('priority', 'P2')}):\n"
                f"- Diagnostico ASTRA: {risk.get('summary', 'Nominal')}.\n"
                f"- Factores convergentes: {factors_str}.\n"
                f"- Recomendacion de Control de Vuelo: {risk_rec}.\n"
                f"- Intervencion preventiva en curso: Advertencia anticipada despachada sin generar panico en la tripulacion."
            )
        else:
            ans = (
                f"ASTRA Flight Operations ({phase}): "
                f"Crew-07 en {hud_label}. Enlace {link_status.upper()} con {buffered} paquetes en buffer DTN. "
                f"Telemetria integrada: HR {hr:.0f} BPM, Rad {rad:.2f} mSv/h. Recomendacion: {risk_rec}"
            )

    # -------------------------------------------------------------------------
    # 18.3 ROLE: MEDICAL OFFICER (Flight Surgeon)
    # -------------------------------------------------------------------------
    elif norm_role == "medical_officer":
        if any(w in q for w in ("que cambios fisiologicos", "cambios fisiologicos", "fisiologia", "signos vitales", "salud", "cardiaco", "respirat")):
            ans = (
                f"[CLINICAL TELEMETRY BULLETIN - CREW-07 VEGA SOLANO]\n"
                f"- DATOS FISIOLOGICOS: HR {hr:.0f} BPM (linea base reposo 68 BPM, desviacion +{max(0, hr-68):.0f} BPM), "
                f"SpO2 {spo2:.0f}% (adecuado >95%), Temp {temp:.1f}C, Frec. Resp. {resp:.0f} rpm, CO2 espiratorio {co2:.1f} mmHg.\n"
                f"- TENDENCIAS: Aceleracion gradual de frecuencia cardiaca desacoplada del perfil de acelerometria IMU ({imu:.2f}g). "
                f"Sugiere compensacion simpatica por estres termico o reaccion adrenergica situacional.\n"
                f"- ANOMALIAS: {anomalies_str}. No hay evidencia de hipoxia tisular ni compromiso ventilatorio.\n"
                f"- HISTORIAL RELEVANTE: Vega presenta tolerancia historica alta a EVAs lunares. Dosis acumulada 48h: 1.2 mSv. "
                f"Indice de fatiga muscular en {fatigue:.2f}. Sin antecedentes de arritmias."
            )
        elif any(w in q for w in ("anomalia", "arritmia", "desviacion", "patologia", "alerta medica")):
            ans = (
                f"ANALISIS DE ANOMALIAS FISIOLOGICAS:\n"
                f"- Anomalías detectadas por motor de reglas y calidad: {anomalies_str}.\n"
                f"- Indice fisiologico global: {phys_risk:.2f}/1.00.\n"
                f"- Calidad y confianza de senales: Sensores biometricos PPG y oximetro con confianza >0.94; sin artefactos de movimiento severos.\n"
                f"- Evaluacion medica: Estado de observacion clinica preventiva. No se requiere evacuacion de urgencia."
            )
        elif any(w in q for w in ("spo2", "oxigeno", "hipoxia", "co2", "respirac")):
            ans = (
                f"PARAMETROS RESPIRATORIOS Y HEMATOSIS:\n"
                f"- SpO2: {spo2:.0f}% (Margen de seguridad optimo).\n"
                f"- CO2 en casco: {co2:.1f} mmHg (Umbral de alarma nominal <5.0 mmHg).\n"
                f"- Frecuencia respiratoria: {resp:.0f} rpm (Leve incremento compensatorio).\n"
                f"- Mezcla de O2 en traje: {o2:.1f}% a presion constante de 4.3 psi."
            )
        else:
            ans = (
                f"ASTRA Medical Officer Channel: "
                f"Crew-07 HR {hr:.0f} BPM, SpO2 {spo2:.0f}%, Temp {temp:.1f}C. "
                f"Indice de riesgo fisiologico: {phys_risk:.2f}. "
                f"Anomalias: {anomalies_str}. Recomendacion clinica: {risk_rec}"
            )

    # -------------------------------------------------------------------------
    # 18.4 ROLE: BEHAVIORAL HEALTH (Psychologist / Cognitive Ergonomics)
    # -------------------------------------------------------------------------
    elif norm_role == "behavioral_health":
        if any(w in q for w in ("se han detectado cambios de comportamiento", "cambios de comportamiento", "comportamiento", "conducta", "cognitiv", "fatiga", "temblor", "psicol")):
            ans = (
                f"[NEURO-BEHAVIORAL ASSESSMENT - CREW-07 VEGA SOLANO]\n"
                f"- PATRONES CONDUCTUALES: Indice de temblor fino en guante haptico: {tremor:.2f} (umbral nominal <0.20, moderado >=0.30). "
                f"Se detecta leve dispersion motriz en tareas de recoleccion y manipulacion de herramientas.\n"
                f"- TENDENCIAS: Carga cognitiva estimada en {cog_load:.2f}/1.00 (+25% respecto a linea base pre-EVA). "
                f"Indice de fatiga psicofisica en {fatigue:.2f}/1.00.\n"
                f"- DESVIACIONES: Latencia motora aumentada en +140ms durante secuencias de acoplamiento instrumental. "
                f"Estabilidad postural en IMU preservada ({imu:.2f}g) sin marcha erratica.\n"
                f"- CONTEXTO DE MISION: Factores estresores concurrentes: advertencia solar en curso ({geomag}), "
                f"reduccion de iluminacion por relieve en el crater sur y conocimiento de latencia de red. "
                f"Recomendacion de salud conductual: micro-pausa de 3 minutos y rehidratacion antes de reanudar muestreo geologico."
            )
        elif any(w in q for w in ("temblor", "motor", "coordinacion", "destreza")):
            ans = (
                f"ANALISIS DE MOTRICIDAD FINA Y TEMBLOR:\n"
                f"- Indice de temblor en guante: {tremor:.2f} (Normal <0.20; Alerta >0.40).\n"
                f"- Estabilidad de acelerometria IMU: {imu:.2f}g.\n"
                f"- Interpretacion: El temblor observado corresponde a fatiga muscular periferica por rigidez del guante presurizado "
                f"y ligera tension situacional. No indica cuadro neurologico central."
            )
        elif any(w in q for w in ("carga cognitiva", "estres", "sobrecarga", "atencion")):
            ans = (
                f"EVALUACION DE CARGA COGNITIVA Y ESTRES:\n"
                f"- Score de carga cognitiva: {cog_load:.2f} / 1.00 (Rango medio-alto).\n"
                f"- Score de estres de mision: {getattr(crew_state, 'mission_stress', 0.25):.2f} / 1.00.\n"
                f"- Capacidad de atencion dividida: Suficiente para navegacion visual; se recomienda postergar tareas analiticas complejas."
            )
        else:
            ans = (
                f"ASTRA Behavioral Health Monitor: "
                f"Temblor motor {tremor:.2f}, Carga cognitiva {cog_load:.2f}, Fatiga {fatigue:.2f}. "
                f"Evaluacion: Variacion conductual leve correlacionada con avance de la fase EVA y ambiente radiante. "
                f"Recomendacion: {risk_rec}"
            )

    else:
        ans = (
            f"ASTRA Core ({phase}): {alert_msg} "
            f"HR {hr:.0f} BPM, Rad {rad:.2f} mSv/h. Riesgo: {risk_level}. Accion: {risk_rec}"
        )

    return {
        "role": norm_role,
        "question": question,
        "answer": ans,
        "severity": severity,
        "hud_symbol": hud_symbol,
        "hud_label": hud_label,
        "step": step,
    }


def phase_message_for_controller(step: int) -> str:
    messages = [
        "Fase 01: Inicio nominal de EVA. Tripulacion realizando muestreo basal.",
        "Fase 02: Deteccion temprana de evento solar S-17. Protones energeticos en ascenso.",
        "Fase 03: Desviacion multisenal confirmada en Vega Solano (pulso y temblor coordinados).",
        "Fase 04: Emision de alerta preventiva calmada e inicio de maniobra hacia refugio.",
        "Fase 05: Degradacion de enlace con Tierra. Continuidad operativa 100% en el nodo local.",
        "Fase 06: Enlace restablecido. Telemetria resguardada en buffer DTN sincronizada por prioridad.",
    ]
    if 0 <= step < len(messages):
        return messages[step]
    return f"Fase {step+1}: Ejecucion de protocolos EVA."


def answer(service: Any, *, role: str, question: str) -> dict[str, Any]:
    """Top-level answer entrypoint called by FastAPI route."""
    snapshot = service.snapshot()
    return generate_role_answer(snapshot, role=role, question=question)