import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ProfileStackParamList} from '@navigation/types';
import {ProfileScreen} from '@screens/profile/ProfileScreen';
import {DocumentVaultScreen} from '@screens/profile/DocumentVaultScreen';
import {InvoicesScreen} from '@screens/profile/InvoicesScreen';
import {KycScreen} from '@screens/profile/KycScreen';
import {SettingsScreen} from '@screens/profile/SettingsScreen';
import {CaRatesScreen} from '@screens/ca/CaRatesScreen';
import {CaEarningsScreen} from '@screens/ca/CaEarningsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShadowVisible: false}}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{headerShown: false}} />
      <Stack.Screen name="DocumentVault" component={DocumentVaultScreen} options={{title: 'Document vault'}} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} options={{title: 'Invoices'}} />
      <Stack.Screen name="Kyc" component={KycScreen} options={{title: 'KYC & PAN'}} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
      <Stack.Screen name="CaRates" component={CaRatesScreen} options={{title: 'My rates'}} />
      <Stack.Screen name="CaEarnings" component={CaEarningsScreen} options={{title: 'Earnings'}} />
    </Stack.Navigator>
  );
}
