# ✅ CHECKLIST DE IMPLEMENTACIÓN — SPACE APPS CHALLENGE

> Plataforma distribuida de monitoreo y prevención de salud para astronautas.
> Cada ítem corresponde a un detalle del plan. Marca `[x]` al completar.

**Lema:** DETECTAR → ENTENDER → PREDECIR → PREVENIR → ACTUAR

---

## 📊 PROGRESO GENERAL

- [x] Fase 1 — Arquitectura ✅
- [ ] Fase 2 — Simulador
- [ ] Fase 3 — Data Quality
- [ ] Fase 4 — Risk Engine
- [ ] Fase 5 — IA
- [ ] Fase 6 — Alert Manager
- [ ] Fase 7 — Comunicación
- [ ] Fase 8 — Frontend
- [ ] Fase 9 — AI Assistant
- [ ] Fase 10 — Demo final

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
- [ ] Responder "¿Por qué me estás alertando?"
- [ ] Explicar qué ocurrió
- [ ] Explicar qué tan importante es
- [ ] Indicar qué acción realizar
- [ ] Indicar qué evitar

### 18.2 Flight Controller
- [ ] Responder "¿Qué está ocurriendo con Crew-07?"
- [ ] Enfocarse en telemetría
- [ ] Estado
- [ ] Redes
- [ ] Misión
- [ ] Eventos

### 18.3 Medical Officer
- [ ] Responder "¿Qué cambios fisiológicos presenta?"
- [ ] Datos fisiológicos
- [ ] Tendencias
- [ ] Anomalías
- [ ] Historial relevante

### 18.4 Behavioral Health
- [ ] Responder "¿Se han detectado cambios de comportamiento?"
- [ ] Patrones conductuales
- [ ] Tendencias
- [ ] Desviaciones
- [ ] Contexto de misión

---

## 19. FRONTEND

- [ ] Desarrollar en TypeScript
- [ ] Soportar varias vistas

### 19.1 Astronaut HUD (minimalista)
- [ ] SUIT STATUS
- [ ] HR
- [ ] SpO₂
- [ ] TEMP
- [ ] CO₂
- [ ] RADIATION (barra de nivel)
- [ ] MISSION (ej. EVA 02 / 03)

### 19.2 Mission Control
- [ ] Lista de tripulación (Crew 01–04)
- [ ] Estado
- [ ] Alertas
- [ ] Telemetría
- [ ] Historial
- [ ] Radiación
- [ ] Comunicaciones
- [ ] Estado de misión

### 19.3 Otros dashboards
- [ ] Medical dashboard
- [ ] Behavioral dashboard
- [ ] Radiation dashboard
- [ ] Network monitor

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
- [ ] `tests/`
- [ ] `docs/`

### Esquemas en `shared/` (mismo modelo Python ↔ TypeScript)
- [x] `TelemetryEvent`
- [x] `HealthEvent`
- [ ] `EnvironmentalEvent`
- [ ] `RiskEvent`
- [ ] `AlertEvent`
- [ ] `DTNBundle`
- [x] `CrewState`

---

## 22. FUENTES DE DATOS

- [ ] Estudiar datasets de NASA para entrenar, probar y validar modelos
- [ ] Salud humana
- [ ] Fisiología
- [ ] Comportamiento
- [ ] Ambiente espacial
- [ ] Radiación
- [ ] Misiones
- [ ] Space Weather
- [ ] Explorar **NASA OSDR** (ciencias de la vida espacial)

---

## 23. MVP — LUNAR EVA

- [ ] Limitar el MVP a Lunar EVA (no intentar hacer todo)
- [ ] Documentar hoja de ruta futura: Earth → Moon → Mars → Venus → Deep Space

### Escenario completo (19 pasos)
- [ ] 1. El astronauta inicia la EVA
- [ ] 2. Sensores operando normalmente
- [ ] 3. Se detecta evento solar NASA
- [ ] 4. El riesgo de radiación comienza a aumentar
- [ ] 5. El astronauta continúa la EVA
- [ ] 6. Aumenta la tendencia del dosímetro
- [ ] 7. Se detecta desviación fisiológica
- [ ] 8. Se detecta tremor / variación conductual
- [ ] 9. La IA correlaciona múltiples señales
- [ ] 10. El Risk Engine emite advertencia preventiva
- [ ] 11. El astronauta recibe alerta calmada y contextual
- [ ] 12. El vehículo recibe paquete priorizado
- [ ] 13. Falla el enlace de comunicación
- [ ] 14. Los datos se almacenan localmente
- [ ] 15. Se restablece la comunicación
- [ ] 16. Los datos se reenvían
- [ ] 17. La estación lunar recibe la información
- [ ] 18. La Tierra recibe el evento completo
- [ ] 19. Mission Control ve toda la línea de tiempo

---

## 24. ESCENARIO DE DEMOSTRACIÓN

- [ ] Contar una historia, no solo mostrar dashboards
- [ ] Preparar la narrativa: EVA lunar → evento solar → riesgo ambiental en aumento
- [ ] Narrar detección de cambios fisiológicos y conductuales
- [ ] Narrar correlación local de señales y riesgo creciente
- [ ] Narrar recomendación contextualizada (no alerta agresiva)
- [ ] Narrar pérdida del enlace con operación local continua
- [ ] Narrar almacenamiento de eventos críticos
- [ ] Narrar restablecimiento y transmisión por prioridad hasta estación y Tierra
- [ ] Demostrar: PREVENTION
- [ ] Demostrar: LOCAL INTELLIGENCE
- [ ] Demostrar: RESILIENT COMMUNICATION
- [ ] Demostrar: HUMAN-CENTERED DESIGN

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

### FASE 2 — Simulador
- [ ] Sensor virtual: heart rate
- [ ] Sensor virtual: SpO₂
- [ ] Sensor virtual: temperature
- [ ] Sensor virtual: respiration
- [ ] Sensor virtual: IMU
- [ ] Sensor virtual: tremor
- [ ] Sensor virtual: radiation
- [ ] Sensor virtual: CO₂
- [ ] Sensor virtual: O₂
- [ ] **Entregable:** telemetry stream funcionando

### FASE 3 — Data Quality
- [ ] Filtrado
- [ ] Anomalías
- [ ] Calidad
- [ ] Margen de error
- [ ] Confidence
- [ ] **Entregable:** trusted telemetry

### FASE 4 — Risk Engine
- [ ] Implementar reglas deterministas iniciales
- [ ] Regla: IF radiation ↑ AND EVA = TRUE AND shielding = LOW THEN radiation_risk = HIGH
- [ ] Planificar incorporación posterior de ML
- [ ] **Entregable:** risk assessment

### FASE 5 — IA
- [ ] Anomaly detection
- [ ] Behavioral analysis
- [ ] Prediction
- [ ] Space weather correlation
- [ ] **Entregable:** AI-assisted risk detection

### FASE 6 — Alert Manager
- [ ] Severity
- [ ] Prioridad
- [ ] UX
- [ ] Mensajes
- [ ] Sonido
- [ ] Concepto háptico
- [ ] **Entregable:** human-centered alerts

### FASE 7 — Comunicación
- [ ] Simulación: Astronaut → Vehicle → Station → Earth
- [ ] Queue
- [ ] Priority
- [ ] Buffer
- [ ] Retry
- [ ] Store-and-forward
- [ ] Connection loss
- [ ] **Entregable:** resilient communication

### FASE 8 — Frontend
- [ ] Astronaut HUD
- [ ] Mission Control
- [ ] Medical dashboard
- [ ] Behavioral dashboard
- [ ] Radiation dashboard
- [ ] Network monitor
- [ ] **Entregable:** complete visualization

### FASE 9 — AI Assistant
- [ ] Integrar chatbot contextual
- [ ] Usar Crew State
- [ ] Usar Mission State
- [ ] Usar Telemetry
- [ ] Usar Alerts
- [ ] Usar Environment
- [ ] Usar Historical events
- [ ] **Entregable:** context-aware assistant

### FASE 10 — Demo final
- [ ] Solar event
- [ ] Radiation risk
- [ ] Crew state change
- [ ] AI detection
- [ ] Preventive alert
- [ ] Communication failure
- [ ] Local storage
- [ ] Connection restored
- [ ] Prioritized sync
- [ ] Earth

---

## 26. PRIORIDAD DEL EQUIPO (ORDEN DE EJECUCIÓN)

- [ ] 1. Arquitectura
- [ ] 2. Data schema
- [ ] 3. Sensor simulator
- [ ] 4. Data quality
- [ ] 5. Risk engine
- [ ] 6. Communication simulation
- [ ] 7. Frontend
- [ ] 8. AI
- [ ] 9. Chatbot
- [ ] 10. Final integration
- [ ] Recordar: la IA es una capa sobre una arquitectura que ya funciona, no el fundamento

---

## 27. IDEA CENTRAL A DEFENDER

- [ ] Preparar el pitch: NO es "una aplicación que monitorea astronautas"
- [ ] Defender: arquitectura distribuida de inteligencia para prevención de riesgos humanos
- [ ] Defender: procesamiento local de información
- [ ] Defender: adaptación a incertidumbre en los sensores
- [ ] Defender: consideración de fisiología, comportamiento y ambiente
- [ ] Defender: alertas centradas en el ser humano
- [ ] Defender: transmisión priorizada bajo interrupciones de comunicación
- [ ] Mostrar crecimiento: Moon → Mars → Deep Space
- [ ] Defender que el sistema funciona aunque Tierra esté demasiado lejos para responder
- [ ] Cerrar con: DETECTAR → ENTENDER → PREDECIR → PREVENIR → ACTUAR antes de que una amenaza se convierta en emergencia

---

## 🏁 CRITERIOS FINALES DE ENTREGA

- [ ] Arquitectura documentada en `docs/`
- [ ] Esquemas compartidos en `shared/` funcionando en Python y TypeScript
- [ ] Simulador generando telemetría continua
- [ ] Data Quality entregando telemetría confiable
- [ ] Risk Engine (reglas) emitiendo evaluaciones
- [ ] IA integrada como capa sobre el sistema funcional
- [ ] Alert Manager y HUD accesibles (color + icono + texto + sonido + vibración)
- [ ] Simulación DTN con priorización, buffer y reenvío
- [ ] Botones DISABLE / RESTORE operativos en la demo
- [ ] Frontends completos (HUD, Mission Control, Medical, Behavioral, Radiation, Network)
- [ ] Chatbot contextual por rol
- [ ] Tests en `tests/`
- [ ] Demo final del escenario Lunar EVA de 19 pasos ejecutable de principio a fin
- [ ] Narrativa y pitch listos
