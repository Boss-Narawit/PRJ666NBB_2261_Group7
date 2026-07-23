// Manual mock for react-native-safe-area-context, auto-applied to every test
// suite (node_modules manual mock in <rootDir>/__mocks__). Screens read layout
// insets via useSafeAreaInsets(); without a real <SafeAreaProvider> the actual
// hook throws "No safe area value available", which was failing every screen
// test. Returning fixed zero insets lets the screens render so tests can assert
// real behavior. Written in TS so the frontend lint (@react-native config uses
// @babel/eslint-parser for plain .js, which can't find a Babel config from the
// pre-commit cwd) parses it with the TypeScript parser instead.
import type { ReactNode } from 'react';

const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const frame = { x: 0, y: 0, width: 390, height: 844 };

export const SafeAreaProvider = ({ children }: { children: ReactNode }) =>
  children;
export const SafeAreaView = ({ children }: { children: ReactNode }) => children;
export const SafeAreaConsumer = ({
  children,
}: {
  children: (i: typeof insets) => ReactNode;
}) => children(insets);
export const useSafeAreaInsets = () => insets;
export const useSafeAreaFrame = () => frame;
export const initialWindowMetrics = { insets, frame };
