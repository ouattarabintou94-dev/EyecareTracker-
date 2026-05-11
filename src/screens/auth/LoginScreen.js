import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Impossible de se connecter. Vérifiez votre réseau.';
      Alert.alert('Connexion échouée', msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'doctor') { setPhone('+22507123456'); setPassword('doctor123'); }
    else { setPhone('+22505987654'); setPassword('patient123'); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>👁️</Text>
          </View>
          <Text style={styles.appName}>EyeCare Tracker</Text>
          <Text style={styles.tagline}>CHU de Bouaké · Suivi ophtalmologique</Text>

          <View style={styles.featureRow}>
            {['🔔 Alertes', '📅 RDV', '🔍 Dépistage'].map((f, i) => (
              <View key={i} style={styles.featureChip}>
                <Text style={styles.featureChipText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSub}>Accédez à votre espace médical</Text>

          {/* Téléphone */}
          <Text style={styles.label}>Numéro de téléphone</Text>
          <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputWrapperFocused]}>
            <Text style={styles.inputIconText}>📱</Text>
            <TextInput
              style={styles.input}
              placeholder="+225 07 00 00 00"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#c0c9d4"
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Mot de passe */}
          <Text style={[styles.label, { marginTop: 16 }]}>Mot de passe</Text>
          <View style={[styles.inputWrapper, focusedField === 'pass' && styles.inputWrapperFocused]}>
            <Text style={styles.inputIconText}>🔒</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#c0c9d4"
              onFocus={() => setFocusedField('pass')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Se connecter  →</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
            <Text style={styles.registerBtnText}>Créer un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Screening')} activeOpacity={0.85}>
            <Text style={styles.ghostBtnText}>🔍 Dépistage rapide sans compte</Text>
          </TouchableOpacity>
        </View>

        {/* Démo */}
        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>— Accès démo —</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity style={styles.demoDoctorBtn} onPress={() => fillDemo('doctor')} activeOpacity={0.85}>
              <Text style={styles.demoIcon}>🩺</Text>
              <Text style={styles.demoBtnText}>Médecin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoPatientBtn} onPress={() => fillDemo('patient')} activeOpacity={0.85}>
              <Text style={styles.demoIcon}>👤</Text>
              <Text style={styles.demoBtnText}>Patient</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1a365d', paddingBottom: 48 },
  header: { alignItems: 'center', paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24 },
  logoWrap: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoEmoji: { fontSize: 48 },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 13, color: '#90cdf4', marginBottom: 20, textAlign: 'center' },
  featureRow: { flexDirection: 'row', gap: 8 },
  featureChip: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  featureChipText: { color: '#bee3f8', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 24,
    padding: 26, shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12,
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#1a365d', marginBottom: 4, letterSpacing: -0.5 },
  cardSub: { fontSize: 13, color: '#a0aec0', marginBottom: 22 },
  label: { fontSize: 12, fontWeight: '700', color: '#4a5568', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    backgroundColor: '#f7fafc', paddingHorizontal: 14,
  },
  inputWrapperFocused: { borderColor: '#2b6cb0', backgroundColor: '#fff', shadowColor: '#2b6cb0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  inputIconText: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#2d3748' },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: '#2b6cb0', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 22,
    shadowColor: '#2b6cb0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { fontSize: 13, color: '#a0aec0', fontWeight: '500' },
  registerBtn: { borderWidth: 1.5, borderColor: '#2b6cb0', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  registerBtnText: { color: '#2b6cb0', fontSize: 15, fontWeight: '700' },
  ghostBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { color: '#718096', fontSize: 13, fontWeight: '500' },
  demoSection: { marginTop: 24, paddingHorizontal: 16, alignItems: 'center' },
  demoLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12, fontWeight: '600', letterSpacing: 1 },
  demoRow: { flexDirection: 'row', gap: 10, width: '100%' },
  demoDoctorBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  demoPatientBtn: { flex: 1, backgroundColor: 'rgba(56,161,105,0.25)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(56,161,105,0.4)' },
  demoIcon: { fontSize: 22, marginBottom: 4 },
  demoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default LoginScreen;
