import React from 'react';
import {ActivityIndicator, Linking, Pressable, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Card} from '@components/Card';
import {Timeline, TimelineItem} from '@components/Timeline';
import {ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {ordersApi} from '@api/services';
import {documentsApi} from '@api/documents';
import {OrderState} from '@api/types';
import {FilingsStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<FilingsStackParamList, 'OrderTracking'>;

const STATE_ORDER: OrderState[] = ['paid', 'assigned', 'in_progress', 'awaiting_client', 'delivered', 'completed'];
const STATE_LABELS: Record<OrderState, string> = {
  draft: 'Draft',
  awaiting_payment: 'Awaiting payment',
  paid: 'Payment confirmed',
  assigned: 'Assigned to a CA',
  in_progress: 'In progress',
  awaiting_client: 'Awaiting your input',
  delivered: 'Deliverables ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function OrderTrackingScreen({route}: Props): React.JSX.Element {
  const {orderId} = route.params;
  const {colors, spacing} = useTheme();

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
    refetchInterval: 15000,
  });

  if (orderQuery.isLoading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} style={{marginTop: spacing.xxl}} />
      </ScreenContainer>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => orderQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const order = orderQuery.data;
  const currentIdx = STATE_ORDER.indexOf(order.state);

  const timelineItems: TimelineItem[] = STATE_ORDER.map((state, idx) => {
    const event = order.timeline.find(e => e.state === state);
    return {
      id: state,
      label: STATE_LABELS[state],
      timestamp: event?.created_at,
      note: event?.note,
      state: idx < currentIdx ? 'done' : idx === currentIdx ? 'current' : 'upcoming',
    };
  });

  const openDeliverable = async (documentId: string) => {
    try {
      const {url} = await documentsApi.getDownloadUrl(documentId);
      await Linking.openURL(url);
    } catch {
      // best-effort; a toast/snackbar would surface this in a fuller build
    }
  };

  return (
    <ScreenContainer scroll edges={['left', 'right']}>
      <Text style={{fontSize: 20, fontWeight: '700', color: colors.text}}>{order.service_name}</Text>
      {order.assigned_ca_name && (
        <Text style={{fontSize: 13, color: colors.textMuted, marginTop: 2}}>Handled by {order.assigned_ca_name}</Text>
      )}

      <Card style={{marginTop: spacing.md, marginBottom: spacing.lg}}>
        <Timeline items={timelineItems} />
      </Card>

      {order.deliverables.length > 0 && (
        <View>
          <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>Deliverables</Text>
          {order.deliverables.map(d => (
            <Pressable
              key={d.id}
              onPress={() => openDeliverable(d.document_id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: spacing.sm,
                marginBottom: spacing.xs,
              }}>
              <Text style={{fontSize: 18, marginRight: spacing.xs}}>📥</Text>
              <Text style={{flex: 1, color: colors.text, fontSize: 13.5}}>{d.label}</Text>
              <Text style={{color: colors.primary, fontWeight: '700', fontSize: 12.5}}>Download</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
