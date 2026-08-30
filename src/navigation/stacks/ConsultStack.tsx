import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ConsultStackParamList} from '@navigation/types';
import {ConsultListScreen} from '@screens/consult/ConsultListScreen';
import {CaProfileScreen} from '@screens/consult/CaProfileScreen';
import {WaitingForCaScreen} from '@screens/consult/WaitingForCaScreen';
import {LiveConsultScreen} from '@screens/consult/LiveConsultScreen';

const Stack = createNativeStackNavigator<ConsultStackParamList>();

export function ConsultStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShadowVisible: false}}>
      <Stack.Screen name="ConsultList" component={ConsultListScreen} options={{headerShown: false}} />
      <Stack.Screen name="CaProfile" component={CaProfileScreen} options={{title: 'CA Profile'}} />
      <Stack.Screen name="WaitingForCa" component={WaitingForCaScreen} options={{headerShown: false, gestureEnabled: false}} />
      <Stack.Screen name="LiveConsult" component={LiveConsultScreen} options={{headerShown: false, gestureEnabled: false}} />
    </Stack.Navigator>
  );
}
