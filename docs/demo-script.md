# ASTRA-VITAL: Lunar EVA Demo Script (19-Step Scenario)

## Scenario Context
- **Mission:** Asteria 07 — Lunar South Pole Exploration
- **Crew:** EV-01 Cmdr. Imani Okafor (EVA Lead), EV-02 Dr. Vega Solano (Science Lead)
- **Environment:** Shackleton Crater rim, unshielded surface traverse
- **Demonstration Goal:** Prove that ASTRA prevents emergencies through early multi-signal convergence, localized edge intelligence, and resilient store-and-forward communications.

---

## 19-Step Narrative Sequence

### Act I: Baseline Operations
1. **Inicio de la EVA:** Vega e Imani abren la escotilla y descienden a la superficie lunar.
2. **Operación normal de sensores:** Los 9 canales biométricos (pulso 72 BPM, SpO2 98%, CO2 3.2 mmHg, IMU estable) transmiten dentro de la línea base adaptativa. La confianza de señal supera el 95%.
3. **Detección de evento solar NASA:** El satélite meteorológico espacial detecta un pulso solar de protones S-17 en curso hacia el polo sur lunar.
4. **Ascenso del riesgo de radiación:** El sensor de radiación superficial registra un aumento de 0.22 a 0.61 mSv/h. La regla determinista de ASTRA evalúa apantallamiento bajo en traje EVA.

### Act II: Multi-Signal Divergence & Early Warning
5. **Continuación de la marcha:** La tripulación continúa la recolección geológica sin notar síntomas conscientes de cansancio.
6. **Tendencia dosimétrica sostenida:** El dosímetro de Vega registra una pendiente ascendente constante (0.78 mSv/h proyectado).
7. **Desviación fisiológica sutil:** El algoritmo de calidad detecta un desacoplamiento entre frecuencia cardíaca (126 BPM) y acelerometría (IMU 1.68g), indicando inicio de sobreesfuerzo metabólico.
8. **Detección de variación conductual / temblor:** El guante háptico registra micro-temblores (índice 0.42 > umbral nominal 0.20) y un aumento en el tiempo de manipulación de herramientas (+140ms).
9. **Correlación de señales por la IA:** El motor heurístico une 4 señales concurrentes: radiación solar + pulso divergente + temblor fino + latencia motora.
10. **Emisión de advertencia preventiva (Risk Engine):** El Risk Engine eleva el estado a `ACTION` y genera prioridad `P1` con recomendación de repliegue hacia el refugio secundario.
11. **Alerta calmada y contextual en el HUD del astronauta:** El Alert Manager proyecta en el visor de Vega el símbolo `▲ RETURN-TO-SAFE-ZONE ADVISED`, acompañado de audio suave y vibración doble en el guante. El mensaje es claro: *"No es una falla de traje; inicia transición preventiva hacia Refugio Shackleton B (11 min)"*.

### Act III: Communication Blackout & Resilient Edge Computing
12. **Despacho del paquete priorizado:** El nodo de salud del astronauta transmite el paquete P1 hacia el rover lunar.
13. **Falla del enlace de comunicación:** El rover entra en la sombra del relieve del cráter; se interrumpe la comunicación directa con la estación y la Tierra (enlace `OFF / BUFFERING`).
14. **Almacenamiento local Store-and-Forward (DTN):** El nodo de salud activa el buffer DTN. Todos los paquetes se resguardan de forma segura en almacenamiento no volátil local, asignados a sus colas de prioridad P0 a P4.
15. **Continuidad operativa del astronauta:** Vega consulta al ASTRA Assistant: *"¿Por qué me estás alertando?"*. El asistente responde autónomamente en el borde con diagnóstico completo, acción a realizar y precauciones, sin requerir conexión con Houston.

### Act IV: Link Restoration & Synchronized Resolution
16. **Restablecimiento del enlace:** Al salir de la sombra orográfica, el enlace de microondas se restablece (`LINK RESTORED`).
17. **Transmisión por orden de prioridad:** El buffer DTN vacía primero los paquetes críticos P0 y P1, seguidos de telemetría P2 y P3. El registro de reintentos reporta 0 pérdidas de paquetes.
18. **Recepción en Estación Lunar y Tierra:** Houston recibe la cronología completa intacta, con marcas de tiempo calibradas y evaluaciones de calidad de datos.
19. **Mission Control visualiza la línea de tiempo completa:** Los controladores de vuelo, médicos y psicólogos visualizan la convergencia que evitó un evento agudo de cinetosis o radiación antes de que se convirtiera en emergencia.

---

## Technical Proof Points to Highlight
- **PREVENTION:** La acción se tomó 18 minutos antes de cruzar los límites médicos de exposición.
- **LOCAL FIRST:** La decisión y asistencia se ejecutaron en el nodo del traje, no en servidores terrestres.
- **DATA INTEGRITY:** El protocolo DTN garantizó cero pérdidas de información durante la interrupción.
- **HUMAN CENTERED:** Alertas graduadas (● ◐ ▲ ■) que guían sin generar pánico ni sobrecargar cognitivamente al astronauta.
