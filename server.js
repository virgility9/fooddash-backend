const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATA STORAGE ====================
let users = [
    { id: 1, username: 'admin', email: 'admin@fooddash.com', password: 'admin123', full_name: 'Admin User', phone: '09123456789', address: 'Admin Office', role: 'admin', createdAt: new Date().toISOString() },
    { id: 2, username: 'john', email: 'john@gmail.com', password: 'john123', full_name: 'John Doe', phone: '09123456788', address: 'Makati City', role: 'customer', createdAt: new Date().toISOString() },
];

let menuItems = [
    { id: 1, name: 'Margherita Pizza', description: 'Fresh tomatoes, fresh mozzarella, fresh basil', price: 299.00, category: 'Pizza', image_asset: 'assets/images/pizza_margherita.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 2, name: 'Pepperoni Pizza', description: 'Pepperoni, mozzarella, tomato sauce', price: 399.00, category: 'Pizza', image_asset: 'assets/images/pizza_pepperoni.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 3, name: 'Chicken Burger', description: 'Grilled chicken breast with lettuce, tomato, mayo', price: 189.00, category: 'Burgers', image_asset: 'assets/images/chicken_burger.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 4, name: 'Beef Burger', description: '100% beef patty with cheese, lettuce, pickles', price: 229.00, category: 'Burgers', image_asset: 'assets/images/beef_burger.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 5, name: 'Chicken Strips', description: 'Crispy chicken strips', price: 149.00, category: 'Sides', image_asset: 'assets/images/chicken_strips.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 6, name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan cheese', price: 169.00, category: 'Salads', image_asset: 'assets/images/caesar_salad.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 7, name: 'Pasta Carbonara', description: 'Creamy pasta with bacon, egg, parmesan cheese', price: 269.00, category: 'Pasta', image_asset: 'assets/images/pasta_carbonara.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 8, name: 'French Fries', description: 'Crispy golden french fries', price: 99.00, category: 'Sides', image_asset: 'assets/images/french_fries.jpg', is_available: true, createdAt: new Date().toISOString() },
    { id: 9, name: 'Coca Cola', description: 'Refreshing Coca Cola', price: 59.00, category: 'Beverages', image_asset: 'assets/images/coke.jpg', is_available: true, createdAt: new Date().toISOString() }
];

let carts = {};
let orders = [];
let nextOrderId = 1;
let nextCartId = 1;
let nextMenuItemId = 10;

function getUserCart(userId) {
    if (!carts[userId]) carts[userId] = [];
    return carts[userId];
}

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    req.userId = userId;
    next();
};

const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    const user = users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.userId = userId;
    next();
};

// ==================== PUBLIC ROUTES ====================
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Backend is running!', timestamp: new Date().toISOString() });
});

app.post('/api/register', (req, res) => {
    const { username, email, password, full_name, phone, address } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });
    const newUser = {
        id: users.length + 1,
        username, email, password, full_name, phone: phone || '', address: address || '',
        role: 'customer', createdAt: new Date().toISOString()
    };
    users.push(newUser);
    res.json({ success: true, message: 'Registration successful', userId: newUser.id });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({
            success: true,
            token: `token_${user.id}_${Date.now()}`,
            user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, phone: user.phone, address: user.address, role: user.role }
        });
    } else {
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

app.get('/api/menu', (req, res) => {
    res.json(menuItems.filter(item => item.is_available));
});

// ==================== CART ROUTES ====================
app.get('/api/cart', (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    const userCart = getUserCart(userId);
    const cartWithDetails = userCart.map(cartItem => {
        const menuItem = menuItems.find(m => m.id === cartItem.menu_item_id);
        return { id: cartItem.id, menu_item_id: cartItem.menu_item_id, quantity: cartItem.quantity, name: menuItem?.name || 'Unknown', menu_price: menuItem?.price || 0, image_asset: menuItem?.image_asset || null };
    });
    res.json(cartWithDetails);
});

app.post('/api/cart', (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    const { menu_item_id, quantity } = req.body;
    let userCart = getUserCart(userId);
    const existingItem = userCart.find(item => item.menu_item_id === menu_item_id);
    if (existingItem) existingItem.quantity += quantity;
    else userCart.push({ id: nextCartId++, menu_item_id, quantity });
    res.json({ success: true, message: 'Added to cart' });
});

app.put('/api/cart/:cartId', (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    const { quantity } = req.body;
    const cartId = parseInt(req.params.cartId);
    let userCart = getUserCart(userId);
    const itemIndex = userCart.findIndex(item => item.id === cartId);
    if (itemIndex !== -1) {
        if (quantity <= 0) userCart.splice(itemIndex, 1);
        else userCart[itemIndex].quantity = quantity;
        res.json({ success: true, message: 'Cart updated' });
    } else res.status(404).json({ error: 'Item not found' });
});

app.delete('/api/cart/:cartId', (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    const cartId = parseInt(req.params.cartId);
    let userCart = getUserCart(userId);
    const itemIndex = userCart.findIndex(item => item.id === cartId);
    if (itemIndex !== -1) {
        userCart.splice(itemIndex, 1);
        res.json({ success: true, message: 'Removed from cart' });
    } else res.status(404).json({ error: 'Item not found' });
});

// ==================== ORDER ROUTES ====================
app.post('/api/orders', (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    const { payment_method, delivery_address } = req.body;
    let userCart = getUserCart(userId);
    if (userCart.length === 0) return res.status(400).json({ error: 'Cart is empty' });
    let totalAmount = 0;
    for (const cartItem of userCart) {
        const menuItem = menuItems.find(m => m.id === cartItem.menu_item_id);
        if (menuItem) totalAmount += menuItem.price * cartItem.quantity;
    }
    const newOrder = {
        id: nextOrderId++, user_id: userId, total_amount: totalAmount, status: 'pending',
        payment_method, delivery_address, order_time: new Date().toISOString(),
        items: userCart.map(cartItem => {
            const menuItem = menuItems.find(m => m.id === cartItem.menu_item_id);
            return `${menuItem.name} x${cartItem.quantity}`;
        }).join(', ')
    };
    orders.push(newOrder);
    carts[userId] = [];
    res.json({ success: true, message: 'Order placed successfully', orderId: newOrder.id });
});

app.get('/api/orders', (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    const userId = parseInt(token.split('_')[1]);
    res.json(orders.filter(order => order.user_id === userId));
});

// ==================== ADMIN ROUTES ====================
app.get('/api/admin/menu', verifyAdmin, (req, res) => {
    res.json(menuItems);
});

app.post('/api/admin/menu', verifyAdmin, (req, res) => {
    const { name, description, price, category, image_asset, is_available } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const newItem = {
        id: nextMenuItemId++, name, description: description || '', price: parseFloat(price), category: category || 'Other',
        image_asset: image_asset || null, is_available: is_available !== undefined ? is_available : true, createdAt: new Date().toISOString()
    };
    menuItems.push(newItem);
    res.json({ success: true, message: 'Item added', item: newItem });
});

app.put('/api/admin/menu/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });
    const currentItem = menuItems[index];
    const { name, description, price, category, image_asset, is_available } = req.body;
    menuItems[index] = {
        ...currentItem,
        name: name !== undefined ? name : currentItem.name,
        description: description !== undefined ? description : currentItem.description,
        price: price !== undefined ? parseFloat(price) : currentItem.price,
        category: category !== undefined ? category : currentItem.category,
        image_asset: image_asset !== undefined ? image_asset : currentItem.image_asset,
        is_available: is_available !== undefined ? is_available : currentItem.is_available,
        updatedAt: new Date().toISOString()
    };
    res.json({ success: true, message: 'Item updated', item: menuItems[index] });
});

app.delete('/api/admin/menu/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const index = menuItems.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });
    menuItems.splice(index, 1);
    res.json({ success: true, message: 'Item deleted' });
});

app.get('/api/admin/users', verifyAdmin, (req, res) => {
    res.json(users.map(({ password, ...user }) => user));
});

app.post('/api/admin/users', verifyAdmin, (req, res) => {
    const { username, email, password, full_name, phone, address, role } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });
    const newUser = { id: users.length + 1, username, email, password, full_name, phone: phone || '', address: address || '', role: role || 'customer', createdAt: new Date().toISOString() };
    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ success: true, message: 'User created', user: userWithoutPassword });
});

app.put('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    const { full_name, phone, address, role } = req.body;
    if (full_name !== undefined) users[index].full_name = full_name;
    if (phone !== undefined) users[index].phone = phone;
    if (address !== undefined) users[index].address = address;
    if (role !== undefined) users[index].role = role;
    const { password: _, ...userWithoutPassword } = users[index];
    res.json({ success: true, message: 'User updated', user: userWithoutPassword });
});

app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (id === 1) return res.status(400).json({ error: 'Cannot delete main admin' });
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(index, 1);
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
    const order = orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    res.json({ success: true, message: 'Order status updated', order });
});

app.delete('/api/admin/orders/:orderId', verifyAdmin, (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return res.status(404).json({ error: 'Order not found' });
    orders.splice(index, 1);
    res.json({ success: true, message: 'Order deleted' });
});

app.get('/api/admin/stats', verifyAdmin, (req, res) => {
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    const totalOrders = orders.length;
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0);
    const totalMenuItems = menuItems.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    res.json({ total_customers: totalCustomers, total_orders: totalOrders, total_revenue: totalRevenue, total_menu_items: totalMenuItems, pending_orders: pendingOrders, preparing_orders: preparingOrders, ready_orders: readyOrders, delivered_orders: deliveredOrders, cancelled_orders: cancelledOrders });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('🍕 FOOD ORDERING BACKEND (FIXED)');
    console.log('='.repeat(50));
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📝 Test: http://localhost:${PORT}/api/test`);
    console.log(`🍽️ Menu: http://localhost:${PORT}/api/menu`);
    console.log('\n🔑 Admin: admin@fooddash.com / admin123');
    console.log('👤 Customer: john@gmail.com / john123');
    console.log('='.repeat(50));
});
