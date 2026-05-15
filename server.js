import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';
import '../models/menu_item.dart';
import '../models/cart_item.dart';
import '../models/order.dart';
import '../models/user.dart';

class ApiService {
  final String baseUrl = ApiConstants.baseUrl;
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': _token!,
    };
  }

  // ==================== MENU APIs ====================
  Future<List<MenuItem>> getMenuItems() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/menu'));
      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((item) => MenuItem.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load menu items');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<MenuItem>> getAllMenuItems() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/menu'),
        headers: _getHeaders(),
      );
      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((item) => MenuItem.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load menu items');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<MenuItem> createMenuItem({
    required String name,
    required String description,
    required double price,
    required String category,
    String? imageAsset,
    required bool isAvailable,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/menu'),
        headers: _getHeaders(),
        body: json.encode({
          'name': name,
          'description': description,
          'price': price,
          'category': category,
          'image_asset': imageAsset,
          'is_available': isAvailable,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return MenuItem.fromJson(json.decode(response.body)['item']);
      } else {
        final err = json.decode(response.body);
        throw Exception(err['error'] ?? 'Failed to create item');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<MenuItem> updateMenuItem({
    required int id,
    required String name,
    required String description,
    required double price,
    required String category,
    String? imageAsset,
    required bool isAvailable,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/admin/menu/$id'),
        headers: _getHeaders(),
        body: json.encode({
          'name': name,
          'description': description,
          'price': price,
          'category': category,
          'image_asset': imageAsset,  // Send image_asset to preserve it
          'is_available': isAvailable,
        }),
      );
      if (response.statusCode == 200) {
        return MenuItem.fromJson(json.decode(response.body)['item']);
      } else {
        final err = json.decode(response.body);
        throw Exception(err['error'] ?? 'Failed to update item');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> deleteMenuItem(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/admin/menu/$id'),
        headers: _getHeaders(),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to delete item');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // ==================== CART APIs ====================
  Future<List<CartItem>> getCart() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/cart'),
        headers: _getHeaders(),
      );
      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((item) => CartItem.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load cart');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> addToCart(int menuItemId, int quantity) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/cart'),
        headers: _getHeaders(),
        body: json.encode({'menu_item_id': menuItemId, 'quantity': quantity}),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to add to cart');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> updateCartQuantity(int cartId, int quantity) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/cart/$cartId'),
        headers: _getHeaders(),
        body: json.encode({'quantity': quantity}),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to update cart');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> removeFromCart(int cartId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/cart/$cartId'),
        headers: _getHeaders(),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to remove from cart');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // ==================== ORDER APIs ====================
  Future<void> placeOrder(String paymentMethod, String deliveryAddress) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: _getHeaders(),
        body: json.encode({
          'payment_method': paymentMethod,
          'delivery_address': deliveryAddress,
        }),
      );
      if (response.statusCode != 200) {
        final error = json.decode(response.body);
        throw Exception(error['error'] ?? 'Failed to place order');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Order>> getOrders() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders'),
        headers: _getHeaders(),
      );
      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((order) => Order.fromJson(order)).toList();
      } else {
        throw Exception('Failed to load orders');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<List<Order>> getAllOrders() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/orders'),
        headers: _getHeaders(),
      );
      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((order) => Order.fromJson(order)).toList();
      } else {
        throw Exception('Failed to load orders');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/orders/$orderId/status'),
        headers: _getHeaders(),
        body: json.encode({'status': status}),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to update order status');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // ==================== USER APIs ====================
  Future<List<User>> getAllUsers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/users'),
        headers: _getHeaders(),
      );
      if (response.statusCode == 200) {
        List jsonResponse = json.decode(response.body);
        return jsonResponse.map((u) => User.fromJson(u)).toList();
      } else {
        throw Exception('Failed to load users');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<User> createUser({
    required String username,
    required String email,
    required String password,
    required String fullName,
    String? phone,
    String? address,
    required String role,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/users'),
        headers: _getHeaders(),
        body: json.encode({
          'username': username,
          'email': email,
          'password': password,
          'full_name': fullName,
          'phone': phone ?? '',
          'address': address ?? '',
          'role': role,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return User.fromJson(data['user']);
      } else {
        final err = json.decode(response.body);
        throw Exception(err['error'] ?? 'Failed to create user');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<User> updateUser({
    required int id,
    required String fullName,
    String? phone,
    String? address,
    required String role,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/admin/users/$id'),
        headers: _getHeaders(),
        body: json.encode({
          'full_name': fullName,
          'phone': phone ?? '',
          'address': address ?? '',
          'role': role,
        }),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return User.fromJson(data['user']);
      } else {
        final err = json.decode(response.body);
        throw Exception(err['error'] ?? 'Failed to update user');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> deleteUser(int userId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/admin/users/$userId'),
        headers: _getHeaders(),
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to delete user');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // ==================== STATS API ====================
  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/admin/stats'),
        headers: _getHeaders(),
      );
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load stats');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<bool> testConnection() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/test'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
