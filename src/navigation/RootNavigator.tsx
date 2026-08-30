import React, {useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '@theme/index';
import {useAuthStore} from '@store/auth';
import {RootStackParamList} from './types';
import {PhoneScreen} from '@screens/auth/PhoneScreen';
import {OtpScreen} from '@screens/auth/OtpScreen';
import {TabNavigator} from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const {colors} = useTheme();
  const status = useAuthStore(s => s.status);
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (status === 'unknown') {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg}}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {status === 'signed_out' ? (
        <>
          <Stack.Screen name="Phone" component={PhoneScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
}
