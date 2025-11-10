import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { webdavService } from '@/services';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WebDAVSetupScreen() {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const handleConnect = async () => {
    if (!url.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await webdavService.initialize(url.trim(), username.trim(), password.trim());
      
      Alert.alert(
        'Connection Successful',
        'WebDAV connection established. Would you like to sync now?',
        [
          { text: 'Later', onPress: () => router.back() },
          {
            text: 'Sync Now',
            onPress: async () => {
              const result = await webdavService.sync();
              Alert.alert(
                result.success ? 'Sync Complete' : 'Sync Failed',
                result.message,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Failed to connect to WebDAV server'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle" style={styles.title}>
              WebDAV / Nextcloud Setup
            </ThemedText>
            <ThemedText style={[styles.description, { color: colors.subtitle }]}>
              Connect to your Nextcloud or WebDAV server to sync your tasks across devices.
            </ThemedText>

            <ThemedView style={styles.form}>
              <ThemedText style={styles.label}>Server URL</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }]}
                placeholder="https://cloud.example.com"
                placeholderTextColor={colors.placeholder}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <ThemedText style={[styles.hint, { color: colors.subtitle }]}>
                For Nextcloud: https://your-domain.com
              </ThemedText>

              <ThemedText style={styles.label}>Username</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }]}
                placeholder="your-username"
                placeholderTextColor={colors.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={styles.label}>Password / App Password</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }]}
                placeholder="password"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ThemedText style={[styles.hint, { color: colors.subtitle }]}>
                For Nextcloud, it's recommended to use an app password
              </ThemedText>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleConnect}
                disabled={loading}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? 'Connecting...' : 'Connect'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: -8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
