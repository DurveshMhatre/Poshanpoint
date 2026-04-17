require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const AddOn = require('../models/AddOn');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Category.deleteMany({});
        await MenuItem.deleteMany({});
        await AddOn.deleteMany({});

        // Create categories
        const categories = await Category.insertMany([
            { name: 'Smoothie Bowls', description: 'Nutritious & delicious smoothie bowls', image: '/images/smoothie-bowls.jpg', displayOrder: 1 },
            { name: 'Protein Shakes', description: 'High-protein shakes for fitness', image: '/images/protein-shakes.jpg', displayOrder: 2 },
            { name: 'Fresh Juices', description: 'Cold-pressed fresh juices', image: '/images/fresh-juices.jpg', displayOrder: 3 },
            { name: 'Healthy Snacks', description: 'Guilt-free snacking options', image: '/images/healthy-snacks.jpg', displayOrder: 4 },
            { name: 'Energy Drinks', description: 'Natural energy boosters', image: '/images/energy-drinks.jpg', displayOrder: 5 },
        ]);

        console.log(`✅ Created ${categories.length} categories`);

        // Create menu items
        const items = await MenuItem.insertMany([
            // Smoothie Bowls
            {
                name: 'Açaí Power Bowl',
                description: 'Blended açaí with banana, topped with granola, fresh fruits & honey',
                image: '/images/acai-bowl.jpg',
                basePrice: 249,
                category: categories[0]._id,
                bases: [
                    { name: 'Açaí Base', price: 0 },
                    { name: 'Pitaya Base', price: 20 },
                    { name: 'Mango Base', price: 0 },
                ],
                liquids: [
                    { name: 'Almond Milk', price: 0 },
                    { name: 'Coconut Milk', price: 10 },
                    { name: 'Oat Milk', price: 15 },
                ],
                displayOrder: 1
            },
            {
                name: 'Green Goddess Bowl',
                description: 'Spinach, banana & spirulina blend with chia seeds & berries',
                image: '/images/green-bowl.jpg',
                basePrice: 229,
                category: categories[0]._id,
                bases: [
                    { name: 'Spinach Base', price: 0 },
                    { name: 'Kale Base', price: 10 },
                ],
                liquids: [
                    { name: 'Almond Milk', price: 0 },
                    { name: 'Coconut Water', price: 0 },
                ],
                displayOrder: 2
            },
            {
                name: 'Tropical Paradise Bowl',
                description: 'Mango, pineapple & passion fruit with coconut flakes',
                image: '/images/tropical-bowl.jpg',
                basePrice: 239,
                category: categories[0]._id,
                bases: [
                    { name: 'Mango Base', price: 0 },
                    { name: 'Pineapple Base', price: 0 },
                ],
                liquids: [
                    { name: 'Coconut Milk', price: 0 },
                    { name: 'Orange Juice', price: 5 },
                ],
                displayOrder: 3
            },
            // Protein Shakes
            {
                name: 'Peanut Butter Blast',
                description: 'Whey protein, peanut butter, banana & chocolate',
                image: '/images/pb-shake.jpg',
                basePrice: 199,
                category: categories[1]._id,
                bases: [
                    { name: 'Whey Protein', price: 0 },
                    { name: 'Plant Protein', price: 20 },
                ],
                liquids: [
                    { name: 'Whole Milk', price: 0 },
                    { name: 'Almond Milk', price: 10 },
                    { name: 'Oat Milk', price: 15 },
                ],
                displayOrder: 1
            },
            {
                name: 'Berry Protein Punch',
                description: 'Mixed berries with vanilla whey & Greek yogurt',
                image: '/images/berry-shake.jpg',
                basePrice: 189,
                category: categories[1]._id,
                bases: [
                    { name: 'Whey Protein', price: 0 },
                    { name: 'Casein Protein', price: 10 },
                ],
                liquids: [
                    { name: 'Whole Milk', price: 0 },
                    { name: 'Skim Milk', price: 0 },
                ],
                displayOrder: 2
            },
            {
                name: 'Choco Muscle Shake',
                description: 'Double chocolate protein with banana & creatine option',
                image: '/images/choco-shake.jpg',
                basePrice: 209,
                category: categories[1]._id,
                bases: [
                    { name: 'Whey Protein', price: 0 },
                    { name: 'Mass Gainer', price: 30 },
                ],
                liquids: [
                    { name: 'Whole Milk', price: 0 },
                    { name: 'Almond Milk', price: 10 },
                ],
                displayOrder: 3
            },
            // Fresh Juices
            {
                name: 'Detox Green Juice',
                description: 'Cucumber, celery, apple, ginger & lemon',
                image: '/images/green-juice.jpg',
                basePrice: 149,
                category: categories[2]._id,
                bases: [],
                liquids: [],
                displayOrder: 1
            },
            {
                name: 'Immunity Booster',
                description: 'Orange, carrot, turmeric & black pepper',
                image: '/images/immunity-juice.jpg',
                basePrice: 139,
                category: categories[2]._id,
                bases: [],
                liquids: [],
                displayOrder: 2
            },
            {
                name: 'Watermelon Mint Cooler',
                description: 'Fresh watermelon with mint & a splash of lime',
                image: '/images/watermelon-juice.jpg',
                basePrice: 129,
                category: categories[2]._id,
                bases: [],
                liquids: [],
                displayOrder: 3
            },
            // Healthy Snacks
            {
                name: 'Protein Energy Balls',
                description: 'Oats, dates, peanut butter & dark chocolate chips (4 pcs)',
                image: '/images/energy-balls.jpg',
                basePrice: 149,
                category: categories[3]._id,
                bases: [],
                liquids: [],
                displayOrder: 1
            },
            {
                name: 'Avocado Toast',
                description: 'Multigrain toast with smashed avocado, seeds & cherry tomatoes',
                image: '/images/avocado-toast.jpg',
                basePrice: 179,
                category: categories[3]._id,
                bases: [
                    { name: 'Multigrain Bread', price: 0 },
                    { name: 'Sourdough', price: 20 },
                ],
                liquids: [],
                displayOrder: 2
            },
            {
                name: 'Greek Yogurt Parfait',
                description: 'Layered Greek yogurt with granola, berries & honey',
                image: '/images/yogurt-parfait.jpg',
                basePrice: 169,
                category: categories[3]._id,
                bases: [],
                liquids: [],
                displayOrder: 3
            },
            // Energy Drinks
            {
                name: 'Matcha Latte',
                description: 'Ceremonial grade matcha with your choice of milk',
                image: '/images/matcha-latte.jpg',
                basePrice: 179,
                category: categories[4]._id,
                bases: [],
                liquids: [
                    { name: 'Oat Milk', price: 0 },
                    { name: 'Almond Milk', price: 0 },
                    { name: 'Coconut Milk', price: 5 },
                ],
                displayOrder: 1
            },
            {
                name: 'Cold Brew Coffee',
                description: '18-hour slow-steeped cold brew with vanilla option',
                image: '/images/cold-brew.jpg',
                basePrice: 159,
                category: categories[4]._id,
                bases: [],
                liquids: [
                    { name: 'Black', price: 0 },
                    { name: 'Oat Milk', price: 15 },
                    { name: 'Almond Milk', price: 10 },
                ],
                displayOrder: 2
            },
        ]);

        console.log(`✅ Created ${items.length} menu items`);

        // Create add-ons
        const addons = await AddOn.insertMany([
            { name: 'Whey Protein Scoop', price: 50, category: 'protein' },
            { name: 'Creatine (5g)', price: 30, category: 'supplement' },
            { name: 'Chia Seeds', price: 20, category: 'topping' },
            { name: 'Flax Seeds', price: 20, category: 'topping' },
            { name: 'Peanut Butter (1 tbsp)', price: 30, category: 'spread' },
            { name: 'Almond Butter (1 tbsp)', price: 40, category: 'spread' },
            { name: 'Honey', price: 15, category: 'sweetener' },
            { name: 'Maple Syrup', price: 20, category: 'sweetener' },
            { name: 'Dark Chocolate Chips', price: 25, category: 'topping' },
            { name: 'Granola', price: 25, category: 'topping' },
            { name: 'Fresh Berries', price: 35, category: 'topping' },
            { name: 'Banana Slices', price: 15, category: 'topping' },
            { name: 'Coconut Flakes', price: 15, category: 'topping' },
            { name: 'Spirulina Powder', price: 25, category: 'supplement' },
            { name: 'Collagen Peptides', price: 45, category: 'supplement' },
        ]);

        console.log(`✅ Created ${addons.length} add-ons`);
        console.log('\n🎉 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedData();
