-- ============================================================
-- KLAP CORE — Seed Data Operación Real
-- Datos que representan un día típico de operación KLAP
-- Volumen: ~15.000 TRX/día, $3.500M CLP procesados
-- ============================================================

-- Limpiar datos anteriores
TRUNCATE transactions CASCADE;
TRUNCATE settlements CASCADE;
TRUNCATE clearing_batches CASCADE;
TRUNCATE reconciliation_items CASCADE;
TRUNCATE disputes CASCADE;
TRUNCATE operational_events CASCADE;
TRUNCATE alerts CASCADE;

-- ============================================================
-- TRANSACCIONES (genera ~200 representativas de los últimos 7 días)
-- Distribución: 60% Visa, 30% MC, 5% Amex, 5% Redcompra
-- Status: 88% settled, 5% authorized, 3% captured, 3% rejected, 1% reversed
-- ============================================================

-- HOY: Transacciones del día (simula volumen real)
INSERT INTO transactions (merchant_id, amount, card_brand, card_type, card_last_four, auth_code, reference_id, status, payment_method, installments, created_at) VALUES
-- Falabella - alto volumen
('a1b2c3d4-0004-4000-8000-000000000004', 189990, 'visa', 'credit', '4521', 'K1A001', 'KLP-TXN-20250616-001', 'settled', 'card', 6, NOW() - INTERVAL '45 minutes'),
('a1b2c3d4-0004-4000-8000-000000000004', 79990, 'mastercard', 'credit', '5432', 'K1A002', 'KLP-TXN-20250616-002', 'settled', 'card', 3, NOW() - INTERVAL '42 minutes'),
('a1b2c3d4-0004-4000-8000-000000000004', 349990, 'visa', 'credit', '4111', 'K1A003', 'KLP-TXN-20250616-003', 'authorized', 'ecommerce', 12, NOW() - INTERVAL '38 minutes'),
('a1b2c3d4-0004-4000-8000-000000000004', 29990, 'visa', 'debit', '4800', 'K1A004', 'KLP-TXN-20250616-004', 'settled', 'contactless', 1, NOW() - INTERVAL '35 minutes'),
('a1b2c3d4-0004-4000-8000-000000000004', 459990, 'mastercard', 'credit', '5200', 'K1A005', 'KLP-TXN-20250616-005', 'captured', 'card', 12, NOW() - INTERVAL '30 minutes'),
-- Líder Express - supermercado
('a1b2c3d4-0001-4000-8000-000000000001', 45230, 'visa', 'debit', '4600', 'K1B001', 'KLP-TXN-20250616-006', 'settled', 'contactless', 1, NOW() - INTERVAL '28 minutes'),
('a1b2c3d4-0001-4000-8000-000000000001', 67890, 'redcompra', 'debit', '6011', 'K1B002', 'KLP-TXN-20250616-007', 'settled', 'card', 1, NOW() - INTERVAL '25 minutes'),
('a1b2c3d4-0001-4000-8000-000000000001', 23450, 'visa', 'debit', '4900', 'K1B003', 'KLP-TXN-20250616-008', 'settled', 'contactless', 1, NOW() - INTERVAL '22 minutes'),
('a1b2c3d4-0001-4000-8000-000000000001', 112340, 'mastercard', 'credit', '5100', 'K1B004', 'KLP-TXN-20250616-009', 'settled', 'card', 3, NOW() - INTERVAL '20 minutes'),
('a1b2c3d4-0001-4000-8000-000000000001', 8990, 'visa', 'debit', '4333', 'K1B005', 'KLP-TXN-20250616-010', 'settled', 'qr', 1, NOW() - INTERVAL '18 minutes'),
-- Copec - combustible
('a1b2c3d4-0003-4000-8000-000000000003', 52000, 'visa', 'debit', '4200', 'K1C001', 'KLP-TXN-20250616-011', 'settled', 'card', 1, NOW() - INTERVAL '15 minutes'),
('a1b2c3d4-0003-4000-8000-000000000003', 38000, 'mastercard', 'debit', '5050', 'K1C002', 'KLP-TXN-20250616-012', 'settled', 'contactless', 1, NOW() - INTERVAL '12 minutes'),
('a1b2c3d4-0003-4000-8000-000000000003', 71000, 'visa', 'credit', '4777', 'K1C003', 'KLP-TXN-20250616-013', 'settled', 'card', 1, NOW() - INTERVAL '10 minutes'),
-- Rappi - delivery
('a1b2c3d4-0005-4000-8000-000000000005', 15600, 'visa', 'credit', '4444', 'K1D001', 'KLP-TXN-20250616-014', 'settled', 'ecommerce', 1, NOW() - INTERVAL '8 minutes'),
('a1b2c3d4-0005-4000-8000-000000000005', 22800, 'mastercard', 'credit', '5300', 'K1D002', 'KLP-TXN-20250616-015', 'settled', 'ecommerce', 1, NOW() - INTERVAL '5 minutes'),
('a1b2c3d4-0005-4000-8000-000000000005', 9500, 'visa', 'debit', '4100', 'K1D003', 'KLP-TXN-20250616-016', 'rejected', 'ecommerce', 1, NOW() - INTERVAL '3 minutes'),
-- LATAM - aerolíneas alto valor
('a1b2c3d4-0010-4000-8000-000000000010', 890000, 'visa', 'credit', '4521', 'K1E001', 'KLP-TXN-20250616-017', 'settled', 'ecommerce', 12, NOW() - INTERVAL '1 hour'),
('a1b2c3d4-0010-4000-8000-000000000010', 1250000, 'mastercard', 'credit', '5600', 'K1E002', 'KLP-TXN-20250616-018', 'settled', 'ecommerce', 12, NOW() - INTERVAL '1 hour 15 minutes'),
('a1b2c3d4-0010-4000-8000-000000000010', 456000, 'amex', 'credit', '3782', 'K1E003', 'KLP-TXN-20250616-019', 'captured', 'ecommerce', 6, NOW() - INTERVAL '1 hour 30 minutes'),
-- Uber
('a1b2c3d4-0008-4000-8000-000000000008', 8900, 'visa', 'credit', '4155', 'K1F001', 'KLP-TXN-20250616-020', 'settled', 'ecommerce', 1, NOW() - INTERVAL '2 hours'),
('a1b2c3d4-0008-4000-8000-000000000008', 12300, 'mastercard', 'debit', '5400', 'K1F002', 'KLP-TXN-20250616-021', 'settled', 'ecommerce', 1, NOW() - INTERVAL '2 hours 10 minutes'),
('a1b2c3d4-0008-4000-8000-000000000008', 6700, 'visa', 'debit', '4050', 'K1F003', 'KLP-TXN-20250616-022', 'settled', 'ecommerce', 1, NOW() - INTERVAL '2 hours 20 minutes'),
-- Starbucks - bajo valor alto volumen
('a1b2c3d4-0006-4000-8000-000000000006', 4500, 'visa', 'debit', '4600', 'K1G001', 'KLP-TXN-20250616-023', 'settled', 'contactless', 1, NOW() - INTERVAL '2 hours 30 minutes'),
('a1b2c3d4-0006-4000-8000-000000000006', 5200, 'mastercard', 'debit', '5150', 'K1G002', 'KLP-TXN-20250616-024', 'settled', 'contactless', 1, NOW() - INTERVAL '2 hours 40 minutes'),
('a1b2c3d4-0006-4000-8000-000000000006', 3800, 'visa', 'debit', '4321', 'K1G003', 'KLP-TXN-20250616-025', 'settled', 'qr', 1, NOW() - INTERVAL '2 hours 50 minutes'),
-- París - retail
('a1b2c3d4-0007-4000-8000-000000000007', 129990, 'visa', 'credit', '4700', 'K1H001', 'KLP-TXN-20250616-026', 'settled', 'card', 6, NOW() - INTERVAL '3 hours'),
('a1b2c3d4-0007-4000-8000-000000000007', 89990, 'mastercard', 'credit', '5800', 'K1H002', 'KLP-TXN-20250616-027', 'settled', 'card', 3, NOW() - INTERVAL '3 hours 15 minutes'),
('a1b2c3d4-0007-4000-8000-000000000007', 249990, 'visa', 'credit', '4900', 'K1H003', 'KLP-TXN-20250616-028', 'authorized', 'ecommerce', 12, NOW() - INTERVAL '3 hours 30 minutes'),
-- Cruz Verde - farmacia
('a1b2c3d4-0002-4000-8000-000000000002', 18990, 'visa', 'debit', '4111', 'K1I001', 'KLP-TXN-20250616-029', 'settled', 'contactless', 1, NOW() - INTERVAL '3 hours 45 minutes'),
('a1b2c3d4-0002-4000-8000-000000000002', 34560, 'redcompra', 'debit', '6500', 'K1I002', 'KLP-TXN-20250616-030', 'settled', 'card', 1, NOW() - INTERVAL '4 hours'),
-- Rechazada - fondos insuficientes
('a1b2c3d4-0005-4000-8000-000000000005', 285000, 'visa', 'credit', '4000', NULL, 'KLP-TXN-20250616-031', 'rejected', 'ecommerce', 12, NOW() - INTERVAL '4 hours 15 minutes'),
-- Reversada
('a1b2c3d4-0001-4000-8000-000000000001', 56780, 'mastercard', 'credit', '5555', 'K1J001', 'KLP-TXN-20250616-032', 'reversed', 'card', 1, NOW() - INTERVAL '4 hours 30 minutes');

-- AYER y días anteriores (volumen alto para gráficos)
INSERT INTO transactions (merchant_id, amount, card_brand, card_type, card_last_four, auth_code, reference_id, status, payment_method, installments, created_at)
SELECT
  merchant_id::uuid,
  amount + (random() * 20000)::int,
  card_brand,
  card_type,
  card_last_four,
  'K' || substr(md5(random()::text), 1, 5),
  'KLP-' || substr(md5(random()::text), 1, 12),
  CASE WHEN random() < 0.88 THEN 'settled'
       WHEN random() < 0.93 THEN 'authorized'
       WHEN random() < 0.96 THEN 'captured'
       WHEN random() < 0.99 THEN 'rejected'
       ELSE 'reversed' END,
  payment_method,
  installments,
  NOW() - (n || ' hours')::interval
FROM (
  SELECT * FROM (VALUES
    ('a1b2c3d4-0004-4000-8000-000000000004'::text, 159990, 'visa', 'credit', '4521', 'card', 6),
    ('a1b2c3d4-0004-4000-8000-000000000004'::text, 89990, 'mastercard', 'credit', '5432', 'card', 3),
    ('a1b2c3d4-0001-4000-8000-000000000001'::text, 43200, 'visa', 'debit', '4600', 'contactless', 1),
    ('a1b2c3d4-0001-4000-8000-000000000001'::text, 78900, 'mastercard', 'credit', '5100', 'card', 1),
    ('a1b2c3d4-0003-4000-8000-000000000003'::text, 55000, 'visa', 'debit', '4200', 'card', 1),
    ('a1b2c3d4-0003-4000-8000-000000000003'::text, 42000, 'redcompra', 'debit', '6011', 'card', 1),
    ('a1b2c3d4-0010-4000-8000-000000000010'::text, 780000, 'visa', 'credit', '4800', 'ecommerce', 12),
    ('a1b2c3d4-0010-4000-8000-000000000010'::text, 1120000, 'mastercard', 'credit', '5600', 'ecommerce', 6),
    ('a1b2c3d4-0005-4000-8000-000000000005'::text, 18500, 'visa', 'credit', '4444', 'ecommerce', 1),
    ('a1b2c3d4-0008-4000-8000-000000000008'::text, 9800, 'visa', 'credit', '4155', 'ecommerce', 1),
    ('a1b2c3d4-0006-4000-8000-000000000006'::text, 4800, 'visa', 'debit', '4321', 'contactless', 1),
    ('a1b2c3d4-0007-4000-8000-000000000007'::text, 199990, 'visa', 'credit', '4700', 'card', 6),
    ('a1b2c3d4-0002-4000-8000-000000000002'::text, 12500, 'visa', 'debit', '4111', 'card', 1),
    ('a1b2c3d4-0009-4000-8000-000000000009'::text, 34500, 'mastercard', 'credit', '5900', 'qr', 1),
    ('a1b2c3d4-0004-4000-8000-000000000004'::text, 299990, 'amex', 'credit', '3782', 'card', 12)
  ) AS t(merchant_id, amount, card_brand, card_type, card_last_four, payment_method, installments)
) base
CROSS JOIN generate_series(5, 168, 1) AS n;  -- 163 txns (cada hora por 7 días)

-- ============================================================
-- CLEARING BATCHES (últimos 7 días)
-- ============================================================

INSERT INTO clearing_batches (batch_number, card_brand, status, transaction_count, total_amount, file_name, generated_at, sent_at, confirmed_at, created_at) VALUES
-- Hoy
('VISA-20250616-001', 'visa', 'processing', 8742, 1856000000, NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 hours'),
('MC-20250616-001', 'mastercard', 'pending', 4521, 945000000, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 hour'),
-- Ayer
('VISA-20250615-001', 'visa', 'confirmed', 9120, 1923000000, 'CTF_VISA_20250615_001.dat', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '17 hours', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '20 hours'),
('MC-20250615-001', 'mastercard', 'confirmed', 4890, 1012000000, 'IPM_MC_20250615_001.dat', NOW() - INTERVAL '17 hours', NOW() - INTERVAL '16 hours', NOW() - INTERVAL '13 hours', NOW() - INTERVAL '19 hours'),
-- Antier
('VISA-20250614-001', 'visa', 'confirmed', 8956, 1890000000, 'CTF_VISA_20250614_001.dat', NOW() - INTERVAL '42 hours', NOW() - INTERVAL '41 hours', NOW() - INTERVAL '38 hours', NOW() - INTERVAL '44 hours'),
('MC-20250614-001', 'mastercard', 'confirmed', 4780, 998000000, 'IPM_MC_20250614_001.dat', NOW() - INTERVAL '41 hours', NOW() - INTERVAL '40 hours', NOW() - INTERVAL '37 hours', NOW() - INTERVAL '43 hours'),
-- 3 días
('VISA-20250613-001', 'visa', 'confirmed', 9234, 1945000000, 'CTF_VISA_20250613_001.dat', NOW() - INTERVAL '66 hours', NOW() - INTERVAL '65 hours', NOW() - INTERVAL '62 hours', NOW() - INTERVAL '68 hours'),
('MC-20250613-001', 'mastercard', 'confirmed', 5012, 1045000000, 'IPM_MC_20250613_001.dat', NOW() - INTERVAL '65 hours', NOW() - INTERVAL '64 hours', NOW() - INTERVAL '61 hours', NOW() - INTERVAL '67 hours'),
-- 4 días - uno fallido
('VISA-20250612-001', 'visa', 'confirmed', 8890, 1876000000, 'CTF_VISA_20250612_001.dat', NOW() - INTERVAL '90 hours', NOW() - INTERVAL '89 hours', NOW() - INTERVAL '86 hours', NOW() - INTERVAL '92 hours'),
('MC-20250612-001', 'mastercard', 'failed', 4650, 967000000, NULL, NULL, NULL, NULL, NOW() - INTERVAL '91 hours'),
-- 5 días
('VISA-20250611-001', 'visa', 'confirmed', 9100, 1912000000, 'CTF_VISA_20250611_001.dat', NOW() - INTERVAL '114 hours', NOW() - INTERVAL '113 hours', NOW() - INTERVAL '110 hours', NOW() - INTERVAL '116 hours'),
('MC-20250611-001', 'mastercard', 'confirmed', 4920, 1023000000, 'IPM_MC_20250611_001.dat', NOW() - INTERVAL '113 hours', NOW() - INTERVAL '112 hours', NOW() - INTERVAL '109 hours', NOW() - INTERVAL '115 hours');

-- ============================================================
-- SETTLEMENTS (liquidaciones reales por comercio)
-- ============================================================

INSERT INTO settlements (merchant_id, settlement_date, gross_amount, commission, iva, withholdings, net_amount, transaction_count, status, paid_at, created_at) VALUES
-- Hoy
('a1b2c3d4-0004-4000-8000-000000000004', CURRENT_DATE, 456000000, 10032000, 1906080, 2280000, 441781920, 3450, 'processing', NULL, NOW() - INTERVAL '3 hours'),
('a1b2c3d4-0001-4000-8000-000000000001', CURRENT_DATE, 234000000, 3510000, 666900, 1170000, 228653100, 4120, 'processing', NULL, NOW() - INTERVAL '3 hours'),
('a1b2c3d4-0010-4000-8000-000000000010', CURRENT_DATE, 890000000, 24920000, 4734800, 4450000, 855895200, 1250, 'pending', NULL, NOW() - INTERVAL '2 hours'),
('a1b2c3d4-0003-4000-8000-000000000003', CURRENT_DATE, 178000000, 2670000, 507300, 890000, 173932700, 2890, 'paid', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '4 hours'),
('a1b2c3d4-0005-4000-8000-000000000005', CURRENT_DATE, 67000000, 1876000, 356440, 335000, 64432560, 1890, 'paid', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '4 hours'),
-- Ayer
('a1b2c3d4-0004-4000-8000-000000000004', CURRENT_DATE - 1, 478000000, 10516000, 1998040, 2390000, 463095960, 3620, 'paid', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '24 hours'),
('a1b2c3d4-0001-4000-8000-000000000001', CURRENT_DATE - 1, 245000000, 3675000, 698250, 1225000, 239401750, 4350, 'paid', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '24 hours'),
('a1b2c3d4-0010-4000-8000-000000000010', CURRENT_DATE - 1, 920000000, 25760000, 4894400, 4600000, 884745600, 1180, 'paid', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '24 hours'),
('a1b2c3d4-0007-4000-8000-000000000007', CURRENT_DATE - 1, 312000000, 7176000, 1363440, 1560000, 301900560, 2450, 'paid', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '24 hours'),
('a1b2c3d4-0008-4000-8000-000000000008', CURRENT_DATE, 89000000, 2492000, 473480, 445000, 85589520, 3200, 'failed', NULL, NOW() - INTERVAL '2 hours');

-- ============================================================
-- RECONCILIATION (conciliación últimos 7 días)
-- ============================================================

INSERT INTO reconciliation_items (reconciliation_date, source_klap, source_bank, source_brand, difference_amount, transaction_count_klap, transaction_count_bank, transaction_count_brand, card_brand, status, notes, created_at) VALUES
(CURRENT_DATE, 1856000000, 1856000000, 1856000000, 0, 8742, 8742, 8742, 'visa', 'reconciled', NULL, NOW() - INTERVAL '1 hour'),
(CURRENT_DATE, 945000000, 944850000, 945000000, 150000, 4521, 4519, 4521, 'mastercard', 'mismatch', '2 transacciones pendientes de confirmación en banco — Monto: $150.000', NOW() - INTERVAL '1 hour'),
(CURRENT_DATE - 1, 1923000000, 1923000000, 1923000000, 0, 9120, 9120, 9120, 'visa', 'reconciled', NULL, NOW() - INTERVAL '20 hours'),
(CURRENT_DATE - 1, 1012000000, 1012000000, 1012000000, 0, 4890, 4890, 4890, 'mastercard', 'reconciled', NULL, NOW() - INTERVAL '20 hours'),
(CURRENT_DATE - 2, 1890000000, 1890000000, 1890000000, 0, 8956, 8956, 8956, 'visa', 'reconciled', NULL, NOW() - INTERVAL '44 hours'),
(CURRENT_DATE - 2, 998000000, 998000000, 998000000, 0, 4780, 4780, 4780, 'mastercard', 'reconciled', NULL, NOW() - INTERVAL '44 hours'),
(CURRENT_DATE - 3, 1945000000, 1945000000, 1945000000, 0, 9234, 9234, 9234, 'visa', 'reconciled', NULL, NOW() - INTERVAL '68 hours'),
(CURRENT_DATE - 3, 1045000000, 1045000000, 1045000000, 0, 5012, 5012, 5012, 'mastercard', 'reconciled', NULL, NOW() - INTERVAL '68 hours'),
(CURRENT_DATE - 4, 1876000000, 1876000000, 1876000000, 0, 8890, 8890, 8890, 'visa', 'reconciled', NULL, NOW() - INTERVAL '92 hours'),
(CURRENT_DATE - 4, 967000000, 967000000, 964500000, 2500000, 4650, 4650, 4645, 'mastercard', 'investigating', '5 transacciones no reportadas por MC en batch. Diferencia: $2.500.000 — Escalado a equipo de clearing', NOW() - INTERVAL '92 hours');

-- ============================================================
-- DISPUTES (chargebacks activos - montos altos para impacto)
-- ============================================================

INSERT INTO disputes (transaction_id, merchant_id, amount, reason, reason_code, card_brand, status, deadline, evidence_submitted, created_at) VALUES
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-017' LIMIT 1), 'a1b2c3d4-0010-4000-8000-000000000010', 890000, 'Pasaje no utilizado — vuelo cancelado por aerolínea', '13.7', 'visa', 'open', CURRENT_DATE + 18, FALSE, NOW() - INTERVAL '2 days'),
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-018' LIMIT 1), 'a1b2c3d4-0010-4000-8000-000000000010', 1250000, 'Tarjetahabiente no reconoce la compra', '10.4', 'mastercard', 'under_review', CURRENT_DATE + 12, TRUE, NOW() - INTERVAL '5 days'),
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-001' LIMIT 1), 'a1b2c3d4-0004-4000-8000-000000000004', 189990, 'Producto defectuoso — solicita reembolso', '13.3', 'visa', 'representment', CURRENT_DATE + 8, TRUE, NOW() - INTERVAL '12 days'),
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-026' LIMIT 1), 'a1b2c3d4-0007-4000-8000-000000000007', 129990, 'Cargo duplicado en estado de cuenta', '12.6', 'visa', 'open', CURRENT_DATE + 22, FALSE, NOW() - INTERVAL '1 day'),
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-002' LIMIT 1), 'a1b2c3d4-0004-4000-8000-000000000004', 79990, 'Producto no recibido después de 30 días', '13.1', 'mastercard', 'under_review', CURRENT_DATE + 15, TRUE, NOW() - INTERVAL '8 days'),
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-005' LIMIT 1), 'a1b2c3d4-0004-4000-8000-000000000004', 459990, 'Fraude — tarjeta clonada (EMV Liability)', '10.1', 'mastercard', 'open', CURRENT_DATE + 10, FALSE, NOW() - INTERVAL '3 days'),
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-027' LIMIT 1), 'a1b2c3d4-0007-4000-8000-000000000007', 89990, 'Suscripción cancelada pero siguieron cobrando', '13.6', 'mastercard', 'won', NULL, TRUE, NOW() - INTERVAL '20 days'),
((SELECT id FROM transactions WHERE reference_id = 'KLP-TXN-20250616-003' LIMIT 1), 'a1b2c3d4-0004-4000-8000-000000000004', 349990, 'Compra online no autorizada', '10.4', 'visa', 'lost', NULL, TRUE, NOW() - INTERVAL '30 days');

-- ============================================================
-- OPERATIONAL EVENTS (actividad real del sistema)
-- ============================================================

INSERT INTO operational_events (event_type, source, message, status, created_at) VALUES
('job', 'klap-clearing-engine', 'Batch VISA-20250615-001 generado exitosamente — 9.120 TRX, $1.923M — Checksum: A7F2BC01', 'resolved', NOW() - INTERVAL '18 hours'),
('job', 'klap-clearing-engine', 'Batch MC-20250615-001 enviado a Mastercard Connect — Confirmación pendiente', 'resolved', NOW() - INTERVAL '17 hours'),
('job', 'klap-settlement-engine', 'Liquidación diaria completada — 5 comercios procesados, $1.825M liquidado', 'resolved', NOW() - INTERVAL '15 hours'),
('critical', 'klap-fraud-engine', 'ALERTA FRAUDE: 3 transacciones > $400K desde IP única (186.45.xx.xx) en 5 minutos — Merchant Falabella', 'active', NOW() - INTERVAL '35 minutes'),
('error', 'klap-settlement-engine', 'Liquidación Uber Chile FALLIDA — Timeout en conexión con Banco Estado (error: ECONNREFUSED)', 'active', NOW() - INTERVAL '2 hours'),
('warning', 'klap-reconciliation-engine', 'Descuadre detectado MC 16/06: 2 TRX faltantes en banco ($150.000) — Investigación abierta', 'active', NOW() - INTERVAL '1 hour'),
('info', 'klap-auth-engine', 'Tasa de aprobación última hora: 94.2% (9.120 aprobadas / 9.680 intentadas) — Normal', 'resolved', NOW() - INTERVAL '30 minutes'),
('warning', 'klap-auth-engine', 'Latencia Visa Gateway elevada: 780ms promedio (umbral: 500ms) — Monitoreando', 'active', NOW() - INTERVAL '20 minutes'),
('job', 'klap-scheduler', 'Job "Escaneo Antifraude" completado — 4.521 transacciones analizadas, 3 alertas generadas', 'resolved', NOW() - INTERVAL '15 minutes'),
('info', 'klap-webhook-engine', 'Webhooks entregados: 847/850 (99.6%) — 3 en retry (Rappi endpoint timeout)', 'resolved', NOW() - INTERVAL '10 minutes'),
('job', 'klap-clearing-engine', 'Batch VISA-20250616-001 en procesamiento — 8.742 TRX pendientes de generación', 'active', NOW() - INTERVAL '2 hours'),
('critical', 'klap-fraud-engine', 'Patrón de testing de tarjetas detectado: 15 intentos por $100 en 2 minutos — Merchant Rappi — IP bloqueada', 'active', NOW() - INTERVAL '45 minutes'),
('error', 'klap-clearing-engine', 'Batch MC-20250612-001 FALLÓ — Error de formato en registro 4.623: campo DE49 inválido', 'active', NOW() - INTERVAL '4 days'),
('info', 'klap-pipeline', 'Pipeline health: Auth 99.8% | Fraud 100% | Settlement 98.2% | Webhook 99.6%', 'resolved', NOW() - INTERVAL '5 minutes');

-- ============================================================
-- ALERTS (alertas del sistema - variedad de severidades)
-- ============================================================

INSERT INTO alerts (type, severity, title, description, is_read, is_resolved, created_at) VALUES
('security', 'critical', 'Patrón de fraude masivo detectado', '3 transacciones por $400K+ desde misma IP en 5 min. Merchant: Falabella Retail. Acción: Bloqueo temporal de IP y revisión manual.', FALSE, FALSE, NOW() - INTERVAL '35 minutes'),
('security', 'critical', 'Testing de tarjetas detectado', '15 intentos de $100 en 2 minutos en Rappi. Patrón típico de validación de BINs robados. IP bloqueada automáticamente.', FALSE, FALSE, NOW() - INTERVAL '45 minutes'),
('settlement', 'high', 'Liquidación Uber Chile fallida', 'Timeout al conectar con Banco Estado para transferencia de $85.5M. Retry programado en 30 minutos.', FALSE, FALSE, NOW() - INTERVAL '2 hours'),
('reconciliation', 'high', 'Descuadre Mastercard $150.000', '2 transacciones de KLAP no reflejadas en reporte bancario. IDs: KLP-TXN-20250616-012, KLP-TXN-20250616-015.', FALSE, FALSE, NOW() - INTERVAL '1 hour'),
('dispute', 'high', 'Nueva disputa alto valor: $1.250.000', 'Chargeback LATAM Airlines — "Tarjetahabiente no reconoce compra" (MC 10.4). Deadline: 12 días.', FALSE, FALSE, NOW() - INTERVAL '5 days'),
('transaction', 'medium', 'Tasa de rechazo elevada Rappi', 'Tasa de rechazo 12.3% en última hora (normal: 5%). Posible problema con BIN prepago o límites del emisor.', TRUE, FALSE, NOW() - INTERVAL '3 hours'),
('system', 'medium', 'Latencia gateway Visa elevada', 'Promedio 780ms (umbral: 500ms). No hay pérdida de transacciones pero impacta UX en POS.', TRUE, FALSE, NOW() - INTERVAL '20 minutes'),
('dispute', 'medium', 'Disputa próxima a vencer', 'Representment para Falabella ($189.990) vence en 8 días. Evidencia enviada pero sin respuesta de Visa.', FALSE, FALSE, NOW() - INTERVAL '2 hours'),
('system', 'low', 'Certificado SSL renewal', 'Certificado del endpoint clearing.klap.cl vence en 22 días. Auto-renewal programado.', TRUE, FALSE, NOW() - INTERVAL '1 day'),
('reconciliation', 'high', 'Investigación abierta MC batch 12/06', 'Diferencia de $2.500.000 en 5 TRX del batch MC-20250612-001. Escalado a equipo de clearing para revisión manual.', FALSE, FALSE, NOW() - INTERVAL '4 days');
