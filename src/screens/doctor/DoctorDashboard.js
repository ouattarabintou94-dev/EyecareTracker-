import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, RefreshControl,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getPatientsAPI, addPatientAPI, getScreeningsAPI, getAppointmentsAPI, updateAppointmentAPI, getAlertsAPI, markAlertReadAPI } from '../../services/api';
import { Alert } from 'react-native';

const MOCK_PATIENTS = [
  { id: '1', name: 'Amara Koné',     age: 45, phone: '+22507000001', pathology: 'Myopie' },
  { id: '2', name: 'Fatou Bah',      age: 62, phone: '+22507000002', pathology: 'Glaucome' },
  { id: '3', name: 'Ibrahim Traoré', age: 38, phone: '+22507000003', pathology: 'Astigmatisme' },
];
const MOCK_SCREENINGS = [
  { id: '1', patient_name: 'Amara Koné',  created_at: '2026-04-10', score: 4, total: 5, result: 'Normal' },
  { id: '2', patient_name: 'Fatou Bah',   created_at: '2026-03-22', score: 1, total: 5, result: 'Consultation urgente' },
];
const MOCK_ALERTS = [
  { id: '1', patient_name: 'Fatou Bah',   level: 3, is_read: 0, created_at: '2026-04-21T08:30:00' },
  { id: '2', patient_name: 'Kofi Mensah', level: 2, is_read: 0, created_at: '2026-04-20T14:00:00' },
];

const ALERT_LEVELS = {
  2: { label: 'Alerte',  color: '#ea580c', bg: '#fff7ed', icon: '🚨' },
  3: { label: 'Urgence', color: '#dc2626', bg: '#fef2f2', icon: '🆘' },
};

const STATUS = {
  confirmed: { bg: '#dcfce7', text: '#166534', label: 'Confirmé' },
  pending:   { bg: '#fef9c3', text: '#854d0e', label: 'En attente' },
  done:      { bg: '#f1f5f9', text: '#475569', label: 'Terminé' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Annulé' },
};

const Tab = createBottomTabNavigator();

// ─── HOME ─────────────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [screenings, setScreenings] = useState(MOCK_SCREENINGS);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [pRes, sRes, aRes] = await Promise.all([getPatientsAPI(), getScreeningsAPI(), getAlertsAPI()]);
      if (pRes.data?.length) setPatients(pRes.data);
      if (sRes.data?.length) setScreenings(sRes.data);
      if (aRes.data?.length) setAlerts(aRes.data);
    } catch (_) {}
  };

  useEffect(() => { load(); }, []);

  const unread = alerts.filter(a => !a.is_read).length;
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const stats = [
    { icon: '👥', value: patients.length, label: 'Patients',   color: '#2b6cb0', bg: '#ebf4ff' },
    { icon: '🔔', value: unread,          label: 'Alertes',    color: unread > 0 ? '#dc2626' : '#16a34a', bg: unread > 0 ? '#fef2f2' : '#f0fdf4' },
    { icon: '🔍', value: screenings.length, label: 'Dépistages', color: '#7c3aed', bg: '#f5f3ff' },
  ];

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor="#2b6cb0" />}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#2b6cb0' }}>{(user?.name || 'D').charAt(0)}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Dépistages récents */}
      <Text style={styles.sectionTitle}>Dépistages récents</Text>
      {screenings.slice(0, 3).map(s => {
        const resColor = s.result === 'Normal' ? '#166534' : s.result === 'Suivi recommandé' ? '#854d0e' : '#991b1b';
        const resBg    = s.result === 'Normal' ? '#dcfce7' : s.result === 'Suivi recommandé' ? '#fef9c3' : '#fee2e2';
        return (
          <View key={s.id} style={styles.listCard}>
            <View style={styles.listIconBox}><Text style={{ fontSize: 18 }}>👁</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listCardTitle}>{s.patient_name || s.patientName}</Text>
              <Text style={styles.listCardSub}>{(s.created_at || '').slice(0, 10)} · {s.score}/{s.total}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: resBg }]}>
              <Text style={[styles.statusText, { color: resColor }]}>{s.result}</Text>
            </View>
          </View>
        );
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
const PatientsScreen = () => {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pathology, setPathology] = useState('');
  const [age, setAge] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getPatientsAPI()
      .then(res => { setPatients(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) { Alert.alert('Champs requis', 'Nom et téléphone requis.'); return; }
    setSubmitting(true);
    try {
      await addPatientAPI({ name: name.trim(), phone: phone.trim(), pathology, age: age ? parseInt(age) : null });
      Alert.alert('✅ Patient ajouté', 'Mot de passe temporaire : eyecare123');
      setModalVisible(false); setName(''); setPhone(''); setPathology(''); setAge('');
      load();
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || "Impossible d'ajouter le patient.");
    } finally { setSubmitting(false); }
  };

  const filtered = patients.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.pathology || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.screen}>
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Patients</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Rechercher un patient..." value={search} onChangeText={setSearch} placeholderTextColor="#a0aec0" />
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2b6cb0" /> : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun patient trouvé.</Text>}
          renderItem={({ item }) => (
            <View style={styles.patientCard}>
              <View style={styles.patientAvatar}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{(item.name || '?').charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listCardTitle}>{item.name}</Text>
                <Text style={styles.listCardSub}>📱 {item.phone || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {item.pathology && <View style={styles.pathologyBadge}><Text style={styles.pathologyText}>{item.pathology}</Text></View>}
                {item.age && <Text style={styles.ageText}>{item.age} ans</Text>}
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>👤 Nouveau patient</Text>
            <Text style={styles.modalLabel}>Nom complet *</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Amara Koné" value={name} onChangeText={setName} placeholderTextColor="#a0aec0" />
            <Text style={styles.modalLabel}>Téléphone *</Text>
            <TextInput style={styles.modalInput} placeholder="+225 07 00 00 00" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#a0aec0" />
            <Text style={styles.modalLabel}>Pathologie</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Cataracte, Myopie..." value={pathology} onChangeText={setPathology} placeholderTextColor="#a0aec0" />
            <Text style={styles.modalLabel}>Âge</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: 45" value={age} onChangeText={setAge} keyboardType="numeric" placeholderTextColor="#a0aec0" />
            <TouchableOpacity style={[styles.modalSubmitBtn, submitting && { opacity: 0.7 }]} onPress={handleAdd} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Ajouter le patient</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getAppointmentsAPI()
      .then(res => { if (res.data) setAppointments(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleUpdate = (id, status) => {
    const label = status === 'confirmed' ? 'confirmer' : 'annuler';
    Alert.alert('Confirmation', `Voulez-vous ${label} ce rendez-vous ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', onPress: async () => {
        try { await updateAppointmentAPI(id, { status, notes: '' }); load(); }
        catch { Alert.alert('Erreur', 'Impossible de mettre à jour.'); }
      }},
    ]);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Rendez-vous</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2b6cb0" /> : (
        <FlatList
          data={appointments}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun rendez-vous pour l'instant.</Text>}
          renderItem={({ item }) => {
            const s = STATUS[item.status] || STATUS.pending;
            const d = new Date(item.date);
            return (
              <View style={styles.apptCard}>
                <View style={styles.apptDateBox}>
                  <Text style={styles.apptDay}>{String(d.getDate()).padStart(2, '0')}</Text>
                  <Text style={styles.apptMonth}>{d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listCardTitle}>{item.patient_name || 'Patient'}</Text>
                  <Text style={styles.listCardSub}>{item.notes || 'Consultation'}</Text>
                  <Text style={styles.listCardSub}>🕐 {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                  </View>
                  {item.status === 'pending' && (
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity style={styles.confirmBtn} onPress={() => handleUpdate(item.id, 'confirmed')}>
                        <Text style={styles.confirmBtnText}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => handleUpdate(item.id, 'cancelled')}>
                        <Text style={styles.cancelBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

// ─── SCREENINGS ───────────────────────────────────────────────────────────────
const ScreeningsScreen = () => {
  const [screenings, setScreenings] = useState(MOCK_SCREENINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScreeningsAPI()
      .then(res => { if (res.data?.length) setScreenings(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Dépistages</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2b6cb0" /> : (
        <FlatList
          data={screenings}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const resColor = item.result === 'Normal' ? '#166534' : item.result === 'Suivi recommandé' ? '#854d0e' : '#991b1b';
            const resBg    = item.result === 'Normal' ? '#dcfce7' : item.result === 'Suivi recommandé' ? '#fef9c3' : '#fee2e2';
            return (
              <View style={styles.listCard}>
                <View style={styles.listIconBox}><Text style={{ fontSize: 18 }}>👁</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listCardTitle}>{item.patient_name || item.patientName}</Text>
                  <Text style={styles.listCardSub}>{(item.created_at || '').slice(0, 10)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.screeningScore, { color: '#2b6cb0' }]}>{item.score}/{item.total}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: resBg, marginLeft: 0, marginTop: 4 }]}>
                    <Text style={[styles.statusText, { color: resColor }]}>{item.result}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

// ─── ALERTS ───────────────────────────────────────────────────────────────────
const AlertsScreen = () => {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getAlertsAPI()
      .then(res => { if (res.data?.length) setAlerts(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleRead = (id) => {
    Alert.alert('Marquer comme lu', 'Confirmer ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', onPress: async () => {
        try { await markAlertReadAPI(id); load(); }
        catch { setAlerts(prev => prev.map(a => String(a.id) === String(id) ? { ...a, is_read: 1 } : a)); }
      }},
    ]);
  };

  const unread = alerts.filter(a => !a.is_read);
  const read   = alerts.filter(a => a.is_read);

  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Alertes</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#dc2626" /> : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {unread.length === 0 && (
            <View style={styles.noAlertBox}>
              <Text style={{ fontSize: 44, marginBottom: 10 }}>✅</Text>
              <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 15 }}>Aucune alerte non lue</Text>
              <Text style={{ color: '#a0aec0', fontSize: 13, marginTop: 4 }}>Tous vos patients vont bien.</Text>
            </View>
          )}
          {unread.length > 0 && <Text style={styles.alertSection}>Non lues ({unread.length})</Text>}
          {unread.map(a => {
            const cfg = ALERT_LEVELS[a.level] || ALERT_LEVELS[2];
            return (
              <View key={a.id} style={[styles.alertCard, { backgroundColor: cfg.bg, borderLeftColor: cfg.color }]}>
                <Text style={styles.alertIcon}>{cfg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertPatient}>{a.patient_name}</Text>
                  <Text style={[styles.alertLevel, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.alertDate}>{new Date(a.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <TouchableOpacity style={styles.readBtn} onPress={() => handleRead(a.id)}>
                  <Text style={styles.readBtnText}>Lu ✓</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {read.length > 0 && <Text style={[styles.alertSection, { marginTop: 20 }]}>Lues</Text>}
          {read.map(a => {
            const cfg = ALERT_LEVELS[a.level] || ALERT_LEVELS[2];
            return (
              <View key={a.id} style={[styles.alertCard, { backgroundColor: '#f7fafc', borderLeftColor: '#cbd5e0', opacity: 0.6 }]}>
                <Text style={styles.alertIcon}>{cfg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertPatient}>{a.patient_name}</Text>
                  <Text style={{ fontSize: 12, color: '#a0aec0' }}>{cfg.label}</Text>
                  <Text style={styles.alertDate}>{new Date(a.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <Text style={{ fontSize: 20, color: '#22c55e' }}>✓</Text>
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const { user, logout } = useAuth();
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Profil</Text>
      <View style={styles.profileCard}>
        <View style={[styles.profileAvatar, { backgroundColor: '#2b6cb0' }]}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff' }}>{(user?.name || 'D').charAt(0)}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <View style={[styles.profileRoleBadge, { backgroundColor: '#ebf4ff' }]}>
          <Text style={[styles.profileRoleText, { color: '#2b6cb0' }]}>🩺 Médecin</Text>
        </View>
        <View style={styles.divider} />
        {[
          { label: 'Téléphone', value: user?.phone, icon: '📱' },
          { label: 'Spécialité', value: user?.specialty, icon: '🏥' },
          { label: 'Email', value: user?.email, icon: '📧' },
        ].map((r, i) => (
          <View key={i} style={styles.profileRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text>{r.icon}</Text>
              <Text style={styles.profileRowLabel}>{r.label}</Text>
            </View>
            <Text style={styles.profileRowValue}>{r.value || '—'}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>🚪  Se déconnecter</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// ─── TAB NAVIGATOR ────────────────────────────────────────────────────────────
const DoctorDashboard = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2b6cb0',
      tabBarInactiveTintColor: '#a0aec0',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0', paddingBottom: 8, paddingTop: 4, height: 66 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}
  >
    <Tab.Screen name="Accueil"    component={HomeScreen}        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
    <Tab.Screen name="Patients"   component={PatientsScreen}    options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text> }} />
    <Tab.Screen name="RDV"        component={AppointmentsScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text> }} />
    <Tab.Screen name="Dépistages" component={ScreeningsScreen}  options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text> }} />
    <Tab.Screen name="Alertes"    component={AlertsScreen}      options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚠️</Text> }} />
    <Tab.Screen name="Profil"     component={ProfileScreen}     options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }} />
  </Tab.Navigator>
);

export default DoctorDashboard;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f0f4f8', paddingHorizontal: 16, paddingTop: 52 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 13, color: '#718096', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1a365d', letterSpacing: -0.5 },
  dateText: { fontSize: 12, color: '#a0aec0', marginTop: 2 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ebf4ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bee3f8' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#718096', marginTop: 2, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a365d', marginBottom: 12, letterSpacing: -0.3 },
  listCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  listIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ebf4ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listCardTitle: { fontSize: 14, fontWeight: '700', color: '#1a365d' },
  listCardSub: { fontSize: 12, color: '#718096', marginTop: 2 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1a365d', marginBottom: 16, letterSpacing: -0.5 },
  pageTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addBtn: { backgroundColor: '#2b6cb0', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, marginBottom: 14, borderWidth: 1.5, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#2d3748' },
  emptyText: { textAlign: 'center', color: '#a0aec0', marginTop: 40, fontSize: 15 },
  patientCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2b6cb0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pathologyBadge: { backgroundColor: '#ebf4ff', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pathologyText: { color: '#2b6cb0', fontSize: 11, fontWeight: '700' },
  ageText: { fontSize: 11, color: '#a0aec0', fontWeight: '500' },
  apptCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  apptDateBox: { backgroundColor: '#ebf4ff', borderRadius: 10, width: 52, alignItems: 'center', paddingVertical: 10, marginRight: 14 },
  apptDay: { fontSize: 22, fontWeight: '800', color: '#2b6cb0', lineHeight: 24 },
  apptMonth: { fontSize: 10, color: '#4a90d9', fontWeight: '700', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  confirmBtn: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  confirmBtnText: { color: '#166534', fontWeight: '800', fontSize: 14 },
  cancelBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  cancelBtnText: { color: '#991b1b', fontWeight: '800', fontSize: 14 },
  screeningScore: { fontSize: 16, fontWeight: '800' },
  alertSection: { fontSize: 12, fontWeight: '700', color: '#718096', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  alertCard: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 4 },
  alertIcon: { fontSize: 28, marginRight: 12 },
  alertPatient: { fontSize: 15, fontWeight: '700', color: '#1a365d' },
  alertLevel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  alertDate: { fontSize: 11, color: '#a0aec0', marginTop: 2 },
  readBtn: { backgroundColor: '#2b6cb0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  readBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  noAlertBox: { alignItems: 'center', paddingVertical: 60, backgroundColor: '#fff', borderRadius: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1a365d', marginBottom: 6 },
  profileRoleBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 4 },
  profileRoleText: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#e2e8f0', width: '100%', marginVertical: 16 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 },
  profileRowLabel: { fontSize: 14, color: '#718096', fontWeight: '500' },
  profileRowValue: { fontSize: 14, color: '#1a365d', fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#dc2626', fontWeight: '800', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a365d', marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#4a5568', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2d3748', backgroundColor: '#f7fafc' },
  modalSubmitBtn: { backgroundColor: '#2b6cb0', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  modalSubmitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  modalCancelBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderColor: '#e2e8f0' },
  modalCancelText: { color: '#718096', fontWeight: '600', fontSize: 15 },
});
