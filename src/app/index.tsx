import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Google OAuth Handler
  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      const redirectUrl = AuthSession.makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          // Extract session params from URL
          const params = new URLSearchParams(result.url.split('#')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;
            setUser(sessionData.user);
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      setUser(data.user);
    }
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>L'Atelier Scent Store</Text>

      {user ? (
        <View style={styles.loggedInBox}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.emailText}>{user.email}</Text>
          
          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.subTitle}>Sign In to Your Account</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.googleButton]} 
            onPress={handleGoogleSignIn} 
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#1A1A1A',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    height: 50,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  button: {
    backgroundColor: '#000000',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 16,
  },
  loggedInBox: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
});
