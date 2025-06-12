import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const phoneTrim = phone.trim();
    const passwordTrim = password.trim();
    const rePasswordTrim = rePassword.trim();
    if (!phoneTrim || !passwordTrim || !rePasswordTrim) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (passwordTrim !== rePasswordTrim) {
      Alert.alert('Lỗi', 'Mật khẩu nhập lại không khớp!');
      return;
    }
    if (passwordTrim.length < 4) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 4 ký tự!');
      return;
    }
    setLoading(true);
    try {
      console.log('[REGISTER] Gửi lên:', { sodienthoai: phoneTrim, password: passwordTrim });
      const res = await fetch('https://be-ecom-longchau-production-hehe.up.railway.app/identityuser/createAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sodienthoai: phoneTrim,
          matkhau: passwordTrim,
        }),
      });
      const data = await res.json();
      console.log('[REGISTER] Kết quả:', data);
      if (res.ok && (data?.success || data?.message === 'Request Successfully')) {
        Alert.alert('Thành công', 'Đăng ký thành viên thành công!');
        router.replace('/login');
      } else {
        Alert.alert('Lỗi', data?.message ?? 'Đăng ký thất bại!');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký tài khoản</Text>
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu"
        value={rePassword}
        onChangeText={setRePassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/login')} style={{marginTop: 16}}>
        <Text style={{color: '#0078D4', textAlign: 'center'}}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0078D4',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: '#0078D4',
    borderRadius: 20,
    paddingVertical: 14,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 17,
  },
});
