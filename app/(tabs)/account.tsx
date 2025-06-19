import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AccountScreen: React.FC = () => {
  // Lấy số điện thoại từ AsyncStorage nếu cần, hoặc truyền qua props/navigation param
  // Ở đây demo cứng, bạn có thể lấy từ context hoặc AsyncStorage nếu muốn
  const [userPhone, setUserPhone] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserPhone(user.numberPhone ?? user.sodienthoai ?? user.phoneNumber ?? null);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-circle" size={60} color="#fff" style={{ marginBottom: 8 }} />
        <Text style={styles.phone}>{userPhone ?? ""}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/profile')}>
          <MaterialIcons name="person-outline" size={22} color="#333" style={styles.icon} />
          <Text style={styles.itemText}>Thông tin cá nhân</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/orders')}>
          <MaterialIcons name="inventory-2" size={22} color="#333" style={styles.icon} />
          <Text style={styles.itemText}>Đơn hàng của tôi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <MaterialIcons name="location-on" size={22} color="#333" style={styles.icon} />
          <Text style={styles.itemText}>Quản lý sổ địa chỉ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <MaterialIcons name="event-available" size={22} color="#333" style={styles.icon} />
          <Text style={styles.itemText}>Lịch hẹn tiêm chủng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <MaterialIcons name="vaccines" size={22} color="#333" style={styles.icon} />
          <Text style={styles.itemText}>Đơn hàng tiêm chủng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <MaterialIcons name="medical-services" size={22} color="#333" style={styles.icon} />
          <Text style={styles.itemText}>Đơn thuốc của tôi</Text>
        </TouchableOpacity>          <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color="#FF3B30" style={styles.icon} />
          <Text style={[styles.itemText, { color: '#FF3B30' }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={{ marginTop: 20 }}>
        <Footer />
      </View> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1976D2',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 12,
  },
  phone: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 24,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    margin: 16,
    marginBottom: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  icon: {
    width: 28,
    textAlign: 'center',
  },
});

export default AccountScreen;
