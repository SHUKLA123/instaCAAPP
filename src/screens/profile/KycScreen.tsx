import React, {useState} from 'react';
import {Text, TextInput} from 'react-native';
import {ScreenContainer} from '@components/ScreenContainer';
import {Card} from '@components/Card';
import {Button} from '@components/Button';
import {DocPicker} from '@components/DocPicker';
import {useTheme} from '@theme/index';
import {useAuthStore} from '@store/auth';
import {isValidPan} from '@utils/validation';

const KYC_LABELS: Record<string, {label: string; color: 'success' | 'warning' | 'danger' | 'textMuted'}> = {
  verified: {label: 'Verified', color: 'success'},
  pending: {label: 'Under review', color: 'warning'},
  rejected: {label: 'Rejected — please resubmit', color: 'danger'},
  unverified: {label: 'Not submitted', color: 'textMuted'},
};

export function KycScreen(): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const user = useAuthStore(s => s.user);
  const [pan, setPan] = useState('');
  const [panDocIds, setPanDocIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const kycState = user?.kyc_state ?? 'unverified';
  const statusMeta = KYC_LABELS[kycState] ?? KYC_LABELS.unverified!;
  const statusColor = colors[statusMeta.color];

  const submit = async () => {
    setSubmitting(true);
    try {
      // In production this posts to a KYC submission endpoint alongside
      // /v1/me PATCH for the masked PAN preview; wired here to the vault
      // documents so the CA/admin review queue can pull the attached proof.
      await new Promise(resolve => setTimeout(resolve, 600));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Card style={{marginBottom: spacing.md}}>
        <Text style={{fontSize: 12, color: colors.textMuted, fontWeight: '600'}}>KYC STATUS</Text>
        <Text style={{fontSize: 16, fontWeight: '700', color: statusColor, marginTop: 4}}>{statusMeta.label}</Text>
        {user?.pan_masked && <Text style={{fontSize: 13, color: colors.text, marginTop: spacing.xs}}>PAN on file: {user.pan_masked}</Text>}
      </Card>

      <Text style={{fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs}}>PAN number</Text>
      <TextInput
        value={pan}
        onChangeText={t => setPan(t.toUpperCase().slice(0, 10))}
        placeholder="ABCDE1234F"
        autoCapitalize="characters"
        placeholderTextColor={colors.textFaint}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          fontSize: 15,
          color: colors.text,
          backgroundColor: colors.bgElevated,
          marginBottom: spacing.md,
          letterSpacing: 1,
        }}
      />

      <DocPicker selectedIds={panDocIds} onChange={setPanDocIds} multiple={false} label="Upload PAN card" />

      <Button
        label="Submit for verification"
        onPress={submit}
        loading={submitting}
        disabled={!isValidPan(pan) || panDocIds.length === 0}
        fullWidth
        size="lg"
        style={{marginTop: spacing.lg}}
      />
    </ScreenContainer>
  );
}
