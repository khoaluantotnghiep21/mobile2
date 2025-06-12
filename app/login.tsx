import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

interface CustomJwtPayload extends JwtPayload {
  nameuser: string;
  sodienthoai: string;
  roles: string[];
}

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const validatePhoneNumber = (phone: string) => {
    const vnPhoneRegex = /^0\d{9}$/;
    return vnPhoneRegex.test(phone);
  };

  const handleLogin = async () => {
    if (!validatePhoneNumber(username)) {
      Alert.alert('Lỗi', 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0');
      return;
    }

    if (!password) {
      Alert.alert('Lỗi', 'Mật khẩu không được để trống');
      return;
    }

    try {
      const response = await fetch(
        'https://be-ecom-longchau-production-hehe.up.railway.app/identityuser/signIn',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sodienthoai: username,
            matkhau: password,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 201 && data?.data?.accessToken) {
        const decodedUser = jwtDecode<CustomJwtPayload>(data.data.accessToken);

        // Lưu thông tin người dùng vào AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(decodedUser));
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        await AsyncStorage.setItem('userPhone', data.data.accessToken); 

        ToastAndroid.show(
          `Đăng nhập thành công! Xin chào ${decodedUser.nameuser}`,
          ToastAndroid.LONG
        );

        // Điều hướng sang màn hình chính (index)
        router.push('/'); // Điều hướng về index trong expo-router
      } else {
        // Xử lý lỗi trả về từ API khi sai mật khẩu hoặc tài khoản
        let errorMsg = 'Sai tài khoản hoặc mật khẩu';
        if (data?.message) {
          if (typeof data.message === 'string') {
            errorMsg = data.message;
          } else if (typeof data.message === 'object' && typeof data.message.message === 'string') {
            errorMsg = data.message.message;
          }
        }
        Alert.alert('Thất bại', errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ');
    }
  };

  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.webp')} style={styles.logo} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Tài khoản sử dụng mọi dịch vụ FPT</Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Số điện thoại *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Mật khẩu *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Tiếp tục</Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={styles.linkText}>Điều khoản và Chính sách bảo mật</Text> của FPT ID
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

// Các style được giữ nguyên như trong mã gốc

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 100,
  },
  logo: {
    width: 180,
    height: 70,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  button: {
    backgroundColor: '#FF6200',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  linkText: {
    color: '#FF6200',
    fontWeight: 'bold',
  },
  socialContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  socialText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  icon: {
    width: 40,
    height: 40,
  },
});