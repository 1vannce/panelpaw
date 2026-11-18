import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Native only; web has no haptics. Never let a missing motor break a save.
const run = (fn) => { if (Platform.OS !== 'web') { try { void fn().catch(() => {}); } catch { /* ignore */ } } };

export const tick = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const stampThud = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
