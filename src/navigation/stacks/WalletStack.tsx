import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {WalletStackParamList} from '@navigation/types';
import {WalletScreen} from '@screens/wallet/WalletScreen';
import {RechargeScreen} from '@screens/wallet/RechargeScreen';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export function WalletStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShadowVisible: false}}>
      <Stack.Screen name="WalletHome" component={WalletScreen} options={{headerShown: false}} />
      <Stack.Screen name="Recharge" component={RechargeScreen} options={{title: 'Recharge'}} />
    </Stack.Navigator>
  );
}
