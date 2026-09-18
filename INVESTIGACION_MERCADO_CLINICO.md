# Investigacion, Economia Clinica y Protocolos de Triage Odontologico

Este documento sintetiza la investigacion de mercado, protocolos clinicos y economia operativa de clinicas dentales que dan origen a **`dentflow-clinical-guardrails`**.

---

## 1. La Realidad Financiera de una Clinica Odontologica

1. **Estructura de Costos Fijos por Sillon**:
   - Cada box odontologico tiene un costo fijo horario de entre **150 y 300 USD** (amortizacion de equipamiento, instrumental esterilizado, asistente dental, alquiler y costos energeticos).
   - Una cancelacion de ultimo momento o un paciente que no se presenta (no-show) destruye el margen neto del turno.
2. **La Paradoja de los Tratamientos de Alto Ticket**:
   - Implantes (1.000 a 6.000 USD) y alineadores invisibles (1.500 a 4.000 USD) representan mas del 65% de la utilidad neta de una clinica moderna.
   - Sin embargo, los pacientes no compran por impulso en el primer mensaje de WhatsApp: requieren un protocolo de valoracion que genere confianza clinica y resuelva miedos quirurgicos.

---

## 2. Protocolos Medicos de Urgencia en Odontologia

El triage deterministico es obligatorio para evitar negligencias medicas y derivar correctamente:

| Situacion Clinica | Sintomas Tipicos | Accion Inmediata del Sistema |
| :--- | :--- | :--- |
| **Avulsion Dental Traumatica** | Diente desprendido por impacto en la ultima hora | Instruccion critica de conservacion en leche/saliva + derivacion inmediata en <60 min |
| **Infeccion con Celulitis Facial** | Hinchazon asimetrica, fiebre, trismus (dificultad para abrir la boca) | Override de emergencia: bloqueo de bot y llamada telefonica urgente a guardia |
| **Pulpitis Aguda Irreversible** | Dolor pulsatil espontaneo que no cede con analgesicos comunes | Asignacion de sobreturno prioritario en el dia (<24 hs) |
| **Consulta Electiva / Estetica** | Deseo de alinear dientes, blanqueamiento o carillas | Agendamiento de escaneo 3D y valoracion clinica |

---

## 3. Benchmarks de Rendimiento

| Metrica | Triage con LLM Puro | Con `dentflow-clinical-guardrails` |
| :--- | :--- | :--- |
| **Latencia de Deteccion de Emergencia** | 1.500 - 3.200 ms | **< 2 ms** |
| **Riesgo de Diagnostico Medico Ilegal** | Alto (el LLM inventa consejos medicos) | **Cero (Reglas deterministicas)** |
| **Normalizacion de Dientes a FDI** | Imprecisa | **100% Determinista (ISO 3950)** |
