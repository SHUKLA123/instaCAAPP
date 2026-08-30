import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {StepProgress} from '@components/StepProgress';
import {Button} from '@components/Button';
import {Chip} from '@components/Chip';
import {DocPicker} from '@components/DocPicker';
import {ErrorState} from '@components/EmptyState';
import {useTheme} from '@theme/index';
import {ordersApi} from '@api/services';
import {OrderAnswer, OrderRequirementAnswer} from '@api/types';
import {ApiError} from '@api/client';
import {FilingsStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<FilingsStackParamList, 'OrderSteps'>;

interface LocalAnswer {
  text_value?: string;
  document_id?: string;
}

export function OrderStepsScreen({route, navigation}: Props): React.JSX.Element {
  const {orderId} = route.params;
  const {colors, spacing} = useTheme();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderQuery = useQuery({queryKey: ['order', orderId], queryFn: () => ordersApi.getById(orderId)});

  const requirements = orderQuery.data?.requirements ?? [];

  useEffect(() => {
    if (!orderQuery.data) return;
    const seeded: Record<string, LocalAnswer> = {};
    orderQuery.data.requirements.forEach(r => {
      seeded[r.key] = {text_value: r.text_value, document_id: r.document_id};
    });
    setAnswers(seeded);
  }, [orderQuery.data]);

  const filledCount = useMemo(
    () => requirements.filter(r => isFilled(answers[r.key], r)).length,
    [requirements, answers],
  );

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

  const current: OrderRequirementAnswer | undefined = requirements[index];
  const allRequiredFilled = requirements.every(r => !r.required || isFilled(answers[r.key], r));

  const persistAnswer = async (key: string, value: LocalAnswer) => {
    setSaving(true);
    setError(null);
    try {
      const payload: OrderAnswer = {key, text_value: value.text_value, document_id: value.document_id};
      await ordersApi.updateRequirements(orderId, [payload]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this step. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (current) {
      await persistAnswer(current.key, answers[current.key] ?? {});
    }
    if (index < requirements.length - 1) {
      setIndex(index + 1);
    }
  };

  const goBack = () => setIndex(i => Math.max(0, i - 1));

  const proceedToPayment = () => {
    navigation.navigate('OrderPayment', {orderId});
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <StepProgress current={filledCount} total={requirements.length} label={`Checklist (${filledCount}/${requirements.length})`} />

      {current ? (
        <View style={{marginTop: spacing.lg, flex: 1}}>
          <Text style={{fontSize: 18, fontWeight: '700', color: colors.text}}>
            {current.label} {current.required ? '' : <Text style={{color: colors.textFaint, fontSize: 13, fontWeight: '400'}}>(optional)</Text>}
          </Text>

          <View style={{marginTop: spacing.md, flex: 1}}>
            <StepInput
              requirement={current}
              value={answers[current.key] ?? {}}
              onChange={value => setAnswers(a => ({...a, [current.key]: value}))}
            />
          </View>

          {error && <Text style={{color: colors.danger, fontSize: 12.5, marginBottom: spacing.sm}}>{error}</Text>}

          <View style={{flexDirection: 'row', gap: spacing.sm}}>
            {index > 0 && <Button label="Back" variant="outline" onPress={goBack} style={{flex: 1}} />}
            <Button
              label={index === requirements.length - 1 ? 'Done' : 'Next'}
              onPress={goNext}
              loading={saving}
              style={{flex: 1}}
            />
          </View>
        </View>
      ) : (
        <Text style={{color: colors.textMuted, marginTop: spacing.xl}}>This service has no checklist items.</Text>
      )}

      <View style={{marginTop: spacing.lg, marginBottom: spacing.lg}}>
        <Button
          label={allRequiredFilled ? 'Continue to payment' : `Fill all required items to continue`}
          onPress={proceedToPayment}
          disabled={!allRequiredFilled}
          fullWidth
          size="lg"
        />
      </View>
    </ScreenContainer>
  );
}

function isFilled(value: LocalAnswer | undefined, req: OrderRequirementAnswer): boolean {
  if (!value) return false;
  if (req.kind === 'document') return !!value.document_id;
  return !!value.text_value && value.text_value.trim().length > 0;
}

function StepInput({
  requirement,
  value,
  onChange,
}: {
  requirement: OrderRequirementAnswer;
  value: LocalAnswer;
  onChange: (value: LocalAnswer) => void;
}): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();

  if (requirement.kind === 'document') {
    return (
      <DocPicker
        selectedIds={value.document_id ? [value.document_id] : []}
        onChange={ids => onChange({document_id: ids[0]})}
        multiple={false}
      />
    );
  }

  if (requirement.kind === 'date') {
    return (
      <TextInput
        value={value.text_value ?? ''}
        onChangeText={text => onChange({text_value: text})}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textFaint}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          color: colors.text,
          fontSize: 15,
          backgroundColor: colors.bgElevated,
        }}
      />
    );
  }

  if (requirement.kind === 'select') {
    return (
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {(requirement.options ?? []).map(opt => (
          <Chip key={opt} label={opt} selected={value.text_value === opt} onPress={() => onChange({text_value: opt})} />
        ))}
      </View>
    );
  }

  return (
    <TextInput
      value={value.text_value ?? ''}
      onChangeText={text => onChange({text_value: text})}
      placeholder={requirement.help_text ?? 'Type your answer'}
      placeholderTextColor={colors.textFaint}
      multiline
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        minHeight: 100,
        textAlignVertical: 'top',
        color: colors.text,
        fontSize: 15,
        backgroundColor: colors.bgElevated,
      }}
    />
  );
}
