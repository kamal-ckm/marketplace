const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const productsRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const customerAuthRoutes = require('./routes/auth-customer');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const adminRoutes = require('./routes/admin'); // Added admin routes
const taxonomyRoutes = require('./routes/taxonomy');
const homeCustomizationRoutes = require('./routes/homeCustomization').router;
const path = require('path');

app.use('/api/auth', authRoutes); // Admin routes
app.use('/api/auth/customer', customerAuthRoutes); // New customer routes
app.use('/api/cart', cartRoutes); // Cart routes
app.use('/api/checkout', checkoutRoutes); // Checkout routes
app.use('/api/admin', adminRoutes); // Added admin routes
app.use('/api', productsRoutes); // Mounts routes at /api/products, /api/admin/products
app.use('/api', taxonomyRoutes);
app.use('/api', homeCustomizationRoutes);
app.use('/api/upload', uploadRoutes);

// Static Uploads Folder
// Access: http://localhost:5000/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/', (req, res) => {
    res.send('Healthi Marketplace API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
