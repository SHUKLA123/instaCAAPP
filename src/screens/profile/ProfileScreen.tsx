import React from 'react';
import {Alert, Pressable, Switch, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ScreenContainer} from '@components/ScreenContainer';
import {Avatar} from '@components/Avatar';
import {Card} from '@components/Card';
import {Money} from '@components/Money';
import {useTheme} from '@theme/index';
import {useAuthStore} from '@store/auth';
import {useCaStore} from '@store/ca';
import {casApi} from '@api/cas';
import {consultSocket} from '@ws/socket';
import {ApiError} from '@api/client';
import {CaAvailabilityStatus} from '@api/types';
import {formatRatePerMinute} from '@utils/money';
import {ProfileStackParamList} from '@navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export function ProfileScreen({navigation}: Props): React.JSX.Element {
  const {colors, spacing, radius} = useTheme();
  const user = useAuthStore(s => s.user);
  const wallet = useAuthStore(s => s.wallet);
  const caProfile = useAuthStore(s => s.caProfile);
  const signOut = useAuthStore(s => s.signOut);
  const status = useCaStore(s => s.status);
  const setStatus = useCaStore(s => s.setStatus);
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['ca-dashboard'],
    queryFn: casApi.dashboard,
    enabled: user?.role === 'ca',
  });

  React.useEffect(() => {
    if (dashboardQuery.data) setStatus(dashboardQuery.data.status);
  }, [dashboardQuery.data, setStatus]);

  const toggleAvailability = async (isOnline: boolean) => {
    const next: CaAvailabilityStatus = isOnline ? 'online' : 'offline';
    setStatus(next);
    try {
      await casApi.setAvailability(next);
      consultSocket.send('presence.set', {status: next});
      queryClient.invalidateQueries({queryKey: ['ca-dashboard']});
    } catch (err) {
      setStatus(isOnline ? 'offline' : 'online');
      Alert.alert('Could not update status', err instanceof ApiError ? err.message : 'Please try again.');
    }
  };

  if (!user) return <ScreenContainer>{null}</ScreenContainer>;

  return (
    <ScreenContainer scroll edges={['top', 'left', 'right']}>
      <View style={{alignItems: 'center', marginBottom: spacing.lg}}>
        <Avatar name={user.name ?? user.phone} size={80} />
        <Text style={{fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.sm}}>
          {user.name ?? 'Complete your profile'}
        </Text>
        <Text style={{fontSize: 13, color: colors.textMuted}}>+91 {user.phone}</Text>
      </View>

      {wallet && (
        <Card style={{marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View>
            <Text style={{fontSize: 11, color: colors.textMuted, fontWeight: '600'}}>WALLET BALANCE</Text>
            <Money paise={wallet.balance_paise} size="lg" />
          </View>
        </Card>
      )}

      <MenuRow icon="📁" label="Document vault" onPress={() => navigation.navigate('DocumentVault')} colors={colors} radius={radius} />
      <MenuRow icon="🧾" label="Invoices" onPress={() => navigation.navigate('Invoices')} colors={colors} radius={radius} />
      <MenuRow icon="🪪" label="KYC & PAN" onPress={() => navigation.navigate('Kyc')} colors={colors} radius={radius} />
      <MenuRow icon="⚙️" label="Settings" onPress={() => navigation.navigate('Settings')} colors={colors} radius={radius} />

      {user.role === 'ca' && (
        <View style={{marginTop: spacing.lg}}>
          <Text style={{fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm}}>CA mode</Text>

          <Card style={{marginBottom: spacing.sm}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontSize: 14, fontWeight: '600', color: colors.text}}>Available for consults</Text>
                <Text style={{fontSize: 12, color: colors.textMuted, marginTop: 2}}>
                  {status === 'online' ? 'Clients can reach you now' : status === 'busy' ? 'In a session' : 'Offline'}
                </Text>
              </View>
              <Switch
                value={status === 'online'}
                onValueChange={toggleAvailability}
                disabled={status === 'busy'}
                trackColor={{true: colors.accent, false: colors.border}}
              />
            </View>
          </Card>

          {dashboardQuery.data && (
            <Card style={{marginBottom: spacing.sm}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <StatBlock label="Today's earnings" colors={colors}>
                  <Money paise={dashboardQuery.data.today_earnings_paise} size="md" />
                </StatBlock>
                <StatBlock label="Sessions today" colors={colors}>
                  <Text style={{fontSize: 15, fontWeight: '700', color: colors.text}}>{dashboardQuery.data.today_sessions}</Text>
                </StatBlock>
                <StatBlock label="Rating" colors={colors}>
                  <Text style={{fontSize: 15, fontWeight: '700', color: colors.text}}>
                    {dashboardQuery.data.rating.toFixed(1)} ★
                  </Text>
                </StatBlock>
              </View>
            </Card>
          )}

          {caProfile && (
            <Card style={{marginBottom: spacing.sm}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <StatBlock label="Chat rate (gross)" colors={colors}>
                  <Text style={{fontSize: 14, fontWeight: '700', color: colors.text}}>
                    {formatRatePerMinute(caProfile.chat_rate_gross_paise)}
                  </Text>
                </StatBlock>
                <StatBlock label="Call rate (gross)" colors={colors}>
                  <Text style={{fontSize: 14, fontWeight: '700', color: colors.text}}>
                    {formatRatePerMinute(caProfile.call_rate_gross_paise)}
                  </Text>
                </StatBlock>
              </View>
            </Card>
          )}

          <MenuRow icon="💵" label="Set my rates" onPress={() => navigation.navigate('CaRates')} colors={colors} radius={radius} />
          <MenuRow icon="📊" label="Earnings & payouts" onPress={() => navigation.navigate('CaEarnings')} colors={colors} radius={radius} />
        </View>
      )}

      <Pressable
        onPress={() => Alert.alert('Log out?', undefined, [{text: 'Cancel', style: 'cancel'}, {text: 'Log out', style: 'destructive', onPress: signOut}])}
        style={{marginTop: spacing.xl, marginBottom: spacing.xl, alignItems: 'center'}}>
        <Text style={{color: colors.danger, fontWeight: '700', fontSize: 14}}>Log out</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  colors,
  radius,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  radius: ReturnType<typeof useTheme>['radius'];
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 8,
      }}>
      <Text style={{fontSize: 18, marginRight: 12}}>{icon}</Text>
      <Text style={{flex: 1, fontSize: 14, color: colors.text, fontWeight: '600'}}>{label}</Text>
      <Text style={{color: colors.textFaint}}>›</Text>
    </Pressable>
  );
}

function StatBlock({label, children, colors}: {label: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors']}): React.JSX.Element {
  return (
    <View style={{alignItems: 'center', flex: 1}}>
      <Text style={{fontSize: 10.5, color: colors.textMuted, fontWeight: '600', marginBottom: 3}}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}
