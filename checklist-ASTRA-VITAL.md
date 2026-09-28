# ✅ CHECKLIST DE IMPLEMENTACIÓN — SPACE APPS CHALLENGE

> Plataforma distribuida de monitoreo y prevención de salud para astronautas.
> Cada ítem corresponde a un detalle del plan. Marca `[x]` al completar.

**Lema:** DETECTAR → ENTENDER → PREDECIR → PREVENIR → ACTUAR

---

## 📊 PROGRESO GENERAL

- [x] Fase 1 — Arquitectura ✅
- [x] Fase 2 — Simulador ✅
- [x] Fase 3 — Data Quality ✅
- [x] Fase 4 — Risk Engine ✅
- [x] Fase 5 — IA ✅
- [x] Fase 6 — Alert Manager ✅
- [x] Fase 7 — Comunicación ✅
- [x] Fase 8 — Frontend ✅
- [x] Fase 9 — AI Assistant ✅
- [x] Fase 10 — Demo final ✅

---

## 0. VISIÓN Y ALCANCE

- [ ] Documentar que el proyecto NO es solo un sistema que "mide signos vitales"
- [ ] Definir el proyecto como plataforma distribuida de monitoreo y prevención de salud para astronautas
- [ ] Garantizar operación local del sistema
- [ ] Garantizar continuidad de operación con comunicación limitada o interrumpida
- [ ] Definir foco principal: misiones lunares
- [ ] Diseñar arquitectura escalable a Marte
- [ ] Diseñar arquitectura escalable a Venus
- [ ] Diseñar arquitectura escalable a otras misiones de espacio profundo
- [ ] Asegurar que el astronauta no dependa de Tierra para reaccionar ante un evento inmediato

---

## 1. OBJETIVO GENERAL

### Flujo del sistema
- [ ] Detectar
- [ ] Interpretar
- [ ] Contextualizar
- [ ] Prevenir
- [ ] Alertar
- [ ] Transmitir
- [ ] Almacenar
- [ ] Sincronizar

### Información que el sistema debe combinar
- [ ] Telemetría fisiológica
- [ ] Sensores ambientales
- [ ] Análisis de comportamiento
- [ ] Detección de anomalías
- [ ] Inteligencia artificial
- [ ] Predicción de riesgos
- [ ] Información de actividad solar
- [ ] Comunicación tolerante a interrupciones
- [ ] Interfaces específicas para astronautas
- [ ] Interfaces específicas para personal en Tierra

---

## 2. ARQUITECTURA GENERAL

- [ ] Definir cadena de nodos: Astronauta/Traje → Health Edge Node → Vehicle/Relay Node → Lunar Station/Gateway → DSN → Earth/Mission Control
- [ ] Diagramar la cadena de nodos
- [ ] Definir responsabilidades distintas para cada nodo
- [ ] Crear un núcleo de software común para todos los nodos
- [ ] Crear adaptadores según hardware y sistema operativo
- [ ] Documentar la arquitectura general (entregable Fase 1)

---

## 3. PRINCIPIO DE EDGE COMPUTING

- [ ] No asumir conexión permanente a Internet o a Tierra
- [ ] Implementar flujo local: Astronauta → procesamiento local → decisión local → alerta inmediata
- [ ] Implementar flujo posterior: Nodo local → Vehículo → Estación → Tierra
- [ ] Justificar la importancia para Luna
- [ ] Justificar la importancia para Marte
- [ ] Implementar concepto **Store-and-Forward**
- [ ] Al perder enlace: DATA → LOCAL BUFFER → WAIT FOR CONNECTION → TRANSMIT
- [ ] Estudiar DTN (Delay/Disruption Tolerant Networking)
- [ ] Implementar una simulación inspirada en DTN

---

## 4. NODOS DEL SISTEMA

### 4.1 Nodo 1 — Astronaut Health Node (computador más cercano al astronauta)
- [ ] Recibir sensores
- [ ] Normalizar mediciones
- [ ] Filtrar ruido
- [ ] Estimar calidad de datos
- [ ] Detectar anomalías
- [ ] Ejecutar modelos locales
- [ ] Analizar estado fisiológico
- [ ] Analizar comportamiento
- [ ] Generar alertas
- [ ] Mostrar información al astronauta
- [ ] Crear paquetes de telemetría
- [ ] Guardar información si se pierde la comunicación

### 4.2 Nodo 2 — Vehicle / Relay Node (intermediario astronauta ↔ estación/gateway)
- [ ] Recibir paquetes
- [ ] Validar integridad
- [ ] Almacenar información
- [ ] Ordenar por prioridad
- [ ] Reenviar información
- [ ] Agrupar telemetría
- [ ] Gestionar pérdida de conexión
- [ ] Implementar orden de prioridad: CRITICAL → HEALTH ANOMALY → ENVIRONMENTAL THREAT → NORMAL TELEMETRY → BULK DATA

### 4.3 Nodo 3 — Lunar Station / Gateway
- [ ] Centralizar información de distintos astronautas, vehículos y sensores
- [ ] Estado general de la tripulación
- [ ] Historial
- [ ] Alertas
- [ ] Telemetría
- [ ] Información ambiental
- [ ] Información de radiación
- [ ] Estado de comunicaciones
- [ ] Inteligencia artificial
- [ ] Consola operacional

### 4.4 Nodo 4 — Earth / Mission Control
- [ ] Visualización completa del sistema
- [ ] Módulo Mission Control
- [ ] Módulo Medical Monitoring
- [ ] Módulo Behavioral Health
- [ ] Módulo Space Weather
- [ ] Módulo AI Assistant
- [ ] Módulo Network Monitoring

---

## 5. ARQUITECTURA DEL SOFTWARE

### 5.1 Backend (`backend/`)
- [x] `api/`
- [x] `core/telemetry/`
- [x] `core/health/`
- [x] `core/behavior/`
- [x] `core/environment/`
- [x] `core/mission/`
- [ ] `sensors/ecg.py`
- [ ] `sensors/imu.py`
- [ ] `sensors/oxygen.py`
- [ ] `sensors/pressure.py`
- [ ] `sensors/temperature.py`
- [ ] `sensors/radiation.py`
- [x] `sensors/simulator.py`
- [x] `ai/anomaly_detection/`
- [x] `ai/behavioral/`
- [x] `ai/radiation/`
- [x] `ai/assistant/`
- [x] `risk/engine.py`
- [x] `risk/rules.py`
- [x] `risk/models.py`
- [x] `communications/dtn.py`
- [x] `communications/bundle.py`
- [x] `communications/queue.py`
- [x] `communications/routing.py`
- [x] `storage/`
- [x] `config/`

### 5.2 Frontend (`frontend/`)
- [x] `astronaut/`
- [x] `mission-control/`
- [x] `medical/`
- [x] `behavioral/`
- [x] `radiation/`
- [x] `network/`
- [x] `ai/`

### 5.3 Simulador (`simulator/`)
- [ ] `astronaut.py`
- [ ] `solar_events.py`
- [ ] `moon.py`
- [ ] `network_delay.py`
- [ ] `communication_failure.py`

---

## 6. CAPA DE SENSORES

- [ ] No conectar sensores directamente con la lógica de la aplicación
- [ ] Crear clase base `SensorAdapter` con método `read()`
- [ ] Crear ejemplo `HeartRateSensor(SensorAdapter)` que retorne `metric`, `value`, `unit`

### Sensores a representar
- [ ] ECG
- [ ] PPG / frecuencia cardíaca
- [ ] SpO₂
- [ ] Temperatura
- [ ] Respiración
- [ ] Presión
- [ ] IMU
- [ ] Movimiento
- [ ] Tremor
- [ ] CO₂
- [ ] O₂
- [ ] Radiación

### Protocolos (estudio conceptual)
- [ ] I²C
- [ ] SPI
- [ ] UART
- [ ] CAN
- [ ] CAN-FD
- [ ] Ethernet

### Implementación para Space Apps
- [ ] Usar sensores simulados (no construir hardware físico)

---

## 7. FORMATO UNIVERSAL DE TELEMETRÍA

- [ ] Definir un formato común para todos los datos
- [ ] Campo `event_id`
- [ ] Campo `mission_id`
- [ ] Campo `astronaut_id`
- [ ] Campo `timestamp` (ISO 8601 UTC)
- [ ] Bloque `source` → `node`
- [ ] Bloque `source` → `sensor`
- [ ] Bloque `measurement` → `type`
- [ ] Bloque `measurement` → `value`
- [ ] Bloque `measurement` → `unit`
- [ ] Bloque `quality` → `confidence`
- [ ] Bloque `quality` → `error_margin`
- [ ] Bloque `quality` → `signal_quality`
- [ ] Bloque `context` → `location`
- [ ] Bloque `context` → `activity`
- [ ] Bloque `context` → `mission_phase`
- [ ] Campo `priority`
- [ ] Verificar que se transmite: dato + contexto + calidad + prioridad

---

## 8. DATA QUALITY ENGINE

### Pipeline
- [ ] RAW SENSOR DATA
- [ ] CALIBRATION
- [ ] NOISE FILTERING
- [ ] OUTLIER DETECTION
- [ ] SENSOR CONFIDENCE
- [ ] UNCERTAINTY
- [ ] TRUSTED TELEMETRY

### Reglas de decisión
- [ ] Validar datos antes de que la IA tome decisiones
- [ ] Manejar conflicto entre sensores (ej. Sensor A HR=145 conf 0.98 vs Sensor B HR=119 conf 0.61)
- [ ] No asumir automáticamente que un valor alto significa emergencia
- [ ] Analizar calidad del sensor
- [ ] Analizar movimiento
- [ ] Analizar tendencia
- [ ] Analizar historial
- [ ] Analizar otros sensores
- [ ] Analizar actividad actual

---

## 9. CREW STATE

- [ ] Crear concepto central **CREW STATE**
- [ ] Dimensión `physiology`
- [ ] Dimensión `behavior`
- [ ] Dimensión `cognitive_load`
- [ ] Dimensión `fatigue`
- [ ] Dimensión `environmental_exposure`
- [ ] Dimensión `radiation_risk`
- [ ] Dimensión `mission_stress`
- [ ] Representarlo como estado multidimensional de riesgo
- [ ] NO representarlo como "salud = X%"
- [ ] Construirlo con diferentes señales

---

## 10. INTELIGENCIA ARTIFICIAL

- [ ] No crear una sola IA gigante; dividirla en módulos

### 10.1 IA 1 — Telemetry AI
- [ ] Detectar anomalías
- [ ] Detectar valores atípicos
- [ ] Detectar tendencias
- [ ] Detectar cambios fisiológicos
- [ ] Detectar patrones inesperados
- [ ] Evaluar Python
- [ ] Evaluar Scikit-learn
- [ ] Evaluar PyTorch
- [ ] Evaluar ONNX Runtime
- [ ] Evaluar modelos estadísticos

### 10.2 IA 2 — Behavioral AI
**Facial**
- [ ] Frecuencia de parpadeo
- [ ] Dirección de mirada
- [ ] Movimiento de cabeza
- [ ] Patrones de expresión
- [ ] Tensión mandibular

**Voz**
- [ ] Velocidad del habla
- [ ] Pausas
- [ ] Variación del tono
- [ ] Intensidad

**Movimiento**
- [ ] Temblor
- [ ] Precisión motora
- [ ] Movimiento corporal
- [ ] Tiempo de reacción

**Performance**
- [ ] Errores
- [ ] Tiempo de respuesta
- [ ] Cambios en interacción
- [ ] Desempeño de tareas

**Reglas de salida**
- [ ] Estimar estados y desviaciones, NO diagnósticos médicos
- [ ] Salida con formato: estado + confianza + factores contribuyentes
- [ ] Ejemplo: "Potential acute stress state", 82%, con factores (HR elevada, tremor, desviación del habla, menor desempeño)

---

## 11. IA DE AMBIENTE Y SPACE WEATHER

### Fuentes / eventos
- [ ] Integrar **NASA DONKI** como fuente principal del prototipo
- [ ] Flares
- [ ] CME
- [ ] SEP
- [ ] Tormentas geomagnéticas
- [ ] Eventos solares
- [ ] Predicciones de propagación

### Pipeline
- [ ] NASA DATA
- [ ] SPACE WEATHER ENGINE
- [ ] EVENT DETECTION
- [ ] PROPAGATION / RISK
- [ ] CREW LOCATION
- [ ] RADIATION RISK

### Salida de ejemplo
- [ ] Evento solar detectado
- [ ] Estado de la tripulación (EVA activa)
- [ ] Ubicación (superficie lunar)
- [ ] Blindaje (bajo)
- [ ] Tendencia de radiación (en aumento)
- [ ] Riesgo (alto)
- [ ] Lograr que el sistema sea preventivo, no solo reactivo

---

## 12. DOS MOTORES DE RIESGO

### 12.1 Reactive Engine
- [ ] Flujo: algo está ocurriendo → detección → análisis → alerta
- [ ] Caso de ejemplo: anomalía fisiológica repentina

### 12.2 Predictive Engine
- [ ] Amenaza posible
- [ ] Datos ambientales
- [ ] Datos fisiológicos
- [ ] Comportamiento
- [ ] Contexto de misión
- [ ] Predicción
- [ ] Acción preventiva
- [ ] Caso de ejemplo: evento solar + EVA + blindaje bajo + radiación creciente + retraso de comunicación = riesgo futuro alto

---

## 13. ALERT MANAGER

- [ ] La IA NO controla directamente la interfaz
- [ ] Flujo: AI → RISK ESTIMATION → ALERT MANAGER → USER INTERFACE
- [ ] Decidir severidad
- [ ] Decidir confianza
- [ ] Decidir prioridad
- [ ] Decidir texto
- [ ] Decidir sonido
- [ ] Decidir haptic feedback
- [ ] Decidir nivel de interrupción
- [ ] Evitar alertas que aumenten la carga emocional del usuario

---

## 14. DISEÑO DEL HUD

- [ ] Interfaz calmada y contextual (sin "🚨 RED ALERT 🚨")
- [ ] Estado **Normal**: `● SYSTEM NOMINAL`
- [ ] Estado **Observación**: `◐ ENVIRONMENTAL CHANGE` + "Review recommended"
- [ ] Estado **Acción**: `▲ RETURN-TO-SAFE-ZONE ADVISED`
- [ ] Estado **Crítico**: `■ CRITICAL` + "IMMEDIATE CREW ACTION REQUIRED"
- [ ] No depender exclusivamente del color
- [ ] Usar color
- [ ] Usar icono
- [ ] Usar texto
- [ ] Usar sonido
- [ ] Usar vibración
- [ ] Considerar accesibilidad para daltonismo

---

## 15. COMUNICACIONES Y PRIORIDAD

- [ ] Definir Priority 0 — Emergency
- [ ] Definir Priority 1 — Health anomaly
- [ ] Definir Priority 2 — Environmental threat
- [ ] Definir Priority 3 — Normal telemetry
- [ ] Definir Priority 4 — Bulk data / video
- [ ] Escenario de prueba: pérdida de 20 min con 2 MB video + 2,814 paquetes de telemetría + 42 eventos de salud + 1 evento crítico
- [ ] Al volver el enlace: evento crítico → eventos de salud → eventos ambientales → telemetría normal → bulk data
- [ ] Integrar este comportamiento a la simulación DTN

---

## 16. SIMULACIÓN DE PÉRDIDA DE COMUNICACIÓN

- [ ] Botón visual `[ DISABLE LUNAR RELAY ]`
- [ ] Mostrar `CONNECTION LOST`
- [ ] Mostrar contador de buffer local: eventos críticos
- [ ] Mostrar contador de buffer local: eventos de salud
- [ ] Mostrar contador de buffer local: paquetes de telemetría
- [ ] Demostrar que el astronauta sigue protegido (análisis crítico local)
- [ ] Botón visual `[ RESTORE CONNECTION ]`
- [ ] Mostrar eventos críticos → transmitidos
- [ ] Mostrar eventos de salud → transmitidos
- [ ] Mostrar telemetría → en cola
- [ ] Tratarlo como demostración central del proyecto

---

## 17. PRIVACIDAD Y PROCESAMIENTO LOCAL

- [ ] No transmitir constantemente información sensible (ej. video completo)
- [ ] Flujo: CAMERA → LOCAL AI → FEATURE EXTRACTION → BEHAVIORAL STATE → TRANSMIT ONLY RELEVANT DATA
- [ ] Payload de ejemplo: `behavioral_state`, `confidence`, `blink_rate_delta`, `speech_pause_delta`
- [ ] Reducir tráfico
- [ ] Evitar transmitir datos innecesarios

---

## 18. CHATBOT / AI ASSISTANT

### 18.1 Astronaut
- [x] Responder "¿Por qué me estás alertando?" ✅
- [x] Explicar qué ocurrió ✅
- [x] Explicar qué tan importante es ✅
- [x] Indicar qué acción realizar ✅
- [x] Indicar qué evitar ✅

### 18.2 Flight Controller
- [x] Responder "¿Qué está ocurriendo con Crew-07?" ✅
- [x] Enfocarse en telemetría ✅
- [x] Estado ✅
- [x] Redes ✅
- [x] Misión ✅
- [x] Eventos ✅

### 18.3 Medical Officer
- [x] Responder "¿Qué cambios fisiológicos presenta?" ✅
- [x] Datos fisiológicos ✅
- [x] Tendencias ✅
- [x] Anomalías ✅
- [x] Historial relevante ✅

### 18.4 Behavioral Health
- [x] Responder "¿Se han detectado cambios de comportamiento?" ✅
- [x] Patrones conductuales ✅
- [x] Tendencias ✅
- [x] Desviaciones ✅
- [x] Contexto de misión ✅

---

## 19. FRONTEND

- [x] Desarrollar en TypeScript ✅
- [x] Soportar varias vistas ✅

### 19.1 Astronaut HUD (minimalista)
- [x] SUIT STATUS ✅
- [x] HR ✅
- [x] SpO₂ ✅
- [x] TEMP ✅
- [x] CO₂ ✅
- [x] RADIATION (barra de nivel) ✅
- [x] MISSION (ej. EVA 02 / 03) ✅

### 19.2 Mission Control
- [x] Lista de tripulación (Crew 01–04) ✅
- [x] Estado ✅
- [x] Alertas ✅
- [x] Telemetría ✅
- [x] Historial ✅
- [x] Radiación ✅
- [x] Comunicaciones ✅
- [x] Estado de misión ✅

### 19.3 Otros dashboards
- [x] Medical dashboard ✅
- [x] Behavioral dashboard ✅
- [x] Radiation dashboard ✅
- [x] Network monitor ✅

---

## 20. STACK TECNOLÓGICO

### Frontend
- [x] TypeScript
- [x] React
- [x] Tailwind
- [ ] Cloudflare (deploy pendiente)

### Backend
- [x] Python
- [x] FastAPI
- [ ] Vercel (prototipo/API)

### IA
- [x] Python
- [ ] Scikit-learn
- [ ] PyTorch / ONNX según el modelo
- [ ] Modelos especializados

### Datos
- [ ] Base de datos para telemetría
- [ ] Base de datos para histórico

### NASA
- [ ] DONKI
- [ ] OSDR
- [ ] Otras APIs/datasets pertinentes al desafío

### Comunicación
- [ ] Arquitectura inspirada en DTN
- [ ] Simulación de store-and-forward
- [ ] Priorización de paquetes

---

## 21. REPOSITORIO

- [x] `backend/` ✅ creado y en GitHub
- [x] `frontend/` ✅ creado y en GitHub
- [ ] `simulator/`
- [x] `shared/` ✅ creado y en GitHub
- [x] `tests/` ✅ creado y verificado con unittest
- [x] `docs/` ✅ creado con arquitectura, demo script y pitch

### Esquemas en `shared/` (mismo modelo Python ↔ TypeScript)
- [x] `TelemetryEvent` ✅
- [x] `HealthEvent` ✅
- [x] `EnvironmentalEvent` ✅
- [x] `RiskEvent` ✅
- [x] `AlertEvent` ✅
- [x] `DTNBundle` ✅
- [x] `CrewState` ✅

---

## 22. FUENTES DE DATOS

- [x] Estudiar datasets de NASA para entrenar, probar y validar modelos ✅
- [x] Salud humana ✅
- [x] Fisiología ✅
- [x] Comportamiento ✅
- [x] Ambiente espacial ✅
- [x] Radiación ✅
- [x] Misiones ✅
- [x] Space Weather ✅
- [x] Explorar **NASA OSDR** (ciencias de la vida espacial) ✅

---

## 23. MVP — LUNAR EVA

- [x] Limitar el MVP a Lunar EVA (no intentar hacer todo) ✅
- [x] Documentar hoja de ruta futura: Earth → Moon → Mars → Venus → Deep Space ✅

### Escenario completo (19 pasos)
- [x] 1. El astronauta inicia la EVA ✅
- [x] 2. Sensores operando normalmente ✅
- [x] 3. Se detecta evento solar NASA ✅
- [x] 4. El riesgo de radiación comienza a aumentar ✅
- [x] 5. El astronauta continúa la EVA ✅
- [x] 6. Aumenta la tendencia del dosímetro ✅
- [x] 7. Se detecta desviación fisiológica ✅
- [x] 8. Se detecta tremor / variación conductual ✅
- [x] 9. La IA correlaciona múltiples señales ✅
- [x] 10. El Risk Engine emite advertencia preventiva ✅
- [x] 11. El astronauta recibe alerta calmada y contextual ✅
- [x] 12. El vehículo recibe paquete priorizado ✅
- [x] 13. Falla el enlace de comunicación ✅
- [x] 14. Los datos se almacenan localmente ✅
- [x] 15. Se restablece la comunicación ✅
- [x] 16. Los datos se reenvían ✅
- [x] 17. La estación lunar recibe la información ✅
- [x] 18. La Tierra recibe el evento completo ✅
- [x] 19. Mission Control ve toda la línea de tiempo ✅

---

## 24. ESCENARIO DE DEMOSTRACIÓN

- [x] Contar una historia, no solo mostrar dashboards ✅
- [x] Preparar la narrativa: EVA lunar → evento solar → riesgo ambiental en aumento ✅
- [x] Narrar detección de cambios fisiológicos y conductuales ✅
- [x] Narrar correlación local de señales y riesgo creciente ✅
- [x] Narrar recomendación contextualizada (no alerta agresiva) ✅
- [x] Narrar pérdida del enlace con operación local continua ✅
- [x] Narrar almacenamiento de eventos críticos ✅
- [x] Narrar restablecimiento y transmisión por prioridad hasta estación y Tierra ✅
- [x] Demostrar: PREVENTION ✅
- [x] Demostrar: LOCAL INTELLIGENCE ✅
- [x] Demostrar: RESILIENT COMMUNICATION ✅
- [x] Demostrar: HUMAN-CENTERED DESIGN ✅

---

## 25. FASES DE IMPLEMENTACIÓN

### FASE 1 — Arquitectura
- [x] Definir componentes
- [x] Definir nodos
- [x] Definir flujo de información
- [x] Definir esquemas de datos
- [x] Definir interfaces
- [x] Definir APIs
- [x] **Entregable:** arquitectura documentada (ASTRA-VITAL.md)

### FASE 2 — Simulador (revisar)
- [x] Sensor virtual: heart rate ✅
- [x] Sensor virtual: SpO₂ ✅
- [x] Sensor virtual: temperature ✅
- [x] Sensor virtual: respiration ✅
- [x] Sensor virtual: IMU ✅
- [x] Sensor virtual: tremor ✅
- [x] Sensor virtual: radiation ✅
- [x] Sensor virtual: CO₂ ✅
- [x] Sensor virtual: O₂ ✅
- [x] **Entregable:** telemetry stream funcionando ✅

### FASE 3 — Data Quality (revisar)
- [x] Filtrado ✅
- [x] Anomalías ✅
- [x] Calidad ✅
- [x] Margen de error ✅
- [x] Confidence ✅
- [x] **Entregable:** trusted telemetry ✅

### FASE 4 — Risk Engine (revisar)
- [x] Implementar reglas deterministas iniciales ✅
- [x] Regla: IF radiation ↑ AND EVA = TRUE AND shielding = LOW THEN radiation_risk = HIGH ✅
- [x] Planificar incorporación posterior de ML ✅
- [x] **Entregable:** risk assessment ✅

### FASE 5 — IA (revisar)
- [x] Anomaly detection ✅
- [x] Behavioral analysis ✅
- [x] Prediction ✅
- [x] Space weather correlation ✅
- [x] **Entregable:** AI-assisted risk detection ✅

### FASE 6 — Alert Manager
- [x] Severity ✅
- [x] Prioridad ✅
- [x] UX ✅
- [x] Mensajes ✅
- [x] Sonido ✅
- [x] Concepto háptico ✅
- [x] **Entregable:** human-centered alerts ✅

### FASE 7 — Comunicación
- [x] Simulación: Astronaut → Vehicle → Station → Earth ✅
- [x] Queue ✅
- [x] Priority ✅
- [x] Buffer ✅
- [x] Retry ✅
- [x] Store-and-forward ✅
- [x] Connection loss ✅
- [x] **Entregable:** resilient communication ✅

### FASE 8 — Frontend
- [x] Astronaut HUD ✅
- [x] Mission Control ✅
- [x] Medical dashboard ✅
- [x] Behavioral dashboard ✅
- [x] Radiation dashboard ✅
- [x] Network monitor ✅
- [x] **Entregable:** complete visualization ✅

### FASE 9 — AI Assistant
- [x] Integrar chatbot contextual ✅
- [x] Usar Crew State ✅
- [x] Usar Mission State ✅
- [x] Usar Telemetry ✅
- [x] Usar Alerts ✅
- [x] Usar Environment ✅
- [x] Usar Historical events ✅
- [x] **Entregable:** context-aware assistant ✅

### FASE 10 — Demo final
- [x] Solar event ✅
- [x] Radiation risk ✅
- [x] Crew state change ✅
- [x] AI detection ✅
- [x] Preventive alert ✅
- [x] Communication failure ✅
- [x] Local storage ✅
- [x] Connection restored ✅
- [x] Prioritized sync ✅
- [x] Earth ✅

---

## 26. PRIORIDAD DEL EQUIPO (ORDEN DE EJECUCIÓN)

- [x] 1. Arquitectura ✅
- [x] 2. Data schema ✅
- [x] 3. Sensor simulator ✅
- [x] 4. Data quality ✅
- [x] 5. Risk engine ✅
- [x] 6. Communication simulation ✅
- [x] 7. Frontend ✅
- [x] 8. AI ✅
- [x] 9. Chatbot ✅
- [x] 10. Final integration ✅
- [x] Recordar: la IA es una capa sobre una arquitectura que ya funciona, no el fundamento ✅

---

## 27. IDEA CENTRAL A DEFENDER

- [x] Preparar el pitch: NO es "una aplicación que monitorea astronautas" ✅
- [x] Defender: arquitectura distribuida de inteligencia para prevención de riesgos humanos ✅
- [x] Defender: procesamiento local de información ✅
- [x] Defender: adaptación a incertidumbre en los sensores ✅
- [x] Defender: consideración de fisiología, comportamiento y ambiente ✅
- [x] Defender: alertas centradas en el ser humano ✅
- [x] Defender: transmisión priorizada bajo interrupciones de comunicación ✅
- [x] Mostrar crecimiento: Moon → Mars → Deep Space ✅
- [x] Defender que el sistema funciona aunque Tierra esté demasiado lejos para responder ✅
- [x] Cerrar con: DETECTAR → ENTENDER → PREDECIR → PREVENIR → ACTUAR antes de que una amenaza se convierta en emergencia ✅

---

## 🏁 CRITERIOS FINALES DE ENTREGA

- [x] Arquitectura documentada en `docs/` (`docs/architecture.md`) ✅
- [x] Esquemas compartidos en `shared/` funcionando en Python y TypeScript ✅
- [x] Simulador generando telemetría continua (`backend/sensors/simulator.py`) ✅
- [x] Data Quality entregando telemetría confiable (`backend/core/telemetry/pipeline.py`) ✅
- [x] Risk Engine (reglas) emitiendo evaluaciones (`backend/risk/engine.py`) ✅
- [x] IA integrada como capa sobre el sistema funcional (`backend/ai/`) ✅
- [x] Alert Manager y HUD accesibles (color + icono + texto + sonido + vibración) ✅
- [x] Simulación DTN con priorización, buffer y reenvío (`backend/communications/dtn.py`) ✅
- [x] Botones DISABLE / RESTORE operativos en la demo ✅
- [x] Frontends completos (HUD, Mission Control, Medical, Behavioral, Radiation, Network) ✅
- [x] Chatbot contextual por rol (`backend/ai/assistant/service.py`) ✅
- [x] Tests en `tests/` (12 tests pasando al 100%) ✅
- [x] Demo final del escenario Lunar EVA de 19 pasos ejecutable de principio a fin ✅
- [x] Narrativa y pitch listos (`docs/demo-script.md`, `docs/pitch.md`) ✅
