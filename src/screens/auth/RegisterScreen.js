import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar,
} from 'react-native';
import { registerAPI } from '../../services/api';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password || !confirm) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await registerAPI({ name: name.trim(), phone: phone.trim(), password, role });
      Alert.alert('Compte créé !', 'Vous pouvez maintenant vous connecter.', [
        { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la création du compte.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={{ fontSize: 44 }}>👁</Text>
          </View>
          <Text style={styles.appName}>EyeCare Tracker</Text>
          <Text style={styles.tagline}>Créer un compte</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inscription</Text>

          {/* Rôle */}
          <Text style={styles.label}>Je suis</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]}
              onPress={() => setRole('patient')}
            >
              <Text style={[styles.roleBtnText, role === 'patient' && styles.roleBtnTextActive]}>
                👤 Patient
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'doctor' && styles.roleBtnActive]}
              onPress={() => setRole('doctor')}
            >
              <Text style={[styles.roleBtnText, role === 'doctor' && styles.roleBtnTextActive]}>
                🩺 Médecin
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Aminata Diallo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor="#a0aec0"
          />

          <Text style={styles.label}>Numéro de téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="+225 07 00 00 00"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#a0aec0"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Minimum 6 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#a0aec0"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Répétez le mot de passe"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPassword}
            placeholderTextColor="#a0aec0"
          />

          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Déjà un compte ? Se connecter →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1a365d', paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 24 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  tagline: { fontSize: 14, color: '#bee3f8', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a365d', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4a5568', marginBottom: 6, marginTop: 12 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', backgroundColor: '#f7fafc',
  },
  roleBtnActive: { borderColor: '#2b6cb0', backgroundColor: '#ebf4ff' },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: '#718096' },
  roleBtnTextActive: { color: '#2b6cb0' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: '#2d3748', backgroundColor: '#f7fafc',
  },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  eyeBtn: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderTopRightRadius: 10,
    borderBottomRightRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    backgroundColor: '#f7fafc',
  },
  registerBtn: {
    backgroundColor: '#2b6cb0', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 22, elevation: 4,
    shadowColor: '#2b6cb0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginLink: { alignItems: 'center', marginTop: 16, paddingVertical: 4 },
  loginLinkText: { color: '#2b6cb0', fontSize: 13, fontWeight: '500' },
});

export default RegisterScreen;
