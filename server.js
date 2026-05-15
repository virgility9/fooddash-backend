const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATA PERSISTENCE ====================
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath, defaultValue) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
}

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

let users = readJSON(USERS_FILE, []);
let menuItems = readJSON(MENU_FILE, []);
let orders = readJSON(ORDERS_FILE, []);
let carts = readJSON(CARTS_FILE, {});

if (users.length === 0) {
    users = [
        { id: 1, username: 'admin', email: 'admin@fooddash.com', password: 'admin123', full_name: 'Admin User', phone: '09123456789', address: 'Admin Office', role: 'admin', created_at: new Date().toISOString() },
        { id: 2, username: 'john', email: 'john@gmail.com', password: 'john123', full_name: 'John Doe', phone: '09123456788', address: 'Makati City', role: 'customer', created_at: new Date().toISOString() },
    ];
    writeJSON(USERS_FILE, users);
}

if (menuItems.length === 0) {
    menuItems = [
        { id: 1, name: 'Margherita Pizza', description: 'Fresh tomatoes, fresh mozzarella, fresh basil', price: 299.00, category: 'Pizza', image_asset: 'assets/images/pizza_margherita.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 2, name: 'Pepperoni Pizza', description: 'Pepperoni, mozzarella, tomato sauce', price: 399.00, category: 'Pizza', image_asset: 'assets/images/pizza_pepperoni.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 3, name: 'Chicken Burger', description: 'Grilled chicken breast with lettuce, tomato, mayo', price: 189.00, category: 'Burgers', image_asset: 'assets/images/chicken_burger.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 4, name: 'Beef Burger', description: '100% beef patty with cheese, lettuce, pickles', price: 229.00, category: 'Burgers', image_asset: 'assets/images/beef_burger.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 5, name: 'Chicken Strips', description: 'Crispy chicken strips', price: 149.00, category: 'Sides', image_asset: 'assets/images/chicken_strips.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 6, name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan cheese', price: 169.00, category: 'Salads', image_asset: 'assets/images/caesar_salad.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 7, name: 'Pasta Carbonara', description: 'Creamy pasta with bacon, egg, parmesan cheese', price: 269.00, category: 'Pasta', image_asset: 'assets/images/pasta_carbonara.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 8, name: 'French Fries', description: 'Crispy golden french fries', price: 99.00, category: 'Sides', image_asset: 'assets/images/french_fries.jpg', is_available: true, created_at: new Date().toISOString() },
        { id: 9, name: 'Coca Cola', description: 'Refreshing Coca Cola', price: 59.00, category: 'Beverages', image_asset: 'assets/images/coke.jpg', is_available: true, created_at: new Date().toISOString() }
    ];
    writeJSON(MENU_FILE, menuItems);
}

if (orders.length === 0) {
    orders = [];
    writeJSON(ORDERS_FILE, orders);
}

if (Object.keys(carts).length === 0) {
    carts = {};
    writeJSON(CARTS_FILE, carts);
}

function saveUsers() { writeJSON(USERS_FILE, users); }
function saveMenu() { writeJSON(MENU_FILE, menuItems); }
function saveOrders() { writeJSON(ORDERS_FILE, orders); }
function saveCarts() { writeJSON(CARTS_FILE, carts); }

function getUserCart(userId) {
    if (!carts[userId]) carts[userId] = [];
    return carts[userId];
}

function getNextId(items) {
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.id)) + 1;
}

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const userId = parseInt(token.split('_')[1]);
    if (isNaN(userId)) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    req.userId = userId;
    req.user = user;
    next();
};

const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const userId = parseInt(token.split('_')[1]);
    if (isNaN(userId)) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const user = users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    req.userId = userId;
    req.user = user;
    next();
};

// ==================== PUBLIC ROUTES ====================
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Backend is running!', timestamp: new Date().toISOString() });
});

app.post('/api/register', (req, res) => {
    const { username, email, password, full_name, phone, address } = req.body;
    
    if (!username || !email || !password || !full_name) {
        return res.status(400).json({ error: 'Username, email, password, and full name are required' });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    
    const existingUsername = users.find(u => u.username === username);
    if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
    }
    
    const newUser = {
        id: getNextId(users),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        full_name: full_name.trim(),
        phone: phone || '',
        address: address || '',
        role: 'customer',
        created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers();
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ success: true, message: 'Registration successful', user: userWithoutPassword });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = users.find(u => u.email === email.toLowerCase() && u.password === password);
    if (user) {
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            token: `token_${user.id}_${Date.now()}`,
            user: userWithoutPassword
        });
    } else {
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

// Customer menu - only show available items
app.get('/api/menu', (req, res) => {
    const availableItems = menuItems.filter(item => item.is_available === true);
    res.json(availableItems);
});

// Admin menu - show ALL items
app.get('/api/admin/menu', verifyAdmin, (req, res) => {
    res.json(menuItems);
});

// ==================== CART ROUTES ====================
app.get('/api/cart', verifyToken, (req, res) => {
    const userCart = getUserCart(req.userId);
    const cartWithDetails = userCart.map(cartItem => {
        const menuItem = menuItems.find(m => m.id === cartItem.menu_item_id);
        return {
            id: cartItem.id,
            menu_item_id: cartItem.menu_item_id,
            quantity: cartItem.quantity,
            name: menuItem?.name || 'Unknown',
            menu_price: menuItem?.price || 0,
            image_asset: menuItem?.image_asset || null
        };
    });
    res.json(cartWithDetails);
});

app.post('/api/cart', verifyToken, (req, res) => {
    const { menu_item_id, quantity } = req.body;
    
    if (!menu_item_id || !quantity || quantity < 1) {
        return res.status(400).json({ error: 'Valid menu_item_id and quantity are required' });
    }
    
    const menuItem = menuItems.find(m => m.id === menu_item_id);
    if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
    }
    
    if (!menuItem.is_available) {
        return res.status(400).json({ error: 'Item is not available' });
    }
    
    let userCart = getUserCart(req.userId);
    const existingItem = userCart.find(item => item.menu_item_id === menu_item_id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const maxId = userCart.length > 0 ? Math.max(...userCart.map(i => i.id)) : 0;
        userCart.push({ id: maxId + 1, menu_item_id, quantity });
    }
    
    saveCarts();
    res.json({ success: true, message: 'Added to cart' });
});

app.put('/api/cart/:cartId', verifyToken, (req, res) => {
    const { quantity } = req.body;
    const cartId = parseInt(req.params.cartId);
    
    if (isNaN(cartId)) {
        return res.status(400).json({ error: 'Invalid cart ID' });
    }
    
    if (quantity === undefined || quantity < 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
    }
    
    let userCart = getUserCart(req.userId);
    const itemIndex = userCart.findIndex(item => item.id === cartId);
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Cart item not found' });
    }
    
    if (quantity === 0) {
        userCart.splice(itemIndex, 1);
    } else {
        userCart[itemIndex].quantity = quantity;
    }
    
    saveCarts();
    res.json({ success: true, message: 'Cart updated' });
});

app.delete('/api/cart/:cartId', verifyToken, (req, res) => {
    const cartId = parseInt(req.params.cartId);
    
    if (isNaN(cartId)) {
        return res.status(400).json({ error: 'Invalid cart ID' });
    }
    
    let userCart = getUserCart(req.userId);
    const itemIndex = userCart.findIndex(item => item.id === cartId);
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Cart item not found' });
    }
    
    userCart.splice(itemIndex, 1);
    saveCarts();
    res.json({ success: true, message: 'Removed from cart' });
});

// ==================== ORDER ROUTES ====================
app.post('/api/orders', verifyToken, (req, res) => {
    const { payment_method, delivery_address } = req.body;
    
    if (!payment_method || !delivery_address) {
        return res.status(400).json({ error: 'Payment method and delivery address are required' });
    }
    
    let userCart = getUserCart(req.userId);
    if (userCart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }
    
    let totalAmount = 0;
    const orderItems = [];
    
    for (const cartItem of userCart) {
        const menuItem = menuItems.find(m => m.id === cartItem.menu_item_id);
        if (!menuItem) {
            return res.status(400).json({ error: `Menu item ${cartItem.menu_item_id} not found` });
        }
        if (!menuItem.is_available) {
            return res.status(400).json({ error: `${menuItem.name} is no longer available` });
        }
        const itemTotal = menuItem.price * cartItem.quantity;
        totalAmount += itemTotal;
        orderItems.push(`${menuItem.name} x${cartItem.quantity}`);
    }
    
    const newOrder = {
        id: getNextId(orders),
        user_id: req.userId,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: payment_method,
        delivery_address: delivery_address,
        order_time: new Date().toISOString(),
        items: orderItems.join(', ')
    };
    
    orders.push(newOrder);
    carts[req.userId] = [];
    saveOrders();
    saveCarts();
    
    res.json({ success: true, message: 'Order placed successfully', orderId: newOrder.id });
});

app.get('/api/orders', verifyToken, (req, res) => {
    const userOrders = orders.filter(order => order.user_id === req.userId);
    res.json(userOrders);
});

// ==================== ADMIN ROUTES ====================
app.post('/api/admin/menu', verifyAdmin, (req, res) => {
    const { name, description, price, category, image_asset, is_available } = req.body;
    
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
    }
    
    const newItem = {
        id: getNextId(menuItems),
        name: name.trim(),
        description: description || '',
        price: parseFloat(price),
        category: category || 'Other',
        image_asset: image_asset || null,
        is_available: is_available !== undefined ? is_available : true,
        created_at: new Date().toISOString()
    };
    
    menuItems.push(newItem);
    saveMenu();
    res.json({ success: true, message: 'Item added', item: newItem });
});

app.put('/api/admin/menu/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    const { name, description, price, category, image_asset, is_available } = req.body;
    const currentItem = menuItems[index];
    
    console.log('=== UPDATE MENU ITEM ===');
    console.log('Item ID:', id);
    console.log('Current is_available:', currentItem.is_available);
    console.log('Received is_available:', is_available);
    
    const updatedItem = {
        ...currentItem,
        name: name !== undefined ? name.trim() : currentItem.name,
        description: description !== undefined ? description : currentItem.description,
        price: price !== undefined ? parseFloat(price) : currentItem.price,
        category: category !== undefined ? category : currentItem.category,
        image_asset: image_asset !== undefined ? image_asset : currentItem.image_asset,
        is_available: is_available !== undefined ? is_available : currentItem.is_available,
        updated_at: new Date().toISOString()
    };
    
    console.log('Updated is_available:', updatedItem.is_available);
    
    menuItems[index] = updatedItem;
    saveMenu();
    
    console.log('Menu saved. New value:', menuItems[index].is_available);
    console.log('========================');
    
    res.json({ success: true, message: 'Item updated', item: updatedItem });
});

app.delete('/api/admin/menu/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    menuItems.splice(index, 1);
    saveMenu();
    res.json({ success: true, message: 'Item deleted' });
});

app.get('/api/admin/users', verifyAdmin, (req, res) => {
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPassword);
});

app.post('/api/admin/users', verifyAdmin, (req, res) => {
    const { username, email, password, full_name, phone, address, role } = req.body;
    
    if (!username || username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!full_name || full_name.length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters' });
    }
    
    const existingEmail = users.find(u => u.email === email.toLowerCase());
    if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    
    const existingUsername = users.find(u => u.username === username);
    if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
    }
    
    const newUser = {
        id: getNextId(users),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        full_name: full_name.trim(),
        phone: phone || '',
        address: address || '',
        role: role || 'customer',
        created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers();
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ success: true, message: 'User created', user: userWithoutPassword });
});

app.put('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (id === 1 && req.body.role === 'customer') {
        return res.status(400).json({ error: 'Cannot demote the main admin' });
    }
    
    const { full_name, phone, address, role } = req.body;
    
    if (full_name !== undefined) users[index].full_name = full_name.trim();
    if (phone !== undefined) users[index].phone = phone;
    if (address !== undefined) users[index].address = address;
    if (role !== undefined) users[index].role = role;
    users[index].updated_at = new Date().toISOString();
    
    saveUsers();
    
    const { password: _, ...userWithoutPassword } = users[index];
    res.json({ success: true, message: 'User updated', user: userWithoutPassword });
});

app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    
    if (id === 1) {
        return res.status(400).json({ error: 'Cannot delete the main admin' });
    }
    
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    delete carts[id];
    orders = orders.filter(o => o.user_id !== id);
    
    users.splice(index, 1);
    saveUsers();
    saveOrders();
    saveCarts();
    
    res.json({ success: true, message: 'User deleted' });
});

app.get('/api/admin/orders', verifyAdmin, (req, res) => {
    const ordersWithUser = orders.map(order => {
        const user = users.find(u => u.id === order.user_id);
        return { ...order, user_name: user?.full_name || 'Unknown' };
    });
    res.json(ordersWithUser);
});

app.put('/api/admin/orders/:orderId/status', verifyAdmin, (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    order.updated_at = new Date().toISOString();
    saveOrders();
    
    res.json({ success: true, message: 'Order status updated', order });
});

app.delete('/api/admin/orders/:orderId', verifyAdmin, (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const index = orders.findIndex(o => o.id === orderId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    orders.splice(index, 1);
    saveOrders();
    res.json({ success: true, message: 'Order deleted' });
});

app.get('/api/admin/stats', verifyAdmin, (req, res) => {
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const totalOrders = orders.length;
    const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0);
    const totalMenuItems = menuItems.length;
    
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    res.json({
        total_customers: totalCustomers,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        total_menu_items: totalMenuItems,
        pending_orders: pendingOrders,
        confirmed_orders: confirmedOrders,
        preparing_orders: preparingOrders,
        ready_orders: readyOrders,
        delivered_orders: deliveredOrders,
        cancelled_orders: cancelledOrders
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('FOOD ORDERING BACKEND');
    console.log('='.repeat(50));
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Test: http://localhost:${PORT}/api/test`);
    console.log(`Data directory: ${DATA_DIR}`);
    console.log('\nAdmin: admin@fooddash.com / admin123');
    console.log('Customer: john@gmail.com / john123');
    console.log('='.repeat(50));
});
