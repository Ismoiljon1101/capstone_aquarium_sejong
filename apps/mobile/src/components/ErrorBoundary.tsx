import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.container}>
        <Text style={s.emoji}>🐟</Text>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.message}>{this.state.error?.message}</Text>
        <TouchableOpacity style={s.btn} onPress={this.reset}>
          <Text style={s.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  message: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#0ea5e9', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '600' },
});
