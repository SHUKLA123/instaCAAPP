import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ChatsStackParamList} from '@navigation/types';
import {ChatsListScreen} from '@screens/chats/ChatsListScreen';
import {LiveConsultScreen} from '@screens/consult/LiveConsultScreen';

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export function ChatsStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShadowVisible: false}}>
      <Stack.Screen name="ChatsList" component={ChatsListScreen} options={{headerShown: false}} />
      <Stack.Screen name="LiveConsult" component={LiveConsultScreen} options={{headerShown: false, gestureEnabled: false}} />
    </Stack.Navigator>
  );
}
