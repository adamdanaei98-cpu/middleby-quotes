// prisma/seed.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── USERS ────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'jsmith@middleby.com' },
      update: {},
      create: {
        name: 'John Smith',
        email: 'jsmith@middleby.com',
        password: hash('sales123'),
        role: 'salesperson',
        companyAccess: ['rvp', 'thurne', 'pacpro'],
      },
    }),
    prisma.user.upsert({
      where: { email: 'sjohnson@middleby.com' },
      update: {},
      create: {
        name: 'Sarah Johnson',
        email: 'sjohnson@middleby.com',
        password: hash('review123'),
        role: 'reviewer',
        companyAccess: ['rvp', 'thurne', 'pacpro'],
      },
    }),
    prisma.user.upsert({
      where: { email: 'mchen@middleby.com' },
      update: {},
      create: {
        name: 'Mike Chen',
        email: 'mchen@middleby.com',
        password: hash('manager123'),
        role: 'manager',
        companyAccess: ['rvp', 'thurne', 'pacpro'],
      },
    }),
    prisma.user.upsert({
      where: { email: 'lrodriguez@middleby.com' },
      update: {},
      create: {
        name: 'Lisa Rodriguez',
        email: 'lrodriguez@middleby.com',
        password: hash('super123'),
        role: 'supervisor',
        companyAccess: ['rvp', 'thurne', 'pacpro'],
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // ─── CUSTOMERS ────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Smithfield Fresh Meats',
        plant: 'Sioux Falls Plant',
        address: '1400 N Weber Ave, Sioux Falls, SD 57103',
        contact: 'Robert Wilson',
        email: 'rwilson@smithfield.com',
        phone: '605-330-2000',
        rep: 'John Smith',
        industry: 'Meat Processing',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Tyson Foods',
        plant: 'Springdale Facility',
        address: '2200 W Don Tyson Pkwy, Springdale, AR 72762',
        contact: 'Amanda Torres',
        email: 'atorres@tysonfoods.com',
        phone: '479-290-4000',
        rep: 'John Smith',
        industry: 'Meat & Poultry',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Hormel Foods',
        plant: 'Austin Plant',
        address: '1 Hormel Pl, Austin, MN 55912',
        contact: 'David Park',
        email: 'dpark@hormel.com',
        phone: '507-437-5611',
        rep: 'Sarah Johnson',
        industry: 'Prepared Foods',
      },
    }),
  ]);

  console.log(`Created ${customers.length} customers`);

  // ─── COMPANIES ────────────────────────────────────────────
  const rvp = await prisma.company.upsert({
    where: { key: 'rvp' },
    update: {},
    create: {
      key: 'rvp',
      name: 'RapidVisionPak',
      color: '#0074BB',
      description: 'Thermoform Vacuum Packaging',
      execSummary: 'RapidVisionPak designs and manufactures horizontal form-fill-seal vacuum packaging machines for the food processing industry.',
      rates: {
        laborRate: 36.8,
        pohr: 1.5,
        markup: 10,
        agentFee: 10,
        commission: 1.5,
        discount: 0,
        freight: 8000,
        install: 22000,
      },
      sortOrder: 1,
    },
  });

  const thurne = await prisma.company.upsert({
    where: { key: 'thurne' },
    update: {},
    create: {
      key: 'thurne',
      name: 'Thurne',
      color: '#E12C3E',
      description: 'High-Speed Slicing Solutions',
      rates: {
        laborRate: 31.4,
        pohr: 2.0,
        markup: 8,
        agentFee: 5,
        commission: 1.5,
        discount: 0,
        freight: 4000,
        install: 14000,
      },
      sortOrder: 2,
    },
  });

  const pacpro = await prisma.company.upsert({
    where: { key: 'pacpro' },
    update: {},
    create: {
      key: 'pacpro',
      name: 'PacProInc',
      color: '#C47A2C',
      description: 'Card Dispensing Systems',
      rates: {
        laborRate: 22.9,
        pohr: 2.0,
        markup: 12,
        agentFee: 8,
        commission: 1.5,
        discount: 0,
        freight: 5000,
        install: 13000,
      },
      sortOrder: 3,
    },
  });

  console.log('Created companies: RVP, Thurne, PacPro');

  // ─── CATALOG SECTIONS & ITEMS (RVP sample) ───────────────
  const chassis = await prisma.catalogSection.create({
    data: {
      companyId: rvp.id,
      name: 'Chassis',
      sortOrder: 1,
      items: {
        create: [
          {
            name: 'VisionPak VP125',
            fixedPrice: 285000,
            materialCost: 95000,
            laborHours: 420,
            description: '125mm draw thermoformer',
            hasQuantity: false,
            sortOrder: 1,
            options: [
              { name: 'VP125', fixedPrice: 285000, variablePrice: 0 },
              { name: 'VP190', fixedPrice: 345000, variablePrice: 0 },
              { name: 'VP400', fixedPrice: 423900, variablePrice: 0 },
              { name: 'VP480', fixedPrice: 498000, variablePrice: 0 },
            ],
          },
        ],
      },
    },
  });

  const packaging = await prisma.catalogSection.create({
    data: {
      companyId: rvp.id,
      name: 'Package Specific',
      sortOrder: 2,
      items: {
        create: [
          {
            name: 'Die Set',
            fixedPrice: 18500,
            materialCost: 6200,
            laborHours: 45,
            description: 'Custom die set for package format',
            hasQuantity: true,
            quantityLabel: 'sets',
            sortOrder: 1,
          },
          {
            name: 'Film Lifter',
            fixedPrice: 12000,
            materialCost: 3800,
            laborHours: 28,
            description: 'Automated film lifting system',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  console.log('Created catalog sections with items');
  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
