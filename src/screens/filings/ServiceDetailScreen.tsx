import React, {useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Card} from '@components/Card';
import {Button} from '@components/Button';
import {Money} from '@components/Money';
import {ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {servicesApi, ordersApi} from '@api/services';
import {ApiError} from '@api/client';
import {applyGst} from '@utils/money';
import {FilingsStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<FilingsStackParamList, 'ServiceDetail'>;

const KIND_ICONS: Record<string, string> = {document: '📄', text: '✏️', date: '📅', select: '☑️'};

export function ServiceDetailScreen({route, navigation}: Props): React.JSX.Element {
  const {slug} = route.params;
  const {colors, spacing, radius} = useTheme();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceQuery = useQuery({queryKey: ['service', slug], queryFn: () => servicesApi.getBySlug(slug)});

  if (serviceQuery.isLoading) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} style={{marginTop: spacing.xxl}} />
      </ScreenContainer>
    );
  }

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => serviceQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const service = serviceQuery.data;
  const gstAmount = applyGst(service.price_paise, service.gst_rate_percent) - service.price_paise;
  const total = service.price_paise + gstAmount;

  const startOrder = async () => {
    setStarting(true);
    setError(null);
    try {
      const order = await ordersApi.create({service_id: service.id, answers: []});
      navigation.navigate('OrderSteps', {orderId: order.id});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start this order. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScreenContainer scroll edges={['left', 'right']}>
      <Text style={{fontSize: 21, fontWeight: '700', color: colors.text}}>{service.name}</Text>
      <Text style={{fontSize: 13.5, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20}}>
        {service.long_description}
      </Text>

      <Card style={{marginTop: spacing.md, marginBottom: spacing.md}}>
        <Row label="Base price" value={service.price_paise} colors={colors} />
        <Row label={`GST (${service.gst_rate_percent}%)`} value={gstAmount} colors={colors} />
        <View style={{borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs, paddingTop: spacing.xs}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 15, fontWeight: '700', color: colors.text}}>Total</Text>
            <Money paise={total} size="lg" />
          </View>
        </View>
        <Text style={{fontSize: 12, color: colors.textMuted, marginTop: spacing.sm}}>
          Delivered within {service.sla_days} day{service.sla_days !== 1 ? 's' : ''} of all documents being submitted.
        </Text>
      </Card>

      <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>
        What you'll need to provide
      </Text>
      {service.requirements.map(req => (
        <View
          key={req.key}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.md,
            padding: spacing.sm,
            marginBottom: spacing.xs,
          }}>
          <Text style={{fontSize: 18, marginRight: spacing.xs}}>{KIND_ICONS[req.kind] ?? '•'}</Text>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 13.5, fontWeight: '600', color: colors.text}}>
              {req.label} {req.required ? '' : <Text style={{color: colors.textFaint, fontWeight: '400'}}>(optional)</Text>}
            </Text>
            {req.help_text && <Text style={{fontSize: 12, color: colors.textMuted, marginTop: 2}}>{req.help_text}</Text>}
          </View>
        </View>
      ))}

      {error && <Text style={{color: colors.danger, fontSize: 12.5, marginTop: spacing.sm}}>{error}</Text>}

      <Button label="Start this filing" onPress={startOrder} loading={starting} fullWidth size="lg" style={{marginTop: spacing.lg, marginBottom: spacing.xl}} />
    </ScreenContainer>
  );
}

function Row({label, value, colors}: {label: string; value: number; colors: ReturnType<typeof useTheme>['colors']}): React.JSX.Element {
  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
      <Text style={{fontSize: 13, color: colors.textMuted}}>{label}</Text>
      <Money paise={value} size="sm" />
    </View>
  );
}
