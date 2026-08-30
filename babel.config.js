module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.js', '.json'],
        alias: {
          '@api': './src/api',
          '@config': './src/config',
          '@ws': './src/ws',
          '@store': './src/store',
          '@navigation': './src/navigation',
          '@screens': './src/screens',
          '@components': './src/components',
          '@theme': './src/theme',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
