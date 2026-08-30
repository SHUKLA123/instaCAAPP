import React, {useState} from 'react';
import {Switch, Text, TextInput, View} from 'react-native';
import {ScreenContainer} from '@components/ScreenContainer';
import {Button} from '@components/Button';
import {useTheme} from '@theme/index';
import {useAuthStore} from '@store/auth';
import {authApi} from '@api/auth';
import {isValidEmail} from '@utils/validation';

export function SettingsScreen(): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const user = useAuthStore(s => s.user);
  const refreshMe = useAuthStore(s => s.refreshMe);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await authApi.updateMe({name: name || undefined, email: email || undefined});
      await refreshMe();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Field label="Full name" value={name} onChange={setName} colors={colors} radius={radius} spacing={spacing} />
      <Field label="Email" value={email} onChange={setEmail} colors={colors} radius={radius} spacing={spacing} keyboardType="email-address" />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}>
        <Text style={{fontSize: 14, color: colors.text, fontWeight: '600'}}>Push notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} trackColor={{true: colors.accent, false: colors.border}} />
      </View>

      <Button
        label="Save changes"
        onPress={save}
        loading={saving}
        disabled={!!email && !isValidEmail(email)}
        fullWidth
        size="lg"
      />
    </ScreenContainer>
  );
}

function Field({
  label,
  value,
  onChange,
  colors,
  radius,
  spacing,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  keyboardType?: 'email-address';
}): React.JSX.Element {
  return (
    <View style={{marginBottom: spacing.md}}>
      <Text style={{fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs}}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textFaint}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          fontSize: 15,
          color: colors.text,
          backgroundColor: colors.bgElevated,
        }}
      />
    </View>
  );
}
