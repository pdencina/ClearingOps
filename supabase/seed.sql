-- ============================================================
-- KLAP CORE — Seed Data Realista
-- ============================================================

-- Merchants
INSERT INTO merchants (id, name, rut, mcc, category, status, contact_email, city) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Supermercado Líder Express', '76.123.456-7', '5411', 'retail', 'active', 'pagos@lider.cl', 'Santiago'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Farmacias Cruz Verde', '76.234.567-8', '5912', 'pharmacy', 'active', 'finanzas@cruzverde.cl', 'Santiago'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Copec Estaciones', '76.345.678-9', '5541', 'fuel', 'active', 'clearing@copec.cl', 'Concepción'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Falabella Retail', '76.456.789-0', '5311', 'department_store', 'active', 'tesoreria@falabella.cl', 'Santiago'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Rappi Chile', '76.567.890-1', '5812', 'food_delivery', 'active', 'ops@rappi.cl', 'Santiago'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Starbucks Chile', '76.678.901-2', '5814', 'restaurant', 'active', 'finance@starbucks.cl', 'Viña del Mar'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'Cencosud Paris', '76.789.012-3', '5311', 'department_store', 'active', 'pagos@paris.cl', 'Santiago'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'Uber Chile', '76.890.123-4', '4121', 'transport', 'active', 'payments@uber.cl', 'Santiago'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'NotCo Foods', '76.901.234-5', '5499', 'food', 'active', 'finance@notco.cl', 'Santiago'),
  ('a1b2c3d4-0010-4000-8000-000000000010', 'Latam Airlines', '76.012.345-6', '4511', 'airlines', 'active', 'treasury@latam.cl', 'Santiago');

-- Terminals
INSERT INTO terminals (id, merchant_id, terminal_code, model, status, location) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'TRM-001-LDR', 'Verifone P400', 'active', 'Caja 1 - Local Providencia'),
  ('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', 'TRM-002-LDR', 'Verifone P400', 'active', 'Caja 2 - Local Providencia'),
  ('b1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0002-4000-8000-000000000002', 'TRM-001-CRV', 'Ingenico Move5000', 'active', 'Local Mall Plaza'),
  ('b1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-0003-4000-8000-000000000003', 'TRM-001-CPC', 'PAX A920', 'active', 'Estación Vitacura'),
  ('b1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-0004-4000-8000-000000000004', 'TRM-001-FLB', 'Verifone V240m', 'active', 'Piso 1 - Costanera'),
  ('b1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0005-4000-8000-000000000005', 'TRM-001-RPP', 'Virtual POS', 'active', 'E-commerce'),
  ('b1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-0006-4000-8000-000000000006', 'TRM-001-STB', 'PAX A920', 'active', 'Local Costanera Center'),
  ('b1b2c3d4-0008-4000-8000-000000000008', 'a1b2c3d4-0007-4000-8000-000000000007', 'TRM-001-PRS', 'Verifone P400', 'active', 'Caja Central'),
  ('b1b2c3d4-0009-4000-8000-000000000009', 'a1b2c3d4-0008-4000-8000-000000000008', 'TRM-001-UBR', 'Virtual POS', 'active', 'App Payments'),
  ('b1b2c3d4-0010-4000-8000-000000000010', 'a1b2c3d4-0009-4000-8000-000000000009', 'TRM-001-NTC', 'Virtual POS', 'active', 'E-commerce');

-- Transactions (200 transacciones realistas)
INSERT INTO transactions (merchant_id, terminal_id, amount, card_brand, card_type, card_last_four, auth_code, reference_id, status, payment_method, installments, created_at) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 45230.00, 'visa', 'credit', '4521', 'A00001', 'REF-2025-000001', 'settled', 'card', 1, NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 12500.00, 'mastercard', 'debit', '5432', 'A00002', 'REF-2025-000002', 'settled', 'contactless', 1, NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0003-4000-8000-000000000003', 8990.00, 'visa', 'debit', '4111', 'A00003', 'REF-2025-000003', 'authorized', 'card', 1, NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0004-4000-8000-000000000004', 52000.00, 'mastercard', 'credit', '5555', 'A00004', 'REF-2025-000004', 'captured', 'card', 3, NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0005-4000-8000-000000000005', 189990.00, 'visa', 'credit', '4000', 'A00005', 'REF-2025-000005', 'settled', 'card', 6, NOW() - INTERVAL '5 hours'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0006-4000-8000-000000000006', 15600.00, 'visa', 'credit', '4222', 'A00006', 'REF-2025-000006', 'authorized', 'ecommerce', 1, NOW() - INTERVAL '30 minutes'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'b1b2c3d4-0007-4000-8000-000000000007', 4500.00, 'mastercard', 'debit', '5100', 'A00007', 'REF-2025-000007', 'settled', 'contactless', 1, NOW() - INTERVAL '6 hours'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'b1b2c3d4-0008-4000-8000-000000000008', 67890.00, 'visa', 'credit', '4321', 'A00008', 'REF-2025-000008', 'captured', 'card', 3, NOW() - INTERVAL '7 hours'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'b1b2c3d4-0009-4000-8000-000000000009', 8900.00, 'mastercard', 'credit', '5200', 'A00009', 'REF-2025-000009', 'rejected', 'ecommerce', 1, NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'b1b2c3d4-0010-4000-8000-000000000010', 22500.00, 'visa', 'debit', '4900', 'A00010', 'REF-2025-000010', 'settled', 'qr', 1, NOW() - INTERVAL '8 hours'),
  ('a1b2c3d4-0010-4000-8000-000000000010', NULL, 350000.00, 'visa', 'credit', '4800', 'A00011', 'REF-2025-000011', 'settled', 'ecommerce', 12, NOW() - INTERVAL '9 hours'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000002', 3200.00, 'redcompra', 'debit', '6011', 'A00012', 'REF-2025-000012', 'settled', 'card', 1, NOW() - INTERVAL '10 hours'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0003-4000-8000-000000000003', 15750.00, 'visa', 'credit', '4155', 'A00013', 'REF-2025-000013', 'reversed', 'card', 1, NOW() - INTERVAL '11 hours'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0004-4000-8000-000000000004', 41000.00, 'mastercard', 'credit', '5300', 'A00014', 'REF-2025-000014', 'settled', 'card', 1, NOW() - INTERVAL '12 hours'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0005-4000-8000-000000000005', 299990.00, 'visa', 'credit', '4777', 'A00015', 'REF-2025-000015', 'settled', 'card', 12, NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0006-4000-8000-000000000006', 9800.00, 'mastercard', 'debit', '5400', 'A00016', 'REF-2025-000016', 'authorized', 'ecommerce', 1, NOW() - INTERVAL '20 minutes'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'b1b2c3d4-0007-4000-8000-000000000007', 5200.00, 'visa', 'debit', '4600', 'A00017', 'REF-2025-000017', 'settled', 'contactless', 1, NOW() - INTERVAL '1 day 2 hours'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'b1b2c3d4-0008-4000-8000-000000000008', 125000.00, 'mastercard', 'credit', '5150', 'A00018', 'REF-2025-000018', 'captured', 'card', 6, NOW() - INTERVAL '1 day 3 hours'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'b1b2c3d4-0009-4000-8000-000000000009', 12300.00, 'visa', 'credit', '4333', 'A00019', 'REF-2025-000019', 'settled', 'ecommerce', 1, NOW() - INTERVAL '1 day 5 hours'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'b1b2c3d4-0010-4000-8000-000000000010', 7600.00, 'visa', 'debit', '4100', 'A00020', 'REF-2025-000020', 'rejected', 'qr', 1, NOW() - INTERVAL '1 day 6 hours'),
  ('a1b2c3d4-0010-4000-8000-000000000010', NULL, 520000.00, 'mastercard', 'credit', '5600', 'A00021', 'REF-2025-000021', 'settled', 'ecommerce', 12, NOW() - INTERVAL '1 day 8 hours'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 28900.00, 'visa', 'credit', '4521', 'A00022', 'REF-2025-000022', 'settled', 'card', 1, NOW() - INTERVAL '1 day 9 hours'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0003-4000-8000-000000000003', 6300.00, 'redcompra', 'debit', '6500', 'A00023', 'REF-2025-000023', 'settled', 'card', 1, NOW() - INTERVAL '1 day 10 hours'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0004-4000-8000-000000000004', 38000.00, 'visa', 'debit', '4200', 'A00024', 'REF-2025-000024', 'settled', 'card', 1, NOW() - INTERVAL '2 days'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0005-4000-8000-000000000005', 159990.00, 'mastercard', 'credit', '5800', 'A00025', 'REF-2025-000025', 'settled', 'card', 3, NOW() - INTERVAL '2 days 1 hour'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0006-4000-8000-000000000006', 18200.00, 'visa', 'credit', '4444', 'A00026', 'REF-2025-000026', 'settled', 'ecommerce', 1, NOW() - INTERVAL '2 days 3 hours'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'b1b2c3d4-0007-4000-8000-000000000007', 3800.00, 'mastercard', 'debit', '5050', 'A00027', 'REF-2025-000027', 'rejected', 'contactless', 1, NOW() - INTERVAL '2 days 4 hours'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'b1b2c3d4-0008-4000-8000-000000000008', 89900.00, 'visa', 'credit', '4700', 'A00028', 'REF-2025-000028', 'settled', 'card', 3, NOW() - INTERVAL '2 days 5 hours'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'b1b2c3d4-0009-4000-8000-000000000009', 6500.00, 'visa', 'debit', '4050', 'A00029', 'REF-2025-000029', 'settled', 'ecommerce', 1, NOW() - INTERVAL '2 days 7 hours'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'b1b2c3d4-0010-4000-8000-000000000010', 14200.00, 'mastercard', 'credit', '5900', 'A00030', 'REF-2025-000030', 'settled', 'qr', 1, NOW() - INTERVAL '2 days 8 hours'),
  -- Additional bulk transactions for volume
  ('a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 33500.00, 'visa', 'credit', '4521', 'A00031', 'REF-2025-000031', 'settled', 'card', 1, NOW() - INTERVAL '3 days'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0003-4000-8000-000000000003', 11200.00, 'mastercard', 'debit', '5432', 'A00032', 'REF-2025-000032', 'settled', 'card', 1, NOW() - INTERVAL '3 days 2 hours'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0004-4000-8000-000000000004', 55000.00, 'visa', 'credit', '4111', 'A00033', 'REF-2025-000033', 'settled', 'card', 3, NOW() - INTERVAL '3 days 4 hours'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0005-4000-8000-000000000005', 245000.00, 'mastercard', 'credit', '5555', 'A00034', 'REF-2025-000034', 'settled', 'card', 6, NOW() - INTERVAL '3 days 5 hours'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0006-4000-8000-000000000006', 21000.00, 'visa', 'debit', '4000', 'A00035', 'REF-2025-000035', 'settled', 'ecommerce', 1, NOW() - INTERVAL '3 days 7 hours'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'b1b2c3d4-0007-4000-8000-000000000007', 4800.00, 'redcompra', 'debit', '6200', 'A00036', 'REF-2025-000036', 'settled', 'contactless', 1, NOW() - INTERVAL '4 days'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'b1b2c3d4-0008-4000-8000-000000000008', 78000.00, 'visa', 'credit', '4321', 'A00037', 'REF-2025-000037', 'settled', 'card', 3, NOW() - INTERVAL '4 days 1 hour'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'b1b2c3d4-0009-4000-8000-000000000009', 15000.00, 'mastercard', 'credit', '5200', 'A00038', 'REF-2025-000038', 'settled', 'ecommerce', 1, NOW() - INTERVAL '4 days 3 hours'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'b1b2c3d4-0010-4000-8000-000000000010', 9800.00, 'visa', 'debit', '4900', 'A00039', 'REF-2025-000039', 'settled', 'qr', 1, NOW() - INTERVAL '4 days 5 hours'),
  ('a1b2c3d4-0010-4000-8000-000000000010', NULL, 680000.00, 'visa', 'credit', '4800', 'A00040', 'REF-2025-000040', 'settled', 'ecommerce', 12, NOW() - INTERVAL '5 days'),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000002', 19500.00, 'mastercard', 'credit', '5100', 'A00041', 'REF-2025-000041', 'reversed', 'card', 1, NOW() - INTERVAL '5 days 2 hours'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'b1b2c3d4-0005-4000-8000-000000000005', 450000.00, 'visa', 'credit', '4777', 'A00042', 'REF-2025-000042', 'settled', 'card', 12, NOW() - INTERVAL '5 days 4 hours'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'b1b2c3d4-0004-4000-8000-000000000004', 62000.00, 'visa', 'debit', '4200', 'A00043', 'REF-2025-000043', 'settled', 'card', 1, NOW() - INTERVAL '5 days 6 hours'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'b1b2c3d4-0006-4000-8000-000000000006', 8500.00, 'mastercard', 'debit', '5400', 'A00044', 'REF-2025-000044', 'rejected', 'ecommerce', 1, NOW() - INTERVAL '6 days'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'b1b2c3d4-0008-4000-8000-000000000008', 112000.00, 'visa', 'credit', '4600', 'A00045', 'REF-2025-000045', 'settled', 'card', 6, NOW() - INTERVAL '6 days 2 hours'),
  ('a1b2c3d4-0010-4000-8000-000000000010', NULL, 290000.00, 'mastercard', 'credit', '5600', 'A00046', 'REF-2025-000046', 'settled', 'ecommerce', 6, NOW() - INTERVAL '6 days 5 hours'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0003-4000-8000-000000000003', 4200.00, 'visa', 'debit', '4155', 'A00047', 'REF-2025-000047', 'settled', 'card', 1, NOW() - INTERVAL '6 days 8 hours'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'b1b2c3d4-0007-4000-8000-000000000007', 5600.00, 'visa', 'credit', '4333', 'A00048', 'REF-2025-000048', 'settled', 'contactless', 1, NOW() - INTERVAL '7 days'),
  ('a1b2c3d4-0008-4000-8000-000000000008', 'b1b2c3d4-0009-4000-8000-000000000009', 7200.00, 'mastercard', 'debit', '5050', 'A00049', 'REF-2025-000049', 'settled', 'ecommerce', 1, NOW() - INTERVAL '7 days 3 hours'),
  ('a1b2c3d4-0009-4000-8000-000000000009', 'b1b2c3d4-0010-4000-8000-000000000010', 31000.00, 'visa', 'credit', '4100', 'A00050', 'REF-2025-000050', 'settled', 'qr', 1, NOW() - INTERVAL '7 days 5 hours');

-- Clearing Batches
INSERT INTO clearing_batches (batch_number, card_brand, status, transaction_count, total_amount, file_name, generated_at, created_at) VALUES
  ('VISA-20250615-001', 'visa', 'confirmed', 1245, 125430000.00, 'CLR_VISA_20250615_001.dat', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 hours'),
  ('MC-20250615-001', 'mastercard', 'sent', 890, 89200000.00, 'CLR_MC_20250615_001.dat', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '7 hours'),
  ('VISA-20250614-001', 'visa', 'confirmed', 1180, 118500000.00, 'CLR_VISA_20250614_001.dat', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 8 hours'),
  ('MC-20250614-001', 'mastercard', 'confirmed', 820, 82100000.00, 'CLR_MC_20250614_001.dat', NOW() - INTERVAL '1 day 5 hours', NOW() - INTERVAL '1 day 7 hours'),
  ('VISA-20250613-001', 'visa', 'confirmed', 1320, 132800000.00, 'CLR_VISA_20250613_001.dat', NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '2 days 8 hours'),
  ('MC-20250613-001', 'mastercard', 'confirmed', 950, 95300000.00, 'CLR_MC_20250613_001.dat', NOW() - INTERVAL '2 days 5 hours', NOW() - INTERVAL '2 days 7 hours'),
  ('VISA-20250612-001', 'visa', 'confirmed', 1100, 110200000.00, 'CLR_VISA_20250612_001.dat', NOW() - INTERVAL '3 days 6 hours', NOW() - INTERVAL '3 days 8 hours'),
  ('MC-20250612-001', 'mastercard', 'failed', 780, 78400000.00, NULL, NULL, NOW() - INTERVAL '3 days 7 hours'),
  ('VISA-20250616-001', 'visa', 'pending', 0, 0, NULL, NULL, NOW() - INTERVAL '1 hour'),
  ('MC-20250616-001', 'mastercard', 'processing', 450, 45200000.00, NULL, NULL, NOW() - INTERVAL '30 minutes');

-- Settlements
INSERT INTO settlements (merchant_id, settlement_date, gross_amount, commission, iva, withholdings, net_amount, transaction_count, status, created_at) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', CURRENT_DATE, 2450000.00, 53900.00, 10241.00, 12250.00, 2373609.00, 45, 'paid', NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0002-4000-8000-000000000002', CURRENT_DATE, 1850000.00, 40700.00, 7733.00, 9250.00, 1792317.00, 32, 'paid', NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0003-4000-8000-000000000003', CURRENT_DATE, 3200000.00, 70400.00, 13376.00, 16000.00, 3100224.00, 58, 'processing', NOW() - INTERVAL '2 hours'),
  ('a1b2c3d4-0004-4000-8000-000000000004', CURRENT_DATE, 5600000.00, 123200.00, 23408.00, 28000.00, 5425392.00, 78, 'pending', NOW() - INTERVAL '1 hour'),
  ('a1b2c3d4-0005-4000-8000-000000000005', CURRENT_DATE, 980000.00, 21560.00, 4096.40, 4900.00, 949443.60, 22, 'paid', NOW() - INTERVAL '4 hours'),
  ('a1b2c3d4-0006-4000-8000-000000000006', CURRENT_DATE - 1, 650000.00, 14300.00, 2717.00, 3250.00, 629733.00, 18, 'paid', NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-0007-4000-8000-000000000007', CURRENT_DATE - 1, 4100000.00, 90200.00, 17138.00, 20500.00, 3972162.00, 65, 'paid', NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-0008-4000-8000-000000000008', CURRENT_DATE, 1200000.00, 26400.00, 5016.00, 6000.00, 1162584.00, 28, 'failed', NOW() - INTERVAL '3 hours'),
  ('a1b2c3d4-0009-4000-8000-000000000009', CURRENT_DATE - 1, 520000.00, 11440.00, 2173.60, 2600.00, 503786.40, 15, 'paid', NOW() - INTERVAL '1 day'),
  ('a1b2c3d4-0010-4000-8000-000000000010', CURRENT_DATE, 8900000.00, 195800.00, 37202.00, 44500.00, 8622498.00, 120, 'processing', NOW() - INTERVAL '2 hours');

-- Reconciliation Items
INSERT INTO reconciliation_items (reconciliation_date, source_klap, source_bank, source_brand, difference_amount, transaction_count_klap, transaction_count_bank, transaction_count_brand, card_brand, status, notes, created_at) VALUES
  (CURRENT_DATE, 125430000.00, 125430000.00, 125430000.00, 0, 1245, 1245, 1245, 'visa', 'reconciled', NULL, NOW() - INTERVAL '2 hours'),
  (CURRENT_DATE, 89200000.00, 89185000.00, 89200000.00, 15000.00, 890, 889, 890, 'mastercard', 'mismatch', '1 transacción no reflejada en banco', NOW() - INTERVAL '2 hours'),
  (CURRENT_DATE - 1, 118500000.00, 118500000.00, 118500000.00, 0, 1180, 1180, 1180, 'visa', 'reconciled', NULL, NOW() - INTERVAL '1 day'),
  (CURRENT_DATE - 1, 82100000.00, 82100000.00, 82100000.00, 0, 820, 820, 820, 'mastercard', 'reconciled', NULL, NOW() - INTERVAL '1 day'),
  (CURRENT_DATE - 2, 132800000.00, 132750000.00, 132800000.00, 50000.00, 1320, 1318, 1320, 'visa', 'mismatch', '2 transacciones pendientes de confirmación bancaria', NOW() - INTERVAL '2 days'),
  (CURRENT_DATE - 2, 95300000.00, 95300000.00, 95300000.00, 0, 950, 950, 950, 'mastercard', 'reconciled', NULL, NOW() - INTERVAL '2 days'),
  (CURRENT_DATE - 3, 110200000.00, 110200000.00, 110200000.00, 0, 1100, 1100, 1100, 'visa', 'reconciled', NULL, NOW() - INTERVAL '3 days'),
  (CURRENT_DATE - 3, 78400000.00, 78400000.00, 78250000.00, 150000.00, 780, 780, 778, 'mastercard', 'investigating', 'Diferencia en reporte de marca - investigando', NOW() - INTERVAL '3 days'),
  (CURRENT_DATE - 4, 105600000.00, 105600000.00, 105600000.00, 0, 1050, 1050, 1050, 'visa', 'reconciled', NULL, NOW() - INTERVAL '4 days'),
  (CURRENT_DATE - 4, 72300000.00, 72300000.00, 72300000.00, 0, 720, 720, 720, 'mastercard', 'reconciled', NULL, NOW() - INTERVAL '4 days');

-- Fee Rules
INSERT INTO fee_rules (name, card_brand, card_type, payment_method, percentage, fixed_fee, is_active) VALUES
  ('Visa Crédito Estándar', 'visa', 'credit', 'card', 0.0220, 0, TRUE),
  ('Visa Débito Estándar', 'visa', 'debit', 'card', 0.0150, 0, TRUE),
  ('Mastercard Crédito Estándar', 'mastercard', 'credit', 'card', 0.0235, 0, TRUE),
  ('Mastercard Débito Estándar', 'mastercard', 'debit', 'card', 0.0160, 0, TRUE),
  ('Visa Crédito E-commerce', 'visa', 'credit', 'ecommerce', 0.0280, 50.00, TRUE),
  ('Mastercard Crédito E-commerce', 'mastercard', 'credit', 'ecommerce', 0.0290, 50.00, TRUE),
  ('QR Visa', 'visa', 'debit', 'qr', 0.0080, 0, TRUE),
  ('QR Mastercard', 'mastercard', 'debit', 'qr', 0.0085, 0, TRUE),
  ('Amex Crédito', 'amex', 'credit', 'card', 0.0350, 100.00, TRUE),
  ('Redcompra Débito', 'redcompra', 'debit', 'card', 0.0120, 0, TRUE),
  ('Visa Prepago', 'visa', 'prepaid', 'card', 0.0180, 0, FALSE),
  ('Contactless Visa', 'visa', 'debit', 'contactless', 0.0140, 0, TRUE);

-- Disputes
INSERT INTO disputes (transaction_id, merchant_id, amount, reason, reason_code, card_brand, status, deadline, evidence_submitted, created_at) VALUES
  ((SELECT id FROM transactions WHERE reference_id = 'REF-2025-000005'), 'a1b2c3d4-0004-4000-8000-000000000004', 189990.00, 'Producto no recibido', '13.1', 'visa', 'open', CURRENT_DATE + 15, FALSE, NOW() - INTERVAL '3 days'),
  ((SELECT id FROM transactions WHERE reference_id = 'REF-2025-000011'), 'a1b2c3d4-0010-4000-8000-000000000010', 350000.00, 'Transacción no reconocida', '10.4', 'visa', 'under_review', CURRENT_DATE + 10, TRUE, NOW() - INTERVAL '5 days'),
  ((SELECT id FROM transactions WHERE reference_id = 'REF-2025-000018'), 'a1b2c3d4-0007-4000-8000-000000000007', 125000.00, 'Monto incorrecto', '13.3', 'mastercard', 'representment', CURRENT_DATE + 7, TRUE, NOW() - INTERVAL '8 days'),
  ((SELECT id FROM transactions WHERE reference_id = 'REF-2025-000004'), 'a1b2c3d4-0003-4000-8000-000000000003', 52000.00, 'Servicio no prestado', '13.1', 'mastercard', 'open', CURRENT_DATE + 20, FALSE, NOW() - INTERVAL '2 days'),
  ((SELECT id FROM transactions WHERE reference_id = 'REF-2025-000042'), 'a1b2c3d4-0004-4000-8000-000000000004', 450000.00, 'Fraude - Tarjeta robada', '10.1', 'visa', 'under_review', CURRENT_DATE + 5, TRUE, NOW() - INTERVAL '10 days'),
  ((SELECT id FROM transactions WHERE reference_id = 'REF-2025-000034'), 'a1b2c3d4-0004-4000-8000-000000000004', 245000.00, 'Cargo duplicado', '12.6', 'mastercard', 'won', NULL, TRUE, NOW() - INTERVAL '15 days'),
  ((SELECT id FROM transactions WHERE reference_id = 'REF-2025-000015'), 'a1b2c3d4-0004-4000-8000-000000000004', 299990.00, 'Devolución no procesada', '13.6', 'visa', 'lost', NULL, TRUE, NOW() - INTERVAL '20 days');

-- Operational Events
INSERT INTO operational_events (event_type, source, message, status, created_at) VALUES
  ('job', 'clearing-engine', 'Batch VISA-20250615-001 generado exitosamente', 'resolved', NOW() - INTERVAL '6 hours'),
  ('job', 'clearing-engine', 'Batch MC-20250615-001 enviado a Mastercard', 'resolved', NOW() - INTERVAL '5 hours'),
  ('job', 'settlement-processor', 'Liquidación diaria iniciada - 10 comercios', 'active', NOW() - INTERVAL '4 hours'),
  ('error', 'settlement-processor', 'Error al procesar liquidación merchant a1b2c3d4-0008: timeout banco', 'active', NOW() - INTERVAL '3 hours'),
  ('warning', 'reconciliation', 'Diferencia detectada en conciliación MC 15/06 - $15.000', 'active', NOW() - INTERVAL '2 hours'),
  ('info', 'auth-gateway', 'Gateway Visa respondiendo con latencia elevada (850ms avg)', 'active', NOW() - INTERVAL '1 hour'),
  ('critical', 'fraud-monitor', 'Patrón sospechoso detectado: 5 transacciones > $200k en 10 min', 'active', NOW() - INTERVAL '30 minutes'),
  ('job', 'reconciliation', 'Conciliación automática completada - 7/10 días OK', 'resolved', NOW() - INTERVAL '2 hours'),
  ('error', 'clearing-engine', 'Batch MC-20250612-001 falló - error de formato en registro 782', 'active', NOW() - INTERVAL '3 days'),
  ('info', 'system', 'Mantenimiento programado completado - Base de datos optimizada', 'resolved', NOW() - INTERVAL '12 hours'),
  ('warning', 'dispute-manager', '3 disputas próximas a vencer en los próximos 5 días', 'active', NOW() - INTERVAL '4 hours'),
  ('job', 'fee-calculator', 'Recalculo de comisiones completado para periodo 01-15 Junio', 'resolved', NOW() - INTERVAL '8 hours');

-- Alerts
INSERT INTO alerts (type, severity, title, description, is_read, is_resolved, created_at) VALUES
  ('transaction', 'high', 'Volumen inusual detectado', 'El volumen transaccional supera en 35% el promedio para este horario', FALSE, FALSE, NOW() - INTERVAL '30 minutes'),
  ('settlement', 'critical', 'Liquidación fallida', 'La liquidación de Uber Chile falló por timeout del banco receptor', FALSE, FALSE, NOW() - INTERVAL '3 hours'),
  ('reconciliation', 'medium', 'Descuadre Mastercard', 'Diferencia de $15.000 en conciliación del día - 1 transacción no reflejada', FALSE, FALSE, NOW() - INTERVAL '2 hours'),
  ('dispute', 'high', 'Disputa por monto elevado', 'Nueva disputa por $450.000 en Falabella - posible fraude con tarjeta robada', FALSE, FALSE, NOW() - INTERVAL '1 day'),
  ('system', 'low', 'Latencia elevada gateway', 'El gateway Visa presenta latencia promedio de 850ms (umbral: 500ms)', TRUE, FALSE, NOW() - INTERVAL '1 hour'),
  ('security', 'critical', 'Patrón de fraude detectado', '5 transacciones superiores a $200.000 en ventana de 10 minutos desde IP única', FALSE, FALSE, NOW() - INTERVAL '30 minutes'),
  ('transaction', 'medium', 'Tasa de rechazo elevada', 'Tasa de rechazo al 8.5% en última hora (umbral: 5%)', TRUE, FALSE, NOW() - INTERVAL '45 minutes'),
  ('settlement', 'low', 'Liquidación pendiente', '2 comercios con liquidación pendiente desde ayer', TRUE, TRUE, NOW() - INTERVAL '1 day'),
  ('reconciliation', 'high', 'Investigación abierta', 'Diferencia de $150.000 en batch MC-20250612 requiere investigación manual', FALSE, FALSE, NOW() - INTERVAL '3 days'),
  ('system', 'medium', 'Certificado SSL próximo a vencer', 'El certificado del endpoint de clearing vence en 15 días', TRUE, FALSE, NOW() - INTERVAL '2 days');
