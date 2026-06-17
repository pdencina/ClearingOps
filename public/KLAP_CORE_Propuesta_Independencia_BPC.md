# KLAP CORE — Propuesta de Independencia Tecnológica

## Plan Estratégico para Eliminar la Dependencia de BPC SmartVista

**Preparado por:** Equipo de Tecnología KLAP  
**Fecha:** Junio 2026  
**Clasificación:** Confidencial  

---

## 1. Resumen Ejecutivo

KLAP depende de BPC SmartVista para procesos críticos del negocio: autorización, clearing, liquidación y operación. Esta dependencia genera:

- **14 tickets abiertos** esperando resolución de BPC (algunos con 9+ meses de antigüedad)
- **3 a 8 semanas** de espera para cualquier cambio en producción
- **Nulo control** sobre releases, accesos a datos, y corrección de bugs
- **Riesgo de negocio** por vendor lock-in total

Se construyó **KLAP CORE**, un prototipo funcional que demuestra que la lógica de negocio de BPC puede ser operada internamente. El sistema está desplegado en producción con datos reales.

**Propuesta:** Formar un equipo SWAT interno que, con una inversión incremental de **$147.000.000 CLP** en 12 meses, elimine la dependencia de BPC en los procesos de clearing, liquidación y conciliación.

---

## 2. Situación Actual

### 2.1 Qué hace BPC hoy para KLAP

| Proceso | Función | Control de KLAP |
|---------|---------|-----------------|
| Autorización | Decide si aprueba/rechaza transacciones | Nulo |
| Clearing | Genera archivos CTF (Visa) e IPM (Mastercard) | Nulo |
| Liquidación | Calcula comisiones y montos a pagar | Nulo |
| Releases | Controla qué y cuándo se despliega | Nulo |
| Operación | Gestiona cambios, ventanas, validaciones | Dependencia total |
| Soporte | Resuelve bugs e incidentes | Tiempos de BPC |

### 2.2 Problemas operativos documentados

Del análisis de tickets Jira activos:

| Categoría | Tickets | Ejemplo | Tiempo sin resolver |
|-----------|---------|---------|---------------------|
| Comisiones incorrectas | 7 | CM en cero, error de tramo, cuotas mal aplicadas | 2-8 semanas |
| Clearing & cuadratura | 4 | Rechazos no en clearing, cuadratura no implementada | 9+ meses |
| Accesos bloqueados | 3 | No podemos leer nuestros propios datos | 5+ semanas |
| Dependencia de releases | 2 | Esperando que BPC implemente cambio de Visa | Meses |

### 2.3 Impacto financiero del status quo

| Concepto | Costo mensual (CLP) | Costo anual (CLP) |
|----------|---------------------|-------------------|
| Fee de procesamiento BPC | $25.000.000 - $50.000.000 | $300.000.000 - $600.000.000 |
| Soporte y mantención | $9.500.000 - $19.000.000 | $114.000.000 - $228.000.000 |
| Releases y cambios | Variable | $30.000.000 - $84.000.000 |
| Productividad perdida del equipo | $5.000.000 - $8.000.000 | $60.000.000 - $96.000.000 |
| **Total estimado** | **$39.500.000 - $77.000.000** | **$504.000.000 - $1.008.000.000** |

---

## 3. Qué es KLAP CORE

KLAP CORE es un Payment Operating System que replica los procesos críticos de BPC SmartVista bajo control interno de KLAP.

### 3.1 Estado actual del prototipo

| Métrica | Valor |
|---------|-------|
| Pantallas funcionales | 21 |
| APIs operativas | 22 |
| Engines de negocio | 17 |
| Base de datos | Supabase Postgres (datos reales) |
| Deploy | Vercel (producción) |
| Tiempo de desarrollo | 2 semanas |

### 3.2 Engines implementados

| Engine | Función | Reemplaza de BPC |
|--------|---------|------------------|
| Authorization | Decide aprobación con reglas y risk scoring | Módulo de autorización SmartVista |
| Fraud Detection | 8 checks antifraude + modelo ML | Motor de fraude BPC |
| Clearing | Generador CTF (Visa) e IPM (Mastercard) | Proceso de clearing BPC |
| Settlement | Cálculo de comisiones, IVA, retenciones, neto | Motor de liquidación BPC |
| Reconciliation | Conciliación triple: KLAP vs Banco vs Marca | No existe en BPC (ticket KLAP-1086) |
| ISO 8583 | Parser/Builder del protocolo de tarjetas | Capa de comunicación SmartVista |
| BIN Table | 35 BINs chilenos con routing inteligente | Tabla de BINs de BPC |
| Tokenization | Vault PCI DSS format-preserving | Módulo de tokens BPC |
| 3D Secure | Simulador de autenticación 3DS 2.2 | Integración 3DS de BPC |
| Webhooks | Notificaciones a comercios | No existe en BPC |
| Metrics | TPS, response time, SLA monitoring | Monitoreo limitado de BPC |
| Scheduler | Jobs batch (clearing, liquidación, fraude) | Scheduler de BPC |
| Disputes | Ciclo de vida de chargebacks | Gestión de disputas BPC |
| Onboarding | Alta de comercios (7 pasos) | Proceso manual |
| Reporting | 8 reportes (transaccional, financiero, compliance) | Reportes de BPC |
| Audit Trail | Registro de acciones del sistema | No existe en BPC |

### 3.3 Mapeo de tickets reales a soluciones

| Ticket | Problema con BPC | Tiempo BPC | Solución KLAP | Tiempo KLAP |
|--------|------------------|------------|---------------|-------------|
| KLAP-1806 | Fee MC en cero | 2-4 semanas | Fee rules configurables | 5 minutos |
| KLAP-1804 | Error de tramo en cuotas | 3-6 semanas | Lógica de tramos propia | 2 minutos |
| KLAP-1802 | CM aplica a todas las cuotas | 4-6 semanas | Condición installment==1 | 3 minutos |
| KLAP-1801 | Volumen cuota 2+ en cero | 3-5 semanas | Propagación de monto nativa | 0 (funciona) |
| KLAP-940 | Rechazos no en clearing | 9+ meses | Incluidos por defecto | 0 (funciona) |
| KLAP-1086 | Sin cuadratura SVXP vs Outgoing | 8+ meses | Reconciliation Engine | Ya implementado |
| KLAP-1681 | Acceso a datos bloqueado | 5+ semanas | Acceso total a DB propia | 0 (sin restricción) |
| KLAP-1703 | Prepago nacional como internacional | 3-4 semanas | BIN table correcta | 5 minutos |

**Velocidad de resolución: BPC 3-8 semanas → KLAP 0-10 minutos (100x más rápido)**

---

## 4. Propuesta de Ejecución

### 4.1 Estrategia: Equipo SWAT Interno

No se requiere un proyecto de $600M con equipo nuevo. La propuesta es formar un equipo SWAT con personas que ya conocen el negocio y reasignar su tiempo de "gestionar tickets con BPC" a "construir la solución propia".

### 4.2 Ventajas del enfoque SWAT

| Factor | Equipo nuevo externo | Equipo SWAT interno |
|--------|---------------------|---------------------|
| Costo | $400M - $630M | **$147M** |
| Ramp-up | 3-4 meses | **0** (ya conocen el negocio) |
| Riesgo | Medio | **Bajo** |
| Timeline | 18 meses | **12 meses** |
| Conocimiento del dominio | Tienen que aprender | **Lo viven todos los días** |

### 4.3 Estructura del equipo

| Rol | Origen | Dedicación |
|-----|--------|------------|
| Lead técnico | Equipo actual KLAP | 80% |
| Dev clearing/liquidación | Equipo que opera SVXP hoy | 100% |
| Dev autorización/fraude | Equipo que conoce el switch | 100% |
| DevOps | Infraestructura actual | 50% |
| Senior externo (contratación) | Nueva incorporación | 100% |

**Total: 4.3 FTE, de los cuales solo 1 es contratación nueva.**

### 4.4 Inversión incremental

| Concepto | Costo mensual | 12 meses |
|----------|--------------|----------|
| Contratación: 1 Senior Developer | $6.000.000 | $72.000.000 |
| Infraestructura cloud adicional | $2.500.000 | $30.000.000 |
| Herramientas (CI/CD, monitoring) | $800.000 | $9.600.000 |
| Consultoría puntual (ISO 8583, PCI) | — | $15.000.000 |
| Re-certificación PCI (módulo nuevo) | — | $20.000.000 |
| **TOTAL** | | **$146.600.000** |

### 4.5 Cronograma

| Mes | Hito | Entregable |
|-----|------|------------|
| 1-2 | Clearing Engine propio | Archivos CTF/IPM generados en paralelo |
| 3-4 | Settlement Engine propio | Comisiones calculadas correctamente (7 tickets resueltos) |
| 5-6 | Reconciliation automática | Cuadratura SVXP vs Outgoing funcionando |
| 7-8 | Conexión al switch propio | Auth rules, BIN routing operativo |
| 9-10 | Shadow mode completo | Sistema propio corriendo en paralelo con BPC |
| 11-12 | Migración gradual | Corte de clearing a BPC, operación propia |

---

## 5. Análisis Financiero

### 5.1 Retorno de inversión

| Métrica | Valor |
|---------|-------|
| Inversión total | $147.000.000 |
| Ahorro mensual post-corte (fee BPC + productividad) | $30.000.000 - $58.000.000 |
| Payback | **3 a 5 meses** |
| Ahorro primer año post-migración | $213.000.000 - $549.000.000 |
| Ahorro acumulado 3 años | $639.000.000 - $1.647.000.000 |

### 5.2 Beneficios no cuantificables

- Velocidad de innovación sin restricciones
- Eliminación total de vendor lock-in
- Control completo de releases y operación
- Capacidad de escalar sin negociar con BPC
- Atracción de talento (equipo trabaja en tecnología propia)

---

## 6. Gestión de Riesgo

| Riesgo | Mitigación |
|--------|------------|
| El sistema propio tiene bugs | Shadow mode valida paridad antes de cortar |
| El equipo no alcanza en 12 meses | Fase 1 (clearing) da valor sin cortar BPC |
| Certificación demora más | Se mantiene BPC como fallback |
| Resistencia interna al cambio | El prototipo ya funciona — no es teórico |

### Enfoque de bajo riesgo:

- **Meses 1-6:** Se construye en paralelo. BPC sigue operando normalmente.
- **Meses 7-10:** Shadow mode. Ambos sistemas corren, se comparan resultados.
- **Meses 11-12:** Solo si hay 100% paridad, se corta BPC.

Si en algún punto no funciona, se mantiene BPC sin impacto. No hay riesgo operativo.

---

## 7. Siguiente Paso

### Lo que pedimos:

1. **Aprobación** para formar el equipo SWAT (reasignación de 3 personas + 1 contratación)
2. **Presupuesto** de $147.000.000 CLP para 12 meses (infra + herramientas + consultoría + contratación)
3. **Prioridad** del proyecto en el roadmap del equipo técnico

### Lo que entregamos:

- **Mes 3:** Clearing y liquidación propios funcionando en paralelo
- **Mes 6:** Cuadratura automática + fees correctos (14 tickets Jira cerrados)
- **Mes 9:** Shadow mode validando paridad con BPC
- **Mes 12:** Independencia operativa de BPC

---

## 8. Demo en Vivo

El prototipo KLAP CORE está disponible para demostración:

**URL:** clearing-ops.vercel.app  

### Flujo sugerido para la demo:

1. Login al sistema
2. Dashboard con métricas operacionales reales
3. KLAP Engine → Autorizar una transacción en vivo
4. Pipeline → Ejecutar flujo completo (auth → fraud → settlement → webhook)
5. Switch ISO → Mostrar parsing ISO 8583 y BIN lookup
6. Pain Points → Los 14 tickets mapeados a soluciones
7. Independencia BPC → Plan por fases

---

## 9. Conclusión

La dependencia de BPC no es un problema técnico insuperable — es una decisión de negocio que podemos cambiar. KLAP CORE demuestra que el equipo interno tiene la capacidad de construir y operar los procesos críticos de forma autónoma.

La inversión de $147M se recupera en 3-5 meses y genera un ahorro sostenido de $360M-$696M anuales. El riesgo es bajo porque se opera en paralelo hasta validar paridad completa.

**La pregunta no es si podemos hacerlo — ya lo demostramos. La pregunta es cuándo empezamos.**

---

*Documento generado por el equipo de tecnología KLAP — Junio 2026*
