-- Migration 003: Seed initial sample data
INSERT INTO products (id, name, description, price, category, in_stock, created_at, updated_at) VALUES
('prod_1001', 'Sony WH-1000XM5 Wireless Headphones', 'Industry-leading noise canceling with two processors and 8 microphones.', 399.99, 'electronics', true, '2026-01-15T08:30:00.000Z', '2026-01-15T08:30:00.000Z'),
('prod_1002', 'Apple MacBook Air M3', '13-inch laptop with 8-core CPU, 10-core GPU, and 16GB unified memory.', 1099.00, 'electronics', true, '2026-01-20T10:15:00.000Z', '2026-01-20T10:15:00.000Z'),
('prod_1003', 'Patagonia Nano Puff Jacket', 'Warm, windproof, water-resistant lightweight jacket made with 100% recycled polyester.', 229.00, 'clothing', true, '2026-02-01T12:00:00.000Z', '2026-02-01T12:00:00.000Z'),
('prod_1004', 'Levi''s 501 Original Fit Jeans', 'Classic straight leg denim with timeless iconic styling.', 79.50, 'clothing', false, '2026-02-05T14:45:00.000Z', '2026-02-05T14:45:00.000Z'),
('prod_1005', 'Breville Barista Touch Espresso Machine', 'Automated touch screen bean-to-cup espresso machine with thermoJet heating system.', 999.95, 'home-kitchen', true, '2026-02-10T09:20:00.000Z', '2026-02-10T09:20:00.000Z'),
('prod_1006', 'Designing Data-Intensive Applications', 'The definitive guide to architecture and principles of reliable distributed systems by Martin Kleppmann.', 45.00, 'books', true, '2026-02-15T11:00:00.000Z', '2026-02-15T11:00:00.000Z'),
('prod_1007', 'Garmin Forerunner 265 Running Smartwatch', 'GPS running watch with colorful AMOLED display and training metrics.', 449.99, 'sports', true, '2026-02-18T16:30:00.000Z', '2026-02-18T16:30:00.000Z'),
('prod_1008', 'La Roche-Posay Anthelios SPF 60 Sunscreen', 'Fast-absorbing oxybenzone-free sun protection with Cell-Ox Shield technology.', 26.99, 'beauty', false, '2026-02-22T13:10:00.000Z', '2026-02-22T13:10:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (id, product_id, rating, comment, author, created_at) VALUES
('rev_2001', 'prod_1001', 5, 'Exceptional ANC quality and comfortable for long flights.', 'AudioPhile99', '2026-02-01T15:00:00.000Z'),
('rev_2002', 'prod_1001', 4, 'Great soundstage, battery life matches advertised 30 hours.', 'TechGeek', '2026-02-04T18:22:00.000Z'),
('rev_2003', 'prod_1006', 5, 'A mandatory read for anyone building distributed web services.', 'BackendDev', '2026-02-19T09:12:00.000Z')
ON CONFLICT (id) DO NOTHING;
