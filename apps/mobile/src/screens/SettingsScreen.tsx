import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Linking } from 'react-native';

const VERSION = '1.0.0';

function Row({ icon, label, right }: { icon: string; label: string; right?: React.ReactNode }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    }}>
      <Text style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 14, color: '#cbd5e1', fontWeight: '500' }}>{label}</Text>
      {right}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [tts, setTts]       = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [darkMode]          = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        <Text style={{ fontSize: 26, fontWeight: '900', color: '#f1f5f9', letterSpacing: -0.8, marginBottom: 22 }}>Settings</Text>

        <Section title="Connection">
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
            <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 6 }}>Backend URL</Text>
            <TextInput
              value={apiUrl}
              onChangeText={setApiUrl}
              style={{
                backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
                fontSize: 13, color: '#e2e8f0', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
              }}
              placeholder="http://localhost:3000"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Row icon="📡" label="Socket.IO"   right={<Text style={{ fontSize: 12, color: '#34d399', fontWeight: '700' }}>Connected</Text>} />
          <Row icon="🤖" label="Ollama (LLM)" right={<Text style={{ fontSize: 12, color: '#34d399', fontWeight: '700' }}>qwen2.5:3b</Text>} />
        </Section>

        <Section title="Veronica AI">
          <Row icon="🔊" label="Text-to-Speech"   right={<Switch value={tts}    onValueChange={setTts}    trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />} />
          <Row icon="🔔" label="Alert Sound"      right={<Switch value={alerts} onValueChange={setAlerts} trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />} />
          <Row icon="🌐" label="STT Language"     right={<Text style={{ fontSize: 12, color: '#64748b' }}>English (US)</Text>} />
        </Section>

        <Section title="Display">
          <Row icon="🌙" label="Dark Mode"     right={<Switch value={darkMode} trackColor={{ true: '#0891b2', false: '#1e293b' }} thumbColor="#fff" />} />
          <Row icon="📊" label="Chart Range"   right={<Text style={{ fontSize: 12, color: '#64748b' }}>24h</Text>} />
        </Section>

        <Section title="Tank">
          <Row icon="🧪" label="pH Safe Range"        right={<Text style={{ fontSize: 12, color: '#64748b' }}>6.8 – 7.5</Text>} />
          <Row icon="🌡️" label="Temp Safe Range"     right={<Text style={{ fontSize: 12, color: '#64748b' }}>24 – 28 °C</Text>} />
          <Row icon="💨" label="DO₂ Safe Range"       right={<Text style={{ fontSize: 12, color: '#64748b' }}>6 – 9 mg/L</Text>} />
          <Row icon="☁️" label="CO₂ Max"              right={<Text style={{ fontSize: 12, color: '#64748b' }}>40 ppm</Text>} />
        </Section>

        <Section title="About">
          <Row icon="🐠" label="Fishlinic Mobile"  right={<Text style={{ fontSize: 12, color: '#475569' }}>v{VERSION}</Text>} />
          <Row icon="🎓" label="Capstone Project"  right={<Text style={{ fontSize: 12, color: '#475569' }}>Sejong Uni</Text>} />
          <TouchableOpacity onPress={() => Linking.openURL('http://localhost:3000')}>
            <Row icon="🌐" label="Open Dashboard"  right={<Text style={{ fontSize: 18 }}>›</Text>} />
          </TouchableOpacity>
        </Section>

      </ScrollView>
    </View>
  );
}
