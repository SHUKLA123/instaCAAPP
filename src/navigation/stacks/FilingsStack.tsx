import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {FilingsStackParamList} from '@navigation/types';
import {CategoryGridScreen} from '@screens/filings/CategoryGridScreen';
import {ServiceListScreen} from '@screens/filings/ServiceListScreen';
import {ServiceDetailScreen} from '@screens/filings/ServiceDetailScreen';
import {OrderStepsScreen} from '@screens/filings/OrderStepsScreen';
import {OrderPaymentScreen} from '@screens/filings/OrderPaymentScreen';
import {OrderTrackingScreen} from '@screens/filings/OrderTrackingScreen';

const Stack = createNativeStackNavigator<FilingsStackParamList>();

export function FilingsStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShadowVisible: false}}>
      <Stack.Screen name="CategoryGrid" component={CategoryGridScreen} options={{headerShown: false}} />
      <Stack.Screen name="ServiceList" component={ServiceListScreen} options={{title: ''}} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{title: 'Service details'}} />
      <Stack.Screen name="OrderSteps" component={OrderStepsScreen} options={{title: 'Checklist'}} />
      <Stack.Screen name="OrderPayment" component={OrderPaymentScreen} options={{title: 'Payment'}} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{title: 'Order status', headerBackVisible: false}} />
    </Stack.Navigator>
  );
}
