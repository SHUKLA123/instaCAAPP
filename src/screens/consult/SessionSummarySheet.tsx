import React, {useState} from 'react';
import {Text, View} from 'react-native';
import {Sheet} from '@components/Sheet';
import {Button} from '@components/Button';
import {Money} from '@components/Money';
import {RatingStars} from '@components/RatingStars';
import {useTheme} from '@theme/index';
import {ConsultEndedSummary} from '@ws/events';
import {consultApi} from '@api/consult';
import {minutesToLabel} from '@utils/date';

interface SessionSummarySheetProps {
  visible: boolean;
  sessionId: string;
  reason: string;
  summary: ConsultEndedSummary;
  onDone: () => void;
}

const REASON_LABELS: Record<string, string> = {
  client_ended: 'You ended the session',
  ca_ended: 'The CA ended the session',
  client_cancelled: 'Cancelled',
  insufficient_balance: 'Ended — balance ran out',
  disconnect: 'Ended — connection lost',
};

export function SessionSummarySheet({visible, sessionId, reason, summary, onDone}: SessionSummarySheetProps): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitReview = async () => {
    if (rating === 0) {
      onDone();
      return;
    }
    setSubmitting(true);
    try {
      await consultApi.review(sessionId, {rating, comment: comment || undefined});
      setSubmitted(true);
      setTimeout(onDone, 900);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onDone} title="Session ended" dismissOnBackdrop={false}>
      <Text style={{fontSize: 13, color: colors.textMuted, marginBottom: spacing.md}}>
        {REASON_LABELS[reason] ?? reason}
      </Text>

      <View style={{backgroundColor: colors.bgSubtle, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md}}>
        <SummaryRow label="Duration" value={minutesToLabel(summary.minutes)} colors={colors} />
        <SummaryRow label="Base fee" value={summary.tax_breakup.base_paise} colors={colors} isMoney />
        {summary.tax_breakup.cgst_paise > 0 && <SummaryRow label="CGST" value={summary.tax_breakup.cgst_paise} colors={colors} isMoney />}
        {summary.tax_breakup.sgst_paise > 0 && <SummaryRow label="SGST" value={summary.tax_breakup.sgst_paise} colors={colors} isMoney />}
        {summary.tax_breakup.igst_paise > 0 && <SummaryRow label="IGST" value={summary.tax_breakup.igst_paise} colors={colors} isMoney />}
        <View style={{borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs, paddingTop: spacing.xs}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 14, fontWeight: '700', color: colors.text}}>Total charged</Text>
            <Money paise={summary.total_paise} size="md" />
          </View>
        </View>
      </View>

      {submitted ? (
        <Text style={{textAlign: 'center', color: colors.success, fontWeight: '600'}}>Thanks for your feedback!</Text>
      ) : (
        <View style={{alignItems: 'center', gap: spacing.sm}}>
          <Text style={{fontSize: 14, fontWeight: '600', color: colors.text}}>How was your consultation?</Text>
          <RatingStars rating={rating} editable size={30} onChange={setRating} />
          <Button label={rating > 0 ? 'Submit rating' : 'Skip'} onPress={submitReview} loading={submitting} fullWidth />
        </View>
      )}
    </Sheet>
  );
}

function SummaryRow({label, value, colors, isMoney}: {label: string; value: string | number; colors: ReturnType<typeof useTheme>['colors']; isMoney?: boolean}): React.JSX.Element {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3}}>
      <Text style={{fontSize: 12.5, color: colors.textMuted}}>{label}</Text>
      {isMoney && typeof value === 'number' ? (
        <Money paise={value} size="sm" />
      ) : (
        <Text style={{fontSize: 12.5, color: colors.text, fontWeight: '600'}}>{value}</Text>
      )}
    </View>
  );
}
