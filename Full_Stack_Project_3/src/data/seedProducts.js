/**
 * Realistic initial seed data for the Products API
 */
const seedProducts = [
  {
    id: 'prod_1001',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry-leading noise canceling with two processors and 8 microphones.',
    price: 399.99,
    category: 'electronics',
    inStock: true,
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-01-15T08:30:00.000Z'
  },
  {
    id: 'prod_1002',
    name: 'Apple MacBook Air M3',
    description: '13-inch laptop with 8-core CPU, 10-core GPU, and 16GB unified memory.',
    price: 1099.00,
    category: 'electronics',
    inStock: true,
    createdAt: '2026-01-20T10:15:00.000Z',
    updatedAt: '2026-01-20T10:15:00.000Z'
  },
  {
    id: 'prod_1003',
    name: 'Patagonia Nano Puff Jacket',
    description: 'Warm, windproof, water-resistant lightweight jacket made with 100% recycled polyester.',
    price: 229.00,
    category: 'clothing',
    inStock: true,
    createdAt: '2026-02-01T12:00:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z'
  },
  {
    id: 'prod_1004',
    name: 'Levi\'s 501 Original Fit Jeans',
    description: 'Classic straight leg denim with timeless iconic styling.',
    price: 79.50,
    category: 'clothing',
    inStock: false,
    createdAt: '2026-02-05T14:45:00.000Z',
    updatedAt: '2026-02-05T14:45:00.000Z'
  },
  {
    id: 'prod_1005',
    name: 'Breville Barista Touch Espresso Machine',
    description: 'Automated touch screen bean-to-cup espresso machine with thermoJet heating system.',
    price: 999.95,
    category: 'home-kitchen',
    inStock: true,
    createdAt: '2026-02-10T09:20:00.000Z',
    updatedAt: '2026-02-10T09:20:00.000Z'
  },
  {
    id: 'prod_1006',
    name: 'Designing Data-Intensive Applications',
    description: 'The definitive guide to architecture and principles of reliable distributed systems by Martin Kleppmann.',
    price: 45.00,
    category: 'books',
    inStock: true,
    createdAt: '2026-02-15T11:00:00.000Z',
    updatedAt: '2026-02-15T11:00:00.000Z'
  },
  {
    id: 'prod_1007',
    name: 'Garmin Forerunner 265 Running Smartwatch',
    description: 'GPS running watch with colorful AMOLED display and training metrics.',
    price: 449.99,
    category: 'sports',
    inStock: true,
    createdAt: '2026-02-18T16:30:00.000Z',
    updatedAt: '2026-02-18T16:30:00.000Z'
  },
  {
    id: 'prod_1008',
    name: 'La Roche-Posay Anthelios SPF 60 Sunscreen',
    description: 'Fast-absorbing oxybenzone-free sun protection with Cell-Ox Shield technology.',
    price: 26.99,
    category: 'beauty',
    inStock: false,
    createdAt: '2026-02-22T13:10:00.000Z',
    updatedAt: '2026-02-22T13:10:00.000Z'
  }
];

const seedReviews = [
  {
    id: 'rev_2001',
    productId: 'prod_1001',
    rating: 5,
    author: 'AudioPhile99',
    comment: 'Exceptional ANC quality and comfortable for long flights.',
    createdAt: '2026-02-01T15:00:00.000Z'
  },
  {
    id: 'rev_2002',
    productId: 'prod_1001',
    rating: 4,
    author: 'TechGeek',
    comment: 'Great soundstage, battery life matches advertised 30 hours.',
    createdAt: '2026-02-04T18:22:00.000Z'
  },
  {
    id: 'rev_2003',
    productId: 'prod_1006',
    rating: 5,
    author: 'BackendDev',
    comment: 'A mandatory read for anyone building distributed web services.',
    createdAt: '2026-02-19T09:12:00.000Z'
  }
];

module.exports = {
  seedProducts,
  seedReviews
};
