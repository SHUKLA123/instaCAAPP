import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from '@theme/index';
import {TabParamList} from './types';
import {ConsultStack} from './stacks/ConsultStack';
import {FilingsStack} from './stacks/FilingsStack';
import {ChatsStack} from './stacks/ChatsStack';
import {WalletStack} from './stacks/WalletStack';
import {ProfileStack} from './stacks/ProfileStack';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  ConsultTab: '🩺',
  FilingsTab: '🗂️',
  ChatsTab: '💬',
  WalletTab: '👛',
  ProfileTab: '👤',
};

export function TabNavigator(): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {backgroundColor: colors.bgElevated, borderTopColor: colors.border},
        tabBarIcon: ({color}) => <Text style={{fontSize: 20, color}}>{ICONS[route.name]}</Text>,
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
      })}>
      <Tab.Screen name="ConsultTab" component={ConsultStack} options={{title: 'Consult'}} />
      <Tab.Screen name="FilingsTab" component={FilingsStack} options={{title: 'Filings'}} />
      <Tab.Screen name="ChatsTab" component={ChatsStack} options={{title: 'Chats'}} />
      <Tab.Screen name="WalletTab" component={WalletStack} options={{title: 'Wallet'}} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{title: 'Profile'}} />
    </Tab.Navigator>
  );
}
