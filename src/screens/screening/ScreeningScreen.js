import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { saveScreeningAPI } from '../../services/api';

const TESTS = [
  {
    id: 1,
    size: 52,
    label: 'Très grande taille',
    letter: 'E',
    options: ['E', 'F', 'P', 'T'],
  },
  {
    id: 2,
    size: 36,
    label: 'Grande taille',
    letter: 'B',
    options: ['R', 'B', 'D', 'P'],
  },
  {
    id: 3,
    size: 24,
    label: 'Taille moyenne',
    letter: 'C',
    options: ['G', 'O', 'C', 'Q'],
  },
  {
    id: 4,
    size: 17,
    label: 'Petite taille',
    letter: 'Z',
    options: ['N', 'Z', 'S', 'W'],
  },
  {
    id: 5,
    size: 13,
    label: 'Très petite taille',
    letter: 'H',
    options: ['M', 'N', 'H', 'K'],
  },
];

const ScreeningScreen = ({ navigation }) => {
  const [phase, setPhase] = useState('intro'); // intro | test | result
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (answer) => {
    const isCorrect = answer === TESTS[current].letter;
    const newScore = isCorrect ? score + 1 : score;
    const newAnswers = [
      ...answers,
      { correct: isCorrect, selected: answer, expected: TESTS[current].letter },
    ];

    if (current + 1 >= TESTS.length) {
      setScore(newScore);
      setAnswers(newAnswers);
      setPhase('result');
      // Envoyer résultat au backend (silencieux si erreur)
      const res = getResultLabel(newScore, TESTS.length);
      saveScreeningAPI({ score: newScore, total: TESTS.length, result: res, details: { answers: newAnswers } })
        .catch(() => {});
    } else {
      setScore(newScore);
      setAnswers(newAnswers);
      setCurrent(current + 1);
    }
  };

  const restart = () => {
    setPhase('intro');
    setCurrent(0);
    setScore(0);
    setAnswers([]);
  };

  const getResultLabel = (s, t) => {
    const pct = s / t;
    if (pct >= 0.8) return 'Normal';
    if (pct >= 0.5) return 'Suivi recommandé';
    return 'Consultation urgente';
  };

  const getResult = () => {
    const pct = score / TESTS.length;
    if (pct >= 0.8)
      return {
        icon: '✅',
        label: 'Vision normale',
        color: '#276749',
        bg: '#c6f6d5',
        advice:
          'Votre acuité visuelle semble normale. Continuez vos contrôles annuels chez un ophtalmologue.',
      };
    if (pct >= 0.5)
      return {
        icon: '⚠️',
        label: 'Suivi recommandé',
        color: '#92400e',
        bg: '#fef3c7',
        advice:
          'Des difficultés ont été détectées. Consultez un ophtalmologue pour un bilan complet.',
      };
    return {
      icon: '🚨',
      label: 'Consultation urgente',
      color: '#9b2c2c',
      bg: '#fed7d7',
      advice:
        'Des problèmes visuels importants ont été détectés. Prenez rendez-vous rapidement chez un spécialiste.',
    };
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <ScrollView contentContainerStyle={styles.introContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.introIconBox}>
          <Text style={{ fontSize: 64 }}>👁️</Text>
        </View>
        <Text style={styles.introTitle}>Test d'Acuité Visuelle</Text>
        <Text style={styles.introDesc}>
          Ce test rapide évalue votre capacité à distinguer des lettres à différentes tailles.
        </Text>

        <View style={styles.infoBox}>
          <InfoRow icon="📋" text="5 niveaux progressifs" />
          <InfoRow icon="⏱️" text="Environ 2 minutes" />
          <InfoRow icon="📏" text="Tenez l'écran à 30 cm de vos yeux" />
          <InfoRow icon="👓" text="Portez vos lunettes si nécessaire" />
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Ce test est indicatif et ne remplace pas un examen médical professionnel.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => setPhase('test')}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Commencer le test</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── TEST ─────────────────────────────────────────────────────────────────
  if (phase === 'test') {
    const test = TESTS[current];
    const progress = ((current + 1) / TESTS.length) * 100;

    return (
      <View style={styles.testContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.testHeader}>
          <Text style={styles.testProgress}>
            {current + 1} / {TESTS.length}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.testLevel}>{test.label}</Text>
        </View>

        <View style={styles.letterBox}>
          <Text style={[styles.testLetter, { fontSize: test.size }]}>{test.letter}</Text>
        </View>

        <Text style={styles.questionText}>Quelle lettre voyez-vous ?</Text>

        <View style={styles.optionsGrid}>
          {test.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.optionBtn}
              onPress={() => handleAnswer(opt)}
              activeOpacity={0.75}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hintText}>Appuyez sur la lettre que vous voyez clairement</Text>
      </View>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────
  const result = getResult();
  return (
    <ScrollView contentContainerStyle={styles.resultContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f8" />

      <View style={[styles.resultHeader, { backgroundColor: result.bg }]}>
        <Text style={{ fontSize: 56 }}>{result.icon}</Text>
        <Text style={[styles.resultLabel, { color: result.color }]}>{result.label}</Text>
        <Text style={[styles.resultScore, { color: result.color }]}>
          {score}/{TESTS.length} bonnes réponses
        </Text>
      </View>

      <View style={styles.adviceCard}>
        <Text style={styles.adviceTitle}>Interprétation</Text>
        <Text style={styles.adviceText}>{result.advice}</Text>
      </View>

      <Text style={styles.detailTitle}>Détail des réponses</Text>
      {answers.map((a, i) => (
        <View key={i} style={styles.answerRow}>
          <View style={styles.answerLeft}>
            <Text style={styles.answerLevel}>Niveau {i + 1}</Text>
            <Text style={styles.answerSublevel}>{TESTS[i].label}</Text>
          </View>
          <Text style={a.correct ? styles.answerOk : styles.answerFail}>
            {a.correct ? '✅ Correct' : `❌ ${a.selected} (attendu : ${a.expected})`}
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.restartBtn} onPress={restart} activeOpacity={0.85}>
        <Text style={styles.restartText}>🔄  Refaire le test</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.goBackBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={styles.goBackText}>← Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const InfoRow = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

export default ScreeningScreen;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Intro
  introContainer: {
    flexGrow: 1,
    backgroundColor: '#f0f4f8',
    padding: 24,
    alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16, paddingVertical: 4 },
  backText: { color: '#2b6cb0', fontSize: 15, fontWeight: '600' },
  introIconBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ebf4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#bee3f8',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 12,
    textAlign: 'center',
  },
  introDesc: {
    fontSize: 15,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { fontSize: 18, marginRight: 12 },
  infoText: { fontSize: 14, color: '#4a5568', fontWeight: '500' },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 24,
  },
  warningText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: '#2b6cb0',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 48,
    shadowColor: '#2b6cb0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  // Test
  testContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  testHeader: { width: '100%', alignItems: 'center', marginBottom: 10 },
  testProgress: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2b6cb0',
    borderRadius: 3,
  },
  testLevel: { fontSize: 13, color: '#a0aec0', fontWeight: '500' },
  letterBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 160,
  },
  testLetter: {
    fontWeight: 'bold',
    color: '#1a365d',
    letterSpacing: 2,
  },
  questionText: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 20,
    fontWeight: '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  optionBtn: {
    width: '44%',
    backgroundColor: '#ebf4ff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bee3f8',
  },
  optionText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2b6cb0',
  },
  hintText: {
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 30,
    textAlign: 'center',
  },
  // Result
  resultContainer: {
    flexGrow: 1,
    backgroundColor: '#f0f4f8',
    paddingBottom: 40,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  resultLabel: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  resultScore: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  adviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 10,
  },
  adviceText: { fontSize: 14, color: '#4a5568', lineHeight: 21 },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  answerRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  answerLeft: {},
  answerLevel: { fontSize: 14, fontWeight: '600', color: '#2d3748' },
  answerSublevel: { fontSize: 11, color: '#a0aec0', marginTop: 2 },
  answerOk: { fontSize: 13, color: '#276749', fontWeight: '600' },
  answerFail: { fontSize: 13, color: '#9b2c2c', fontWeight: '600' },
  restartBtn: {
    backgroundColor: '#2b6cb0',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  restartText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  goBackBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  goBackText: { color: '#4a5568', fontWeight: '600', fontSize: 15 },
});
