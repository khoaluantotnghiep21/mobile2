import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ProfileScreen: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [editMode, setEditMode] = React.useState(false);
  const [form, setForm] = React.useState({
    hoten: '',
    email: '',
    ngaysinh: '',
    gioitinh: '',
  });
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        let phone = '';
        if (userStr) {
          const userToken = JSON.parse(userStr);
          phone = userToken.numberPhone ?? userToken.sodienthoai ?? userToken.phoneNumber ?? '';
        }
        if (phone) {
          const res = await fetch(`https://be-ecom-longchau-production-hehe.up.railway.app/identityuser/getUserByPhone/${phone}`);
          const data = await res.json();
          setUser(data.data);
          setForm({
            hoten: data.data.hoten ?? '',
            email: data.data.email ?? '',
            ngaysinh: data.data.ngaysinh ?? '',
            gioitinh: data.data.gioitinh ?? '',
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleEdit = () => setEditMode(true);

  const handleUpdate = async () => {
    if (!user?.sodienthoai) return;
    try {
      const res = await fetch(`https://be-ecom-longchau-production-hehe.up.railway.app/identityuser/updateUser/${user.sodienthoai}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated.data);
        setEditMode(false);
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
      } else {
        Alert.alert('Lỗi', 'Cập nhật thất bại!');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ!');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Format date to YYYY-MM-DD
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setForm(f => ({ ...f, ngaysinh: `${yyyy}-${mm}-${dd}` }));
    }
  };

  if (loading) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-circle" size={80} color="#1976D2" style={{ marginBottom: 8 }} />
        <Text style={styles.phone}>{user?.sodienthoai ?? ''}</Text>
      </View>
      <View style={styles.infoBox}>
        <View style={styles.row}>
          <Text style={styles.label}>Họ và tên</Text>
          {editMode ? (
            <TextInput
              style={[styles.value, {flex:1, textAlign:'right', backgroundColor:'#F5F7FA', borderRadius:6, borderWidth:1, borderColor:'#ddd', paddingHorizontal:10}]}
              value={form.hoten}
              onChangeText={v => setForm(f => ({...f, hoten: v}))}
              placeholder="Nhập họ tên"
            />
          ) : (
            <Text style={styles.value}>{user?.hoten ?? ''}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          {editMode ? (
            <TextInput
              style={[styles.value, {flex:1, textAlign:'right', backgroundColor:'#F5F7FA', borderRadius:6, borderWidth:1, borderColor:'#ddd', paddingHorizontal:10}]}
              value={form.email}
              onChangeText={v => setForm(f => ({...f, email: v}))}
              placeholder="Nhập email"
              keyboardType="email-address"
            />
          ) : (
            <Text style={styles.value}>{user?.email ?? 'Thêm thông tin'}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Giới tính</Text>
          {editMode ? (
            <View style={{flexDirection:'row', alignItems:'center', flex:1, justifyContent:'flex-end'}}>
              <TouchableOpacity
                style={{flexDirection:'row', alignItems:'center', marginRight:20}}
                onPress={()=>setForm(f=>({...f, gioitinh:'Nam'}))}
              >
                <View style={{width:18, height:18, borderRadius:9, borderWidth:1, borderColor:'#1976D2', alignItems:'center', justifyContent:'center', marginRight:4, backgroundColor: form.gioitinh==='Nam' ? '#1976D2' : '#fff'}}>
                  {form.gioitinh==='Nam' && <View style={{width:10, height:10, borderRadius:5, backgroundColor:'#fff'}} />}
                </View>
                <Text style={{color:'#222'}}>Nam</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{flexDirection:'row', alignItems:'center'}}
                onPress={()=>setForm(f=>({...f, gioitinh:'Nữ'}))}
              >
                <View style={{width:18, height:18, borderRadius:9, borderWidth:1, borderColor:'#1976D2', alignItems:'center', justifyContent:'center', marginRight:4, backgroundColor: form.gioitinh==='Nữ' ? '#1976D2' : '#fff'}}>
                  {form.gioitinh==='Nữ' && <View style={{width:10, height:10, borderRadius:5, backgroundColor:'#fff'}} />}
                </View>
                <Text style={{color:'#222'}}>Nữ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.value}>{user?.gioitinh ?? 'Thêm thông tin'}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ngày sinh</Text>
          {editMode ? (
            <TouchableOpacity
              style={{flex:1, alignItems:'flex-end'}}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <TextInput
                style={[styles.value, {textAlign:'right', backgroundColor:'#F5F7FA', borderRadius:6, borderWidth:1, borderColor:'#ddd', paddingHorizontal:10}]}
                value={form.ngaysinh}
                editable={false}
                placeholder="YYYY-MM-DD"
                pointerEvents="none"
              />
            </TouchableOpacity>
          ) : (
            <Text style={styles.value}>{user?.ngaysinh ?? 'Thêm thông tin'}</Text>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={form.ngaysinh ? new Date(form.ngaysinh) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Số điểm</Text>
          <Text style={styles.value}>{user?.sodiem ?? 0}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={editMode ? handleUpdate : handleEdit}>
        <Text style={styles.buttonText}>{editMode ? 'Cập nhật thông tin' : 'Chỉnh sửa thông tin'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E8F0',
  },
  phone: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 24,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 15,
    color: '#333',
  },
  value: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  link: {
    color: '#1976D2',
    fontWeight: 'normal',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#E3EDFB',
    marginHorizontal: 32,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
