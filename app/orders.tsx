import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OrderProduct {
  tensanpham: string;
  donvitinh: string;
  soluong: number;
  giaban: number;
  url: string;
}

interface Order {
  madonhang: string;
  hoten: string;
  thanhtien: number;
  trangthai: string;
  sanpham: OrderProduct[];
}

const OrderStatusColor: Record<string, string> = {
  'Đang chờ xác nhận': '#FF9500',
  'Đang giao hàng': '#007AFF',
  'Đã xác nhận': '#4CD964',
  'Đã hủy': '#FF3B30',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Kiểm tra accessToken trước
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('No access token found');
        router.replace('/login');
        return;
      }

      const userStr = await AsyncStorage.getItem('user');

      if (!userStr || !accessToken) {
        router.replace('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user.sub;

      if (!userId) {
        console.error('User data:', user);
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      const res = await fetch(
        `https://be-ecom-longchau-production-hehe.up.railway.app/purchase-order/getOderByUserId/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || 'Không thể tải danh sách đơn hàng'
        );
      }

      const data = await res.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Dữ liệu không hợp lệ');
      }

      // Kiểm tra và xử lý dữ liệu đơn hàng
      interface RawOrderProduct {
        tensanpham?: string;
        donvitinh?: string;
        soluong?: number;
        giaban?: number;
        url?: string;
      }

      interface RawOrder {
        madonhang?: string;
        hoten?: string;
        thanhtien?: number;
        trangthai?: string;
        sanpham?: RawOrderProduct[];
      }

      const orders: Order[] = Array.isArray(data.data)
        ? data.data.map((order: RawOrder): Order => ({
          madonhang: order.madonhang?.toString() || 'Unknown',
          hoten: order.hoten?.toString() || '',
          thanhtien: typeof order.thanhtien === 'number' ? order.thanhtien : 0,
          trangthai: order.trangthai?.toString() || 'Không xác định',
          sanpham: Array.isArray(order.sanpham)
            ? order.sanpham.map((product: RawOrderProduct): OrderProduct => ({
              tensanpham: product.tensanpham || '',
              donvitinh: product.donvitinh || '',
              soluong: typeof product.soluong === 'number' ? product.soluong : 0,
              giaban: typeof product.giaban === 'number' ? product.giaban : 0,
              url: product.url || '',
            }))
            : [],
        }))
        : [];

      setOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = (order: Order, index: number) => (
    <View key={`order-${order.madonhang}-${index}`} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>
          <Text>{'Đơn hàng: '}</Text>
          <Text>{order.madonhang}</Text>
        </Text>
        <Text style={[styles.orderStatus, { color: OrderStatusColor[order.trangthai] || '#333' }]}>
          <Text>{order.trangthai}</Text>
        </Text>
      </View>

      {order.sanpham.map((product, productIndex) => (
        <View
          key={`product-${order.madonhang}-${productIndex}`}
          style={[
            styles.productContainer,
            productIndex === order.sanpham.length - 1 && styles.lastProduct
          ]}
        >
          <Image
            source={{ uri: product.url }}
            style={styles.productImage}
            defaultSource={require('../assets/images/danhmuc.webp')}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              <Text>{product.tensanpham}</Text>
            </Text>
            <Text style={styles.productUnit}>
              <Text>{product.donvitinh}</Text>
              <Text>{' x '}</Text>
              <Text>{product.soluong}</Text>
            </Text>
            <Text style={styles.productPrice}>
              <Text>{product.giaban.toLocaleString()}</Text>
              <Text>{'đ'}</Text>
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>
          <Text>{'Thành tiền'}</Text>
        </Text>
        <Text style={styles.totalAmount}>
          <Text>{order.thanhtien.toLocaleString()}</Text>
          <Text>{'đ'}</Text>
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <MaterialIcons name="hourglass-empty" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            <Text>{'Đang tải...'}</Text>
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>
            <Text>{error}</Text>
          </Text>
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.centerContent}>
          <MaterialIcons name="shopping-bag" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            <Text>{'Chưa có đơn hàng nào'}</Text>
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        {orders.map(renderOrderItem)}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <Text>{'Đơn hàng của tôi'}</Text>
        </Text>
        <View style={{ width: 24 }} />
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    backgroundColor: '#0078D4',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastProduct: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#0078D4',
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 15,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0078D4',
  },
});