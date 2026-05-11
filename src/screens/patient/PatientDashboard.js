import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getAppointmentsAPI, getMyScreeningsAPI, addAppointmentAPI, addSymptomsAPI } from '../../services/api';

const MOCK_APPOINTMENTS = [
  { id: '1', doctor: 'Dr. Aminata Diallo', date: '2026-04-25T09:30:00', notes: 'Contrôle', status: 'confirmed' },
  { id: '2', doctor: 'Dr. Aminata Diallo', date: '2026-05-10T14:00:00', notes: 'Dépistage', status: 'pending' },
];
const MOCK_RECORDS = [
  { id: '1', created_at: '2026-04-10', result: 'Normal', score: 4, total: 5 },
  { id: '2', created_at: '2026-01-15', result: 'Suivi recommandé', score: 3, total: 5 },
];

const QUESTIONS = [
  { id: 'q1', text: 'Avez-vous la vision floue ?', icon: '👁️' },
  { id: 'q2', text: 'Avez-vous une douleur oculaire ?', icon: '😣' },
  { id: 'q3', text: 'Avez-vous les yeux rouges ?', icon: '🔴' },
  { id: 'q4', text: 'Avez-vous perdu la vision soudainement ?', icon: '⚠️' },
  { id: 'q5', text: 'Voyez-vous des halos autour des lumières ?', icon: '💡' },
];

const ALERT_CONFIG = {
  0: { label: 'Normal',    color: '#16a34a', bg: '#f0fdf4', icon: '✅' , message: 'Tout va bien. Continuez le suivi.' },
  1: { label: 'Vigilance', color: '#d97706', bg: '#fffbeb', icon: '⚠️',  message: 'Surveillez vos symptômes. Consultez si aggravation.' },
  2: { label: 'Alerte',    color: '#ea580c', bg: '#fff7ed', icon: '🚨', message: 'Consultez rapidement. Le médecin a été prévenu.' },
  3: { label: 'Urgence',   color: '#dc2626', bg: '#fef2f2', icon: '🆘', message: 'Appelez le médecin MAINTENANT !' },
};

const calculateAlertLevel = (answers) => {
  if (answers['q4'] === true) return 3;
  let score = 0;
  if (answers['q1']) score += 1;
  if (answers['q2']) score += 2;
  if (answers['q3']) score += 1;
  if (answers['q5']) score += 1;
  if (score === 0) return 0;
  if (score <= 2) return 1;
  if (score <= 3) return 2;
  return 3;
};

const Tab = createBottomTabNavigator();

// ─── HOME ─────────────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await getAppointmentsAPI();
      if (res.data?.length) setAppointments(res.data);
    } catch (_) {}
  };

  useEffect(() => { load(); }, []);

  const next = appointments.find(a => a.status === 'confirmed' || a.status === 'pending') || appointments[0];
  const nextDate = next ? new Date(next.date) : null;

  const tips = [
    { icon: '☀️', text: 'Reposez vos yeux 20 min toutes les 2 heures.' },
    { icon: '🥕', text: 'Consommez des aliments riches en vitamine A.' },
    { icon: '💧', text: 'Restez bien hydraté pour la santé de vos yeux.' },
    { icon: '🕶️', text: "Portez des lunettes de soleil à l'extérieur." },
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
        </View>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#2b6cb0' }}>{(user?.name || 'P').charAt(0)}</Text>
        </View>
      </View>

      {/* Prochain RDV */}
      {nextDate && (
        <View style={styles.nextCard}>
          <View style={styles.nextCardLeft}>
            <Text style={styles.nextCardLabel}>Prochain rendez-vous</Text>
            <Text style={styles.nextCardDate}>
              {nextDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Text style={styles.nextCardTime}>
              🕐 {nextDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={styles.nextCardBadge}>
              <Text style={styles.nextCardBadgeText}>
                {next?.medecin_name ? `Dr. ${next.medecin_name}` : 'Médecin assigné'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 48 }}>📅</Text>
        </View>
      )}

      {/* Stats santé */}
      <Text style={styles.sectionTitle}>État de santé visuelle</Text>
      <View style={styles.statsRow}>
        {[
          { icon: '👁', value: '8/10', label: 'Acuité', color: '#2b6cb0', bg: '#ebf4ff' },
          { icon: '💧', value: '14 mmHg', label: 'Pression', color: '#16a34a', bg: '#f0fdf4' },
          { icon: '📊', value: 'Bon', label: 'Général', color: '#d97706', bg: '#fffbeb' },
        ].map((h, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: h.bg }]}>
            <Text style={styles.statIcon}>{h.icon}</Text>
            <Text style={[styles.statValue, { color: h.color }]}>{h.value}</Text>
            <Text style={styles.statLabel}>{h.label}</Text>
          </View>
        ))}
      </View>

      {/* Conseils */}
      <Text style={styles.sectionTitle}>Conseils du jour</Text>
      {tips.map((tip, i) => (
        <View key={i} style={styles.tipCard}>
          <View style={styles.tipIconBox}><Text style={{ fontSize: 20 }}>{tip.icon}</Text></View>
          <Text style={styles.tipText}>{tip.text}</Text>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    getAppointmentsAPI()
      .then(res => { if (res.data?.length) setAppointments(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!date || !time) { Alert.alert('Champs requis', 'Veuillez entrer une date et une heure.'); return; }
    setSubmitting(true);
    try {
      await addAppointmentAPI({ date: `${date}T${time}:00`, notes });
      Alert.alert('✅ Demande envoyée', 'Votre rendez-vous est en attente de confirmation.');
      setModalVisible(false); setDate(''); setTime(''); setNotes('');
      setLoading(true); load();
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message || "Impossible d'envoyer la demande.");
    } finally { setSubmitting(false); }
  };

  const STATUS = {
    confirmed: { bg: '#dcfce7', text: '#166534', label: 'Confirmé' },
    pending:   { bg: '#fef9c3', text: '#854d0e', label: 'En attente' },
    done:      { bg: '#f1f5f9', text: '#475569', label: 'Terminé' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Annulé' },
  };

  return (
    <View style={styles.screen}>
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Rendez-vous</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2b6cb0" />
      ) : (
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
                  <Text style={styles.apptDoctor}>
                    {item.medecin_name ? `Dr. ${item.medecin_name}` : 'Médecin assigné'}
                  </Text>
                  <Text style={styles.apptNoteText}>{item.notes || 'Consultation'}</Text>
                  <Text style={styles.apptTime}>🕐 {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>📅 Nouveau rendez-vous</Text>

            <Text style={styles.modalLabel}>Date (AAAA-MM-JJ)</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: 2026-05-15" value={date} onChangeText={setDate} keyboardType="numeric" placeholderTextColor="#a0aec0" />

            <Text style={styles.modalLabel}>Heure (HH:MM)</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: 09:30" value={time} onChangeText={setTime} keyboardType="numeric" placeholderTextColor="#a0aec0" />

            <Text style={styles.modalLabel}>Motif (optionnel)</Text>
            <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Ex: Contrôle annuel..." value={notes} onChangeText={setNotes} multiline placeholderTextColor="#a0aec0" />

            <TouchableOpacity style={[styles.modalSubmitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Envoyer la demande</Text>}
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

// ─── SYMPTOMS ─────────────────────────────────────────────────────────────────
const SymptomsScreen = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  const handleAnswer = async (value) => {
    const q = QUESTIONS[step];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const level = calculateAlertLevel(newAnswers);
      setSending(true);
      try { await addSymptomsAPI({ answers: newAnswers, alert_level: level }); } catch (_) {}
      setSending(false);
      setResult(level);
    }
  };

  const reset = () => { setStep(0); setAnswers({}); setResult(null); };

  if (sending) return (
    <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#2b6cb0" />
      <Text style={{ marginTop: 16, color: '#718096', fontSize: 15 }}>Envoi en cours...</Text>
    </View>
  );

  if (result !== null) {
    const cfg = ALERT_CONFIG[result];
    return (
      <ScrollView contentContainerStyle={[styles.screen, { alignItems: 'center', paddingTop: 40 }]}>
        <View style={[styles.resultCard, { backgroundColor: cfg.bg, borderTopColor: cfg.color }]}>
          <Text style={styles.resultEmoji}>{cfg.icon}</Text>
          <Text style={[styles.resultLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.resultMsg}>{cfg.message}</Text>
          {result === 3 && (
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: cfg.color }]} onPress={() => Alert.alert('Urgence', 'Appelez votre médecin immédiatement.')}>
              <Text style={styles.callBtnText}>📞 Appeler le médecin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetBtnText}>Recommencer l'évaluation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const q = QUESTIONS[step];
  const progress = (step / QUESTIONS.length) * 100;

  return (
    <View style={[styles.screen, { justifyContent: 'center' }]}>
      <Text style={styles.pageTitle}>Mes Symptômes</Text>
      <View style={styles.qCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Question {step + 1} / {QUESTIONS.length}</Text>
          <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.qIcon}>{q.icon}</Text>
        <Text style={styles.qText}>{q.text}</Text>
        <View style={styles.qBtnRow}>
          <TouchableOpacity style={styles.yesBtn} onPress={() => handleAnswer(true)} activeOpacity={0.85}>
            <Text style={styles.yesBtnText}>✅  OUI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.noBtn} onPress={() => handleAnswer(false)} activeOpacity={0.85}>
            <Text style={styles.noBtnText}>❌  NON</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── DEPISTAGE ────────────────────────────────────────────────────────────────
const DepistageScreen = ({ navigation }) => {
  const [records, setRecords] = useState(MOCK_RECORDS);
  useEffect(() => {
    getMyScreeningsAPI().then(res => { if (res.data?.length) setRecords(res.data); }).catch(() => {});
  }, []);

  const RESULT_COLORS = {
    'Normal':               { bg: '#dcfce7', text: '#166534' },
    'Suivi recommandé':     { bg: '#fef9c3', text: '#854d0e' },
    'Consultation urgente': { bg: '#fee2e2', text: '#991b1b' },
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Dépistage</Text>

      <View style={styles.testCard}>
        <View style={styles.testCardTop}>
          <Text style={styles.testCardTitle}>🔍 Test de vision rapide</Text>
          <View style={styles.testCardBadge}><Text style={styles.testCardBadgeText}>2 min</Text></View>
        </View>
        <Text style={styles.testCardDesc}>Évaluez votre acuité visuelle depuis votre téléphone. Placez l'appareil à environ 30 cm de vos yeux.</Text>
        <TouchableOpacity style={styles.startTestBtn} onPress={() => navigation.getParent()?.navigate('Screening')} activeOpacity={0.85}>
          <Text style={styles.startTestText}>Commencer le test  →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Historique</Text>
      {records.map(r => {
        const c = RESULT_COLORS[r.result || r.status] || RESULT_COLORS['Normal'];
        return (
          <View key={r.id} style={styles.historyCard}>
            <View style={styles.historyIconBox}><Text style={{ fontSize: 20 }}>👁</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTest}>Acuité visuelle</Text>
              <Text style={styles.historyDate}>{(r.created_at || '').slice(0, 10)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.historyScore}>{r.score !== undefined ? `${r.score}/${r.total}` : '—'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: c.bg, marginLeft: 0, marginTop: 4 }]}>
                <Text style={[styles.statusText, { color: c.text }]}>{r.result || r.status}</Text>
              </View>
            </View>
          </View>
        );
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
const ProfileScreen = () => {
  const { user, logout } = useAuth();
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Mon Profil</Text>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: '#2b6cb0' }}>{(user?.name || 'P').charAt(0)}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <View style={styles.profileRoleBadge}><Text style={styles.profileRoleText}>👤 Patient</Text></View>
        <View style={styles.divider} />
        {[
          { label: 'Téléphone', value: user?.phone, icon: '📱' },
          { label: 'Email', value: user?.email, icon: '📧' },
          { label: 'Âge', value: user?.age ? `${user.age} ans` : null, icon: '🎂' },
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
const PatientDashboard = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2b6cb0',
      tabBarInactiveTintColor: '#a0aec0',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0', paddingBottom: 8, paddingTop: 4, height: 66 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}
  >
    <Tab.Screen name="Accueil"     component={HomeScreen}        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }} />
    <Tab.Screen name="Rendez-vous" component={AppointmentsScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📅</Text> }} />
    <Tab.Screen name="Symptômes"   component={SymptomsScreen}    options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>😷</Text> }} />
    <Tab.Screen name="Dépistage"   component={DepistageScreen}   options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👁</Text> }} />
    <Tab.Screen name="Profil"      component={ProfileScreen}     options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
  </Tab.Navigator>
);

export default PatientDashboard;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f0f4f8', paddingHorizontal: 16, paddingTop: 52 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: '#718096', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1a365d', letterSpacing: -0.5 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ebf4ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bee3f8' },
  nextCard: { backgroundColor: '#2b6cb0', borderRadius: 18, padding: 20, marginBottom: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextCardLeft: { flex: 1 },
  nextCardLabel: { fontSize: 11, color: '#bee3f8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  nextCardDate: { fontSize: 16, color: '#fff', fontWeight: '700', marginBottom: 4 },
  nextCardTime: { fontSize: 13, color: '#bee3f8', marginBottom: 10 },
  nextCardBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  nextCardBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a365d', marginBottom: 12, marginTop: 4, letterSpacing: -0.3 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#718096', marginTop: 2, fontWeight: '500' },
  tipCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  tipIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ebf4ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tipText: { flex: 1, fontSize: 13, color: '#4a5568', lineHeight: 18 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1a365d', marginBottom: 16, letterSpacing: -0.5 },
  pageTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addBtn: { backgroundColor: '#2b6cb0', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#a0aec0', marginTop: 40, fontSize: 15 },
  apptCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  apptDateBox: { backgroundColor: '#ebf4ff', borderRadius: 10, width: 52, alignItems: 'center', paddingVertical: 10, marginRight: 14 },
  apptDay: { fontSize: 22, fontWeight: '800', color: '#2b6cb0', lineHeight: 24 },
  apptMonth: { fontSize: 10, color: '#4a90d9', fontWeight: '700', marginTop: 2 },
  apptDoctor: { fontSize: 14, fontWeight: '700', color: '#1a365d' },
  apptNoteText: { fontSize: 12, color: '#718096', marginTop: 2 },
  apptTime: { fontSize: 12, color: '#a0aec0', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
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
  qCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: '#a0aec0', fontWeight: '600' },
  progressBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 28 },
  progressFill: { height: '100%', backgroundColor: '#2b6cb0', borderRadius: 3 },
  qIcon: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  qText: { fontSize: 20, fontWeight: '700', color: '#1a365d', textAlign: 'center', lineHeight: 28, marginBottom: 32 },
  qBtnRow: { flexDirection: 'row', gap: 14 },
  yesBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 18, alignItems: 'center', elevation: 2 },
  yesBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  noBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 18, alignItems: 'center', elevation: 2 },
  noBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  resultCard: { borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', borderTopWidth: 5, elevation: 3 },
  resultEmoji: { fontSize: 80, marginBottom: 12 },
  resultLabel: { fontSize: 28, fontWeight: '800', marginBottom: 12, letterSpacing: -0.5 },
  resultMsg: { fontSize: 15, color: '#4a5568', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  callBtn: { width: '100%', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  callBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  resetBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  resetBtnText: { color: '#718096', fontSize: 14, fontWeight: '600' },
  testCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 22, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  testCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  testCardTitle: { fontSize: 17, fontWeight: '800', color: '#1a365d' },
  testCardBadge: { backgroundColor: '#ebf4ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  testCardBadgeText: { color: '#2b6cb0', fontSize: 12, fontWeight: '700' },
  testCardDesc: { fontSize: 13, color: '#718096', lineHeight: 20, marginBottom: 16 },
  startTestBtn: { backgroundColor: '#2b6cb0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  startTestText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  historyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  historyIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ebf4ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyTest: { fontSize: 14, fontWeight: '700', color: '#1a365d' },
  historyDate: { fontSize: 12, color: '#a0aec0', marginTop: 2 },
  historyScore: { fontSize: 16, fontWeight: '800', color: '#2b6cb0' },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ebf4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#bee3f8' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1a365d', marginBottom: 6 },
  profileRoleBadge: { backgroundColor: '#ebf4ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 4 },
  profileRoleText: { color: '#2b6cb0', fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#e2e8f0', width: '100%', marginVertical: 16 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 },
  profileRowLabel: { fontSize: 14, color: '#718096', fontWeight: '500' },
  profileRowValue: { fontSize: 14, color: '#1a365d', fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#dc2626', fontWeight: '800', fontSize: 15 },
});
