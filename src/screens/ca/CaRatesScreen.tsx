import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';
import {ScreenContainer} from '@components/ScreenContainer';
import {Card} from '@components/Card';
import {Button} from '@components/Button';
import {Money} from '@components/Money';
import {useTheme} from '@theme/index';
import {useAuthStore} from '@store/auth';
import {casApi} from '@api/cas';
import {ApiError} from '@api/client';
import {paiseToRupees, rupeesToPaise} from '@utils/money';

/**
 * The CA enters only the BASE rate — never tax. The gross rate the client
 * will actually be billed is server-computed: `PUT /ca/rates` returns a
 * RateCard with both, and this screen renders that returned gross directly
 * rather than recomputing base × (1 + GST%) itself, since rounding rules,
 * rate floors, or promos can make the server's number differ from a naive
 * client-side recompute. Before the first save, the last-known gross from
 * `/me` (`caProfile.chat_rate_gross_paise` / `call_rate_gross_paise`, also
 * server-computed) is shown instead.
 */
export function CaRatesScreen(): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const caProfile = useAuthStore(s => s.caProfile);
  const applyRateCard = useAuthStore(s => s.applyRateCard);
  const gstRate = caProfile?.gst_rate_percent ?? 18;

  const [chatBaseRupees, setChatBaseRupees] = useState(
    caProfile ? paiseToRupees(caProfile.chat_rate_base_paise).toString() : '',
  );
  const [callBaseRupees, setCallBaseRupees] = useState(
    caProfile ? paiseToRupees(caProfile.call_rate_base_paise).toString() : '',
  );
  const [chatGrossPaise, setChatGrossPaise] = useState(caProfile?.chat_rate_gross_paise ?? 0);
  const [callGrossPaise, setCallGrossPaise] = useState(caProfile?.call_rate_gross_paise ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const rateCard = await casApi.setRates({
        chat_rate_paise: rupeesToPaise(Number(chatBaseRupees) || 0),
        call_rate_paise: rupeesToPaise(Number(callBaseRupees) || 0),
      });
      applyRateCard(rateCard);
      setChatGrossPaise(rateCard.chat_gross_paise);
      setCallGrossPaise(rateCard.call_gross_paise);
      // Reflect back whatever the server actually stored (e.g. if it rounds
      // or floors the base rate) rather than trusting our own input echo.
      setChatBaseRupees(paiseToRupees(rateCard.chat_base_paise).toString());
      setCallBaseRupees(paiseToRupees(rateCard.call_base_paise).toString());
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your rates. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <Text style={{fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 19}}>
        Set your base ₹/min. InstaCA automatically adds GST ({gstRate}%) on top — clients only ever see
        the gross rate below, which updates once you save.
      </Text>

      <RateInput
        label="Chat rate (base ₹/min)"
        value={chatBaseRupees}
        onChange={setChatBaseRupees}
        grossPaise={chatGrossPaise}
        colors={colors}
        radius={radius}
        spacing={spacing}
      />
      <RateInput
        label="Call rate (base ₹/min)"
        value={callBaseRupees}
        onChange={setCallBaseRupees}
        grossPaise={callGrossPaise}
        colors={colors}
        radius={radius}
        spacing={spacing}
      />

      {error && <Text style={{color: colors.danger, fontSize: 12.5, marginBottom: spacing.sm}}>{error}</Text>}
      {saved && <Text style={{color: colors.success, fontSize: 12.5, marginBottom: spacing.sm}}>Rates updated.</Text>}

      <Button label="Save rates" onPress={save} loading={saving} fullWidth size="lg" />
    </ScreenContainer>
  );
}

function RateInput({
  label,
  value,
  onChange,
  grossPaise,
  colors,
  radius,
  spacing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  grossPaise: number;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}): React.JSX.Element {
  return (
    <Card style={{marginBottom: spacing.md}}>
      <Text style={{fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs}}>{label}</Text>
      <View style={{flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md}}>
        <Text style={{fontSize: 16, color: colors.textMuted}}>₹</Text>
        <TextInput
          value={value}
          onChangeText={t => onChange(t.replace(/[^\d.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          style={{flex: 1, paddingVertical: spacing.sm, paddingLeft: spacing.xs, fontSize: 16, color: colors.text}}
        />
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs}}>
        <Text style={{fontSize: 12, color: colors.textMuted}}>Client sees (incl. GST)</Text>
        <Money paise={grossPaise} size="sm" colorOverride={colors.accent} />
      </View>
    </Card>
  );
}
