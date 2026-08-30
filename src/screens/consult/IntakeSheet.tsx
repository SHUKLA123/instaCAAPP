import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, TextInput, View} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {Sheet} from '@components/Sheet';
import {Button} from '@components/Button';
import {Chip} from '@components/Chip';
import {DocPicker} from '@components/DocPicker';
import {Money} from '@components/Money';
import {useTheme} from '@theme/index';
import {CaProfileFull, ConsultMode, InsufficientBalanceDetails, ServiceCategorySlug} from '@api/types';
import {consultApi} from '@api/consult';
import {ApiError} from '@api/client';
import {formatMoney, formatRatePerMinute} from '@utils/money';
import {minutesToLabel} from '@utils/date';

const CATEGORIES: {slug: ServiceCategorySlug | 'other'; label: string}[] = [
  {slug: 'income_tax', label: 'Income Tax'},
  {slug: 'gst', label: 'GST'},
  {slug: 'roc_mca', label: 'ROC/MCA'},
  {slug: 'audit', label: 'Audit'},
  {slug: 'other', label: 'Other'},
];

interface IntakeSheetProps {
  visible: boolean;
  onClose: () => void;
  ca: CaProfileFull;
  mode: ConsultMode;
  onStarted: (args: {sessionId: string; expiresAt: string}) => void;
  /** Called when the request was blocked by INSUFFICIENT_BALANCE, with the
   * server-reported shortfall so the caller can route to a right-sized
   * recharge rather than the user guessing an amount. */
  onNeedRecharge?: (shortfallPaise: number) => void;
}

export function IntakeSheet({visible, onClose, ca, mode, onStarted, onNeedRecharge}: IntakeSheetProps): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const [queryText, setQueryText] = useState('');
  const [category, setCategory] = useState<ServiceCategorySlug | 'other' | undefined>();
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortfall, setShortfall] = useState<InsufficientBalanceDetails | null>(null);

  const quoteQuery = useQuery({
    queryKey: ['consult-quote', ca.id, mode],
    queryFn: () => consultApi.quote({ca_id: ca.id, mode}),
    enabled: visible,
  });

  useEffect(() => {
    if (!visible) {
      setQueryText('');
      setCategory(undefined);
      setDocumentIds([]);
      setError(null);
      setShortfall(null);
    }
  }, [visible]);

  const submit = async (skip: boolean) => {
    setSubmitting(true);
    setError(null);
    setShortfall(null);
    try {
      const res = await consultApi.createRequest({
        ca_id: ca.id,
        mode,
        intake: skip
          ? undefined
          : {
              query_text: queryText || undefined,
              category: category === 'other' ? undefined : category,
              document_ids: documentIds.length > 0 ? documentIds : undefined,
            },
      });
      onStarted({sessionId: res.session_id, expiresAt: res.expires_at});
    } catch (err) {
      // Branch on the error CODE, never on message text — see
      // docs/ARCHITECTURE.md §3.
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_BALANCE') {
        const details = err.details as InsufficientBalanceDetails | undefined;
        if (details) setShortfall(details);
        setError(err.message);
      } else if (err instanceof ApiError && err.code === 'CA_NOT_AVAILABLE') {
        setError(`${ca.name} just went unavailable. Try another CA or wait a moment and retry.`);
      } else if (err instanceof ApiError && err.code === 'CA_NOT_VERIFIED') {
        setError(`${ca.name} isn't verified for consultations yet.`);
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not start the consult. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const rate = quoteQuery.data?.gross_rate_paise;
  const balance = quoteQuery.data?.wallet_balance_paise;
  const maxMinutes = quoteQuery.data?.max_minutes ?? 0;

  return (
    <Sheet visible={visible} onClose={onClose} title={mode === 'chat' ? 'Start a chat' : 'Start a call'} dismissOnBackdrop={!submitting}>
      {quoteQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{marginVertical: spacing.xl}} />
      ) : (
        <View style={{gap: spacing.md}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: colors.bgSubtle,
              borderRadius: radius.md,
              padding: spacing.md,
            }}>
            <View>
              <Text style={{fontSize: 11, color: colors.textMuted, fontWeight: '600'}}>RATE</Text>
              <Text style={{fontSize: 16, fontWeight: '700', color: colors.text}}>
                {rate !== undefined ? formatRatePerMinute(rate) : '—'}
              </Text>
            </View>
            <View>
              <Text style={{fontSize: 11, color: colors.textMuted, fontWeight: '600'}}>YOUR BALANCE</Text>
              {balance !== undefined ? <Money paise={balance} size="md" /> : <Text>—</Text>}
            </View>
            <View>
              <Text style={{fontSize: 11, color: colors.textMuted, fontWeight: '600'}}>MAX TALK-TIME</Text>
              <Text style={{fontSize: 16, fontWeight: '700', color: colors.accent}}>{minutesToLabel(maxMinutes)}</Text>
            </View>
          </View>

          <View>
            <Text style={{fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs}}>
              What would you like to ask? (optional)
            </Text>
            <TextInput
              value={queryText}
              onChangeText={setQueryText}
              placeholder="e.g. Need help filing GSTR-3B for last quarter"
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.sm,
                minHeight: 72,
                textAlignVertical: 'top',
                color: colors.text,
                fontSize: 14,
                backgroundColor: colors.bgElevated,
              }}
            />
          </View>

          <View>
            <Text style={{fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs}}>
              Category (optional)
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {CATEGORIES.map(c => (
                <Chip key={c.slug} label={c.label} selected={category === c.slug} onPress={() => setCategory(cur => (cur === c.slug ? undefined : c.slug))} />
              ))}
            </View>
          </View>

          <DocPicker selectedIds={documentIds} onChange={setDocumentIds} label="Attach documents (optional)" />

          {error && <Text style={{color: colors.danger, fontSize: 12.5}}>{error}</Text>}

          {shortfall && (
            <View style={{backgroundColor: colors.warningBg, borderRadius: radius.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm}}>
              <Text style={{flex: 1, fontSize: 12.5, color: colors.warning, fontWeight: '600'}}>
                You're {formatMoney(shortfall.shortfall_paise)} short of the {shortfall.min_minutes}-minute minimum.
              </Text>
              <Button
                label={`Recharge ${formatMoney(shortfall.shortfall_paise)}`}
                size="sm"
                variant="secondary"
                onPress={() => onNeedRecharge?.(shortfall.shortfall_paise)}
              />
            </View>
          )}

          <Button label={`Start ${mode === 'chat' ? 'chat' : 'call'}`} onPress={() => submit(false)} loading={submitting} fullWidth size="lg" />
          <Button label="Skip & start now" onPress={() => submit(true)} disabled={submitting} variant="ghost" fullWidth />
        </View>
      )}
    </Sheet>
  );
}
