const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { hashPassword } = require('../utils/password');

let mongoServer;

async function connectDB() {
    try {
        const useMemory = shouldUseInMemoryDb();
        let uri = process.env.MONGO_URI;

        if (useMemory) {
            mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
            console.log('MongoDB In-Memory Server started');
        }

        if (!uri) {
            throw new Error('MONGO_URI is required when in-memory DB is disabled');
        }

        await mongoose.connect(uri);
        console.log(`MongoDB connected (${useMemory ? 'in-memory' : 'external'})`);

        if (shouldSeedData(useMemory)) {
            await seedInitialData();
        }
        await seedStaffAccounts();

        return mongoose.connection;
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
}

function shouldUseInMemoryDb() {
    if (process.env.USE_IN_MEMORY_DB === 'true') return true;
    if (process.env.USE_IN_MEMORY_DB === 'false') return false;
    return process.env.NODE_ENV !== 'production' && !process.env.MONGO_URI;
}

function shouldSeedData(useMemory) {
    if (process.env.SEED_ON_STARTUP === 'true') return true;
    if (process.env.SEED_ON_STARTUP === 'false') return false;
    return useMemory;
}

async function seedInitialData() {
    const Category = require('../models/Category');
    const MenuItem = require('../models/MenuItem');
    const AddOn = require('../models/AddOn');

    const count = await Category.countDocuments();
    if (count > 0) return;

    console.log('Seeding database with sample data...');

    const categories = await Category.insertMany([
        { name: 'Pre-Workout Smoothies', description: 'Energy-boosting blends for before your workout', image: '/images/pre-workout.jpg', displayOrder: 1 },
        { name: 'Post-Workout Smoothies', description: 'Recovery blends packed with protein', image: '/images/post-workout.jpg', displayOrder: 2 },
        { name: 'Fruit Bowls', description: 'Fresh fruit bowls with superfoods', image: '/images/fruit-bowls.jpg', displayOrder: 3 },
        { name: 'Add-ons', description: 'Boost any drink with extras', image: '/images/addons.jpg', displayOrder: 4 },
    ]);

    await MenuItem.insertMany([
        {
            name: 'Banana Power Blast',
            description: 'Banana, oats, peanut butter, honey - pure energy fuel.',
            image: 'https://images.unsplash.com/photo-1593094609558-a381177ebf21?w=600&h=400&fit=crop&q=80',
            basePrice: 149, category: categories[0]._id, badge: 'Popular',
            bases: [{ name: 'Milk', price: 30 }, { name: 'Yogurt', price: 35 }, { name: 'Coconut Water', price: 40 }, { name: 'Almond Milk', price: 50 }, { name: 'Water', price: 0 }],
            liquids: [],
            displayOrder: 1
        },
        {
            name: 'Green Machine',
            description: 'Spinach, apple, ginger, lemon - clean pre-workout energy.',
            image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600&h=400&fit=crop&q=80',
            basePrice: 179, category: categories[0]._id,
            bases: [{ name: 'Milk', price: 30 }, { name: 'Yogurt', price: 35 }, { name: 'Coconut Water', price: 40 }, { name: 'Almond Milk', price: 50 }, { name: 'Water', price: 0 }],
            liquids: [],
            displayOrder: 2
        },
        {
            name: 'Mango Burst',
            description: 'Fresh mango, yogurt, chia seeds - tropical energy boost.',
            image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&h=400&fit=crop&q=80',
            basePrice: 159, category: categories[0]._id,
            bases: [{ name: 'Milk', price: 30 }, { name: 'Yogurt', price: 35 }, { name: 'Coconut Water', price: 40 }, { name: 'Almond Milk', price: 50 }, { name: 'Water', price: 0 }],
            liquids: [],
            displayOrder: 3
        },
        {
            name: 'Berry Recovery',
            description: 'Mixed berries, banana, protein - ideal post-training fuel.',
            image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=600&h=400&fit=crop&q=80',
            basePrice: 189, category: categories[1]._id, badge: 'Best Seller',
            bases: [{ name: 'Milk', price: 30 }, { name: 'Yogurt', price: 35 }, { name: 'Coconut Water', price: 40 }, { name: 'Almond Milk', price: 50 }, { name: 'Water', price: 0 }],
            liquids: [],
            displayOrder: 1
        },
        {
            name: 'Peanut Butter Shake',
            description: 'Peanut butter, banana, milk, oats - muscle recovery blend.',
            image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&h=400&fit=crop&q=80',
            basePrice: 199, category: categories[1]._id,
            bases: [{ name: 'Milk', price: 30 }, { name: 'Yogurt', price: 35 }, { name: 'Coconut Water', price: 40 }, { name: 'Almond Milk', price: 50 }, { name: 'Water', price: 0 }],
            liquids: [],
            displayOrder: 2
        },
        {
            name: 'Choco Protein Shake',
            description: 'Cocoa, banana, milk, dates - rich recovery drink.',
            image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop&q=80',
            basePrice: 219, category: categories[1]._id, badge: 'New',
            bases: [{ name: 'Milk', price: 30 }, { name: 'Yogurt', price: 35 }, { name: 'Coconut Water', price: 40 }, { name: 'Almond Milk', price: 50 }, { name: 'Water', price: 0 }],
            liquids: [],
            displayOrder: 3
        },
        {
            name: 'Seasonal Fruit Bowl',
            description: 'Fresh seasonal fruits with honey drizzle and seeds.',
            image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop&q=80',
            basePrice: 129, category: categories[2]._id,
            bases: [], liquids: [],
            displayOrder: 1
        },
        {
            name: 'Acai Power Bowl',
            description: 'Acai base topped with banana, granola, and berries.',
            image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop&q=80',
            basePrice: 249, category: categories[2]._id, badge: 'Premium',
            bases: [], liquids: [],
            displayOrder: 2
        },
        {
            name: 'Tropical Paradise',
            description: 'Mango, papaya, pineapple with coconut and chia.',
            image: 'https://images.unsplash.com/photo-1511690743698-d9d18f7e20f1?w=600&h=400&fit=crop&q=80',
            basePrice: 179, category: categories[2]._id,
            bases: [], liquids: [],
            displayOrder: 3
        },
        {
            name: 'Chia Seeds Pack',
            description: 'Omega-3 rich superfood boost for any smoothie.',
            image: 'https://images.unsplash.com/photo-1616429533355-6b5d95d820d2?w=600&h=400&fit=crop&q=80',
            basePrice: 40, category: categories[3]._id,
            bases: [], liquids: [],
            displayOrder: 1
        },
        {
            name: 'Flax Seeds Pack',
            description: 'High-fiber, heart-healthy seeds.',
            image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&h=400&fit=crop&q=80',
            basePrice: 35, category: categories[3]._id,
            bases: [], liquids: [],
            displayOrder: 2
        },
        {
            name: 'Oats Pack',
            description: 'Whole grain oats for extra energy and fiber.',
            image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&h=400&fit=crop&q=80',
            basePrice: 30, category: categories[3]._id,
            bases: [], liquids: [],
            displayOrder: 3
        },
        {
            name: 'Mixed Nuts',
            description: 'Premium quality almonds, cashews, and walnuts.',
            image: 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=600&h=400&fit=crop&q=80',
            basePrice: 60, category: categories[3]._id,
            bases: [], liquids: [],
            displayOrder: 4
        },
        {
            name: 'Honey Bottle',
            description: 'Natural organic honey - perfect sweetener.',
            image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=400&fit=crop&q=80',
            basePrice: 45, category: categories[3]._id,
            bases: [], liquids: [],
            displayOrder: 5
        },
        {
            name: 'Peanut Butter Jar',
            description: 'Creamy protein-packed peanut butter.',
            image: 'https://images.unsplash.com/photo-1612187209234-192a82313775?w=600&h=400&fit=crop&q=80',
            basePrice: 55, category: categories[3]._id,
            bases: [], liquids: [],
            displayOrder: 6
        },
    ]);

    await AddOn.insertMany([
        { name: 'Chia Seeds', price: 20, category: 'booster' },
        { name: 'Flax Seeds', price: 15, category: 'booster' },
        { name: 'Oats', price: 10, category: 'booster' },
        { name: 'Protein Powder', price: 40, category: 'booster' },
        { name: 'Peanut Butter', price: 25, category: 'booster' },
        { name: 'Spinach', price: 15, category: 'booster' },
        { name: 'Honey', price: 15, category: 'sweetener' },
        { name: 'Dates', price: 20, category: 'sweetener' },
        { name: 'Jaggery', price: 10, category: 'sweetener' },
        { name: 'Almonds', price: 30, category: 'topping' },
        { name: 'Granola', price: 25, category: 'topping' },
        { name: 'Coconut Flakes', price: 15, category: 'topping' },
        { name: 'Mixed Nuts', price: 35, category: 'topping' },
        { name: 'Banana', price: 20, category: 'fruit' },
        { name: 'Mango', price: 30, category: 'fruit' },
        { name: 'Strawberry', price: 40, category: 'fruit' },
        { name: 'Blueberry', price: 50, category: 'fruit' },
        { name: 'Apple', price: 25, category: 'fruit' },
        { name: 'Papaya', price: 20, category: 'fruit' },
        { name: 'Pineapple', price: 30, category: 'fruit' },
        { name: 'Kiwi', price: 45, category: 'fruit' },
    ]);

    console.log('Seed complete: 4 categories, 15 items, 21 add-ons');
}

async function seedStaffAccounts() {
    const StaffAccount = require('../models/StaffAccount');

    const isProduction = process.env.NODE_ENV === 'production';
    const defaultAdminUsername = process.env.ADMIN_USERNAME || (isProduction ? '' : 'admin');
    const defaultAdminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'Admin@12345');
    const defaultStaffUsername = process.env.STAFF_USERNAME || (isProduction ? '' : 'staff');
    const defaultStaffPassword = process.env.STAFF_PASSWORD || (isProduction ? '' : 'Staff@12345');

    const bootstrapAccounts = [
        {
            username: String(defaultAdminUsername || '').trim().toLowerCase(),
            password: defaultAdminPassword,
            name: String(process.env.ADMIN_NAME || 'Admin').trim().slice(0, 80) || 'Admin',
            role: 'admin',
        },
        {
            username: String(defaultStaffUsername || '').trim().toLowerCase(),
            password: defaultStaffPassword,
            name: String(process.env.STAFF_NAME || 'Staff').trim().slice(0, 80) || 'Staff',
            role: 'staff',
        },
    ];

    for (const account of bootstrapAccounts) {
        if (!account.username || !account.password) continue;
        if (!/^[a-z0-9._-]{3,40}$/.test(account.username)) continue;

        const existing = await StaffAccount.findOne({ username: account.username }).select('_id');
        if (existing) continue;

        const { salt, hash } = hashPassword(account.password);
        await StaffAccount.create({
            username: account.username,
            name: account.name,
            role: account.role,
            passwordSalt: salt,
            passwordHash: hash,
            isActive: true,
        });

        console.log(`Seeded ${account.role} account: ${account.username}`);
    }
}

module.exports = connectDB;
