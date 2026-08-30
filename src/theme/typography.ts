import {TextStyle} from 'react-native';

type TypeScale =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'label'
  | 'mono';

export const typography: Record<TypeScale, TextStyle> = {
  display: {fontSize: 32, fontWeight: '700', lineHeight: 39},
  h1: {fontSize: 26, fontWeight: '700', lineHeight: 32},
  h2: {fontSize: 21, fontWeight: '700', lineHeight: 27},
  h3: {fontSize: 17, fontWeight: '600', lineHeight: 23},
  bodyLg: {fontSize: 16, fontWeight: '400', lineHeight: 22},
  body: {fontSize: 14, fontWeight: '400', lineHeight: 20},
  bodySm: {fontSize: 13, fontWeight: '400', lineHeight: 18},
  caption: {fontSize: 12, fontWeight: '500', lineHeight: 16},
  label: {fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.4},
  mono: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
};
