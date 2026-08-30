import React, {useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Text, TextInput, View} from 'react-native';
import {ScreenContainer} from '@components/ScreenContainer';
import {Button} from '@components/Button';
import {useTheme} from '@theme/index';
import {authApi} from '@api/auth';
import {ApiError} from '@api/client';
import {isValidIndianPhone} from '@utils/validation';
import {RootStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Phone'>;

export function PhoneScreen({navigation}: Props): React.JSX.Element {
  const {colors, spacing, typography, radius} = useTheme();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidIndianPhone(phone);

  const handleContinue = async () => {
    if (!valid) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.requestOtp(phone);
      navigation.navigate('Otp', {requestId: res.request_id, phone});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={{flex: 1, justifyContent: 'center'}}>
        <Text style={{fontSize: 36, marginBottom: spacing.sm}}>🧾</Text>
        <Text style={[typography.display, {color: colors.text, marginBottom: spacing.xxs}]}>InstaCA</Text>
        <Text style={[typography.body, {color: colors.textMuted, marginBottom: spacing.xl}]}>
          Talk to a verified Chartered Accountant in minutes.
        </Text>

        <Text style={[typography.label, {color: colors.textMuted, marginBottom: spacing.xs}]}>MOBILE NUMBER</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.bgElevated,
          }}>
          <Text style={{fontSize: 16, color: colors.textMuted, marginRight: spacing.xs}}>+91</Text>
          <TextInput
            value={phone}
            onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            placeholder="98765 43210"
            placeholderTextColor={colors.textFaint}
            maxLength={10}
            style={{flex: 1, paddingVertical: spacing.sm, fontSize: 16, color: colors.text}}
          />
        </View>
        {error && <Text style={{color: colors.danger, fontSize: 12, marginTop: spacing.xs}}>{error}</Text>}

        <Button
          label="Send OTP"
          onPress={handleContinue}
          loading={loading}
          disabled={!valid}
          fullWidth
          size="lg"
          style={{marginTop: spacing.lg}}
        />

        <Text style={{fontSize: 11.5, color: colors.textFaint, marginTop: spacing.md, textAlign: 'center'}}>
          By continuing, you agree to InstaCA's Terms and Privacy Policy.
        </Text>
      </View>
    </ScreenContainer>
  );
}
