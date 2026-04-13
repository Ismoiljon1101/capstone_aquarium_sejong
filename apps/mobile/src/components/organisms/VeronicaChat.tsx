import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useApi } from '../../hooks/useApi';

interface Msg { role: 'user' | 'veronica'; text: string; ts: Date; }

const WELCOME: Msg = {
  role: 'veronica',
  text: "Hi! I'm Veronica, your AI aquarium advisor powered by YOLO + Ollama. Ask me about your fish health, water quality, pH levels, feeding schedules, or anything about your tank!",
  ts: new Date(),
};

export const VeronicaChat: React.FC = () => {
  const api = useApi();
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.getVoiceSessions()
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          const recent = r.data.slice(0, 3).reverse();
          const history: Msg[] = [];
          recent.forEach((s: any) => {
            history.push({ role: 'user',     text: s.transcribedText, ts: new Date(s.createdAt) });
            history.push({ role: 'veronica', text: s.aiResponse,      ts: new Date(s.createdAt) });
          });
          setMsgs(p => [...p, ...history]);
        }
      })
      .catch(() => null);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMsgs(p => [...p, { role: 'user', text, ts: new Date() }]);
    setLoading(true);
    try {
      const r = await api.voiceQuery(text);
      const reply = r?.data?.response ?? r?.data ?? 'Unable to process right now.';
      setMsgs(p => [...p, { role: 'veronica', text: String(reply), ts: new Date() }]);
    } catch {
      setMsgs(p => [...p, { role: 'veronica', text: 'Connection error. Check if the backend + Ollama are running.', ts: new Date() }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 20, borderCurve: 'continuous',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden', marginTop: 24,
      boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(6,182,212,0.05)',
      }}>
        <View style={{
          width: 38, height: 38, borderRadius: 19, borderCurve: 'continuous',
          backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>🧠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#f1f5f9' }}>Ask Veronica</Text>
          <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>AI Aquarium Advisor · Ollama qwen2.5:3b</Text>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: 'rgba(6,182,212,0.12)', paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 20, borderCurve: 'continuous', borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)',
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22d3ee' }} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#22d3ee' }}>AI Online</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: 280 }}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {msgs.map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            {m.role === 'veronica' && (
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
                <Text style={{ fontSize: 12 }}>🧠</Text>
              </View>
            )}
            <View style={{
              maxWidth: '78%',
              backgroundColor: m.role === 'user' ? '#1d4ed8' : 'rgba(255,255,255,0.07)',
              borderRadius: 18, borderCurve: 'continuous',
              borderTopRightRadius: m.role === 'user' ? 4 : 18,
              borderTopLeftRadius: m.role === 'veronica' ? 4 : 18,
              paddingHorizontal: 14, paddingVertical: 10,
              borderWidth: 1,
              borderColor: m.role === 'user' ? 'rgba(29,78,216,0.5)' : 'rgba(255,255,255,0.07)',
            }}>
              <Text selectable style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 19 }}>{m.text}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#0891b2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ fontSize: 12 }}>🧠</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, borderCurve: 'continuous', borderTopLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
              <ActivityIndicator size="small" color="#22d3ee" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{
          flexDirection: 'row', gap: 10, padding: 14,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        }}>
          <TextInput
            style={{
              flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 14, borderCurve: 'continuous',
              paddingHorizontal: 14, paddingVertical: 10,
              fontSize: 14, color: '#e2e8f0',
            }}
            placeholder="Ask about pH, fish behavior, feeding…"
            placeholderTextColor="#475569"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: input.trim() && !loading ? '#0891b2' : '#1e293b',
              borderRadius: 14, borderCurve: 'continuous',
              paddingHorizontal: 18, justifyContent: 'center',
              borderWidth: 1, borderColor: input.trim() && !loading ? '#0891b2' : 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: input.trim() && !loading ? '#fff' : '#475569' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
