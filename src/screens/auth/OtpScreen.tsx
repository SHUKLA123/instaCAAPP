import React, {useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Text, TextInput, View} from 'react-native';
import {ScreenContainer} from '@components/ScreenContainer';
import {Button} from '@components/Button';
import {useTheme} from '@theme/index';
import {authApi} from '@api/auth';
import {ApiError} from '@api/client';
import {isValidOtp} from '@utils/validation';
import {RootStackParamList} from '@navigation/types';
import {useAuthStore} from '@store/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export function OtpScreen({route}: Props): React.JSX.Element {
  const {requestId, phone} = route.params;
  const {colors, spacing, typography, radius} = useTheme();
  const signIn = useAuthStore(s => s.signIn);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidOtp(code);

  const handleVerify = async () => {
    if (!valid) {
      setError('Enter the 6-digit code sent to your phone.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(requestId, code);
      await signIn({access: res.access, refresh: res.refresh}, res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Incorrect code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={{flex: 1, justifyContent: 'center'}}>
        <Text style={[typography.h1, {color: colors.text, marginBottom: spacing.xxs}]}>Verify your number</Text>
        <Text style={[typography.body, {color: colors.textMuted, marginBottom: spacing.xl}]}>
          Enter the 6-digit code sent to +91 {phone}
        </Text>

        <TextInput
          value={code}
          onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={colors.textFaint}
          style={{
            borderWidth: 1.5,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.bgElevated,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            fontSize: 22,
            letterSpacing: 8,
            color: colors.text,
            textAlign: 'center',
          }}
        />
        {error && <Text style={{color: colors.danger, fontSize: 12, marginTop: spacing.xs}}>{error}</Text>}

        <Button label="Verify & Continue" onPress={handleVerify} loading={loading} disabled={!valid} fullWidth size="lg" style={{marginTop: spacing.lg}} />
      </View>
    </ScreenContainer>
  );
}
