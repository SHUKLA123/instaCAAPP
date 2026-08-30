import React, {useEffect, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@theme/index';
import {consultApi} from '@api/consult';
import {consultSocket} from '@ws/socket';
import {useConsultStore} from '@store/consult';
import {Avatar} from '@components/Avatar';
import {Button} from '@components/Button';
import {formatRatePerMinute} from '@utils/money';

const CATEGORY_LABELS: Record<string, string> = {
  income_tax: 'Income Tax',
  gst: 'GST',
  roc_mca: 'ROC/MCA',
  audit: 'Audit',
};

/**
 * Full-screen incoming-request card for role === 'ca'. Mounted once near the
 * root and gated on the consult store's `incomingRequest`, which is populated
 * by the `consult.request` WS event — this is what lets the CA read the
 * client's intake before ever pressing Accept.
 */
export function IncomingRequestScreen(): React.JSX.Element | null {
  const request = useConsultStore(s => s.incomingRequest);
  const clear = useConsultStore(s => s.setIncomingRequest);
  const {colors, spacing, radius} = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!request) return;
    setSecondsLeft(Math.max(0, Math.round((new Date(request.expires_at).getTime() - Date.now()) / 1000)));
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clear(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [request, clear]);

  if (!request) return null;

  const accept = async () => {
    setBusy(true);
    try {
      consultSocket.send('consult.accept', {session_id: request.session_id});
      await consultApi.accept(request.session_id);
    } finally {
      setBusy(false);
      clear(null);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      consultSocket.send('consult.reject', {session_id: request.session_id});
      await consultApi.reject(request.session_id);
    } finally {
      setBusy(false);
      clear(null);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={[styles.backdrop, {backgroundColor: colors.overlay}]}>
        <View style={[styles.card, {backgroundColor: colors.bgElevated, borderRadius: radius.xl}]}>
          <View style={styles.centerCol}>
            <Avatar uri={request.client_avatar_url} name={request.client_name} size={80} />
            <Text style={{fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.sm}}>
              {request.client_name}
            </Text>
            <Text style={{fontSize: 13, color: colors.textMuted, marginTop: 2}}>
              wants a {request.mode === 'chat' ? 'chat' : 'call'} · {formatRatePerMinute(request.gross_rate_paise)}
            </Text>
          </View>

          <ScrollView style={{maxHeight: 220, marginTop: spacing.md}}>
            {request.intake?.category && (
              <Tag label={CATEGORY_LABELS[request.intake.category] ?? request.intake.category} colors={colors} radius={radius} />
            )}
            {request.intake?.query_text ? (
              <View style={{backgroundColor: colors.bgSubtle, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm}}>
                <Text style={{fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4}}>QUERY</Text>
                <Text style={{fontSize: 13.5, color: colors.text, lineHeight: 19}}>{request.intake.query_text}</Text>
              </View>
            ) : (
              <Text style={{fontSize: 12.5, color: colors.textFaint, marginTop: spacing.sm, fontStyle: 'italic'}}>
                No query text provided.
              </Text>
            )}
            {request.intake?.document_ids && request.intake.document_ids.length > 0 && (
              <View style={{marginTop: spacing.sm}}>
                <Text style={{fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4}}>
                  {request.intake.document_ids.length} DOCUMENT(S) ATTACHED
                </Text>
                {request.intake.document_ids.map(docId => (
                  <Text key={docId} style={{fontSize: 12.5, color: colors.text, marginBottom: 2}}>
                    📎 Document {docId.slice(0, 8)}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>

          <Text style={{textAlign: 'center', fontSize: 12, color: colors.textFaint, marginTop: spacing.sm}}>
            Auto-declines in {secondsLeft}s
          </Text>

          <View style={{flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md}}>
            <Button label="Decline" variant="outline" onPress={reject} disabled={busy} style={{flex: 1}} />
            <Button label="Accept" onPress={accept} disabled={busy} loading={busy} style={{flex: 1}} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Tag({label, colors, radius}: {label: string; colors: ReturnType<typeof useTheme>['colors']; radius: ReturnType<typeof useTheme>['radius']}): React.JSX.Element {
  return (
    <View style={{alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4}}>
      <Text style={{color: colors.onPrimary, fontSize: 11.5, fontWeight: '700'}}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20},
  card: {width: '100%', maxWidth: 420, padding: 20},
  centerCol: {alignItems: 'center'},
});
