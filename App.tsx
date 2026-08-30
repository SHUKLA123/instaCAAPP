/**
 * InstaCA — on-demand CA consultation marketplace.
 * See docs/ARCHITECTURE.md for the API contract this app implements.
 */
import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider, useTheme} from '@theme/index';
import {RootNavigator} from '@navigation/RootNavigator';
import {useConsultSocket} from '@hooks/useConsultSocket';
import {useAuthStore} from '@store/auth';
import {IncomingRequestScreen} from '@screens/ca/IncomingRequestScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15000,
    },
  },
});

function AppShell(): React.JSX.Element {
  const {isDark, colors} = useTheme();
  const role = useAuthStore(s => s.user?.role);
  useConsultSocket();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <RootNavigator />
      {role === 'ca' && <IncomingRequestScreen />}
    </>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NavigationContainer>
            <AppShell />
          </NavigationContainer>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
