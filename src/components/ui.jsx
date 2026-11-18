import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, THEME_MODES } from '../theme.js';
import { useThemed } from '../providers/ThemeProvider.jsx';


const screentone = require('../../assets/textures/screentone.png');
const mascot = require('../../assets/branding/panelpaw-icon.png');

// Hover is web-only; on native only `pressed` is set. Either one turns a control red.
const isHot = ({ pressed, hovered }) => Boolean(pressed || hovered);

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, icon }) {
  const { colors, styles } = useThemed(makeStyles);
  const light = variant === 'primary' || variant === 'danger';
  const inactive = disabled || loading;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} onPress={onPress}
      style={(state) => [styles.button,
        variant === 'primary' && { backgroundColor: colors.ink, borderColor: colors.ink },
        variant === 'secondary' && { backgroundColor: colors.paper, borderColor: colors.ink },
        variant === 'danger' && { backgroundColor: colors.danger, borderColor: colors.danger },
        !inactive && isHot(state) && styles.hot,
        inactive && { opacity: 0.5 }]}>
      {(state) => {
        const fg = !inactive && isHot(state) ? colors.onHighlight : light ? colors.onInk : colors.ink;
        return <>
          {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
        </>;
      }}
    </Pressable>
  );
}

export function IconButton({ name, label, onPress, disabled = false }) {
  const { colors, styles } = useThemed(makeStyles);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, disabled && { opacity: 0.4 }, pressed && { backgroundColor: colors.surface }]}>
    {(state) => <Ionicons name={name} size={21} color={!disabled && isHot(state) ? colors.highlight : colors.ink} />}
  </Pressable>;
}

export function Chip({ label, selected = false, onPress }) {
  const { colors, styles } = useThemed(makeStyles);
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ selected }} aria-pressed={selected}
    onPress={onPress} disabled={!onPress} style={(state) => [styles.chip, selected && styles.chipSelected, onPress && isHot(state) && { borderColor: colors.highlight }]}>
    <Text style={[styles.chipText, selected && { color: colors.paper }]}>{label}</Text>
  </Pressable>;
}

// Comic-panel cover: ink frame on a hard shadow. `lifted` (pass the parent Pressable's
// hovered/pressed state) lifts it off the shadow. `stamp` shows the red 完 (completed) seal,
// and it lands with a bounce when it appears while the cover is already on screen.
export function Cover({ uri, title, width = 108, height = 156, lifted = false, stamp = false }) {
  const { colors, styles } = useThemed(makeStyles);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const reduce = useReducedMotion();
  const lift = useSharedValue(0);
  useEffect(() => { lift.value = reduce ? 0 : withTiming(lifted ? -4 : 0, { duration: 180, easing: Easing.out(Easing.cubic) }); }, [lifted, reduce, lift]);
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lift.value }, { translateY: lift.value }] }));
  const hadStamp = useRef(stamp);
  const stampArrived = stamp && !hadStamp.current;
  useEffect(() => { hadStamp.current = stamp; }, [stamp]);
  return <View style={{ width, height }}>
    <View style={styles.coverShadow} />
    <Animated.View style={[styles.cover, { width, height }, liftStyle]}>
      {uri && !failed ? <Image source={{ uri }} accessibilityLabel={title + ' cover'} resizeMode="cover"
        style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} /> :
        <View style={styles.coverFallback}><Ionicons name="book-outline" size={28} color={colors.muted} />
          <Text numberOfLines={3} style={styles.coverLabel}>{title}</Text></View>}
      {stamp ? <Stamp size={Math.round(Math.min(width, height) * 0.62)} animate={stampArrived} /> : null}
    </Animated.View>
  </View>;
}

function Stamp({ size, animate }) {
  const { colors, styles } = useThemed(makeStyles);
  const reduce = useReducedMotion();
  const play = animate && !reduce;
  const scale = useSharedValue(play ? 2.4 : 1);
  const opacity = useSharedValue(play ? 0 : 1);
  useEffect(() => {
    if (!play) return;
    scale.value = withSpring(1, { damping: 9, stiffness: 170 });
    opacity.value = withTiming(1, { duration: 140 });
  }, [play, scale, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ rotate: '-14deg' }, { scale: scale.value }] }));
  return <Animated.View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
    style={[styles.stamp, { width: size, height: size, borderRadius: size / 2, marginLeft: -size / 2, marginTop: -size / 2, borderWidth: Math.max(3, size * 0.06) }, style]}>
    <Text style={[styles.stampText, { fontSize: size * 0.48, lineHeight: size * 0.6 }]}>完</Text>
  </Animated.View>;
}

// Chapter progress. Animates when the value changes, not on first render.
export function ProgressBar({ value, max }) {
  const { colors, styles } = useThemed(makeStyles);
  const pct = max ? Math.min(100, value / max * 100) : 0;
  const width = useSharedValue(pct);
  useEffect(() => { width.value = withTiming(pct, { duration: 450, easing: Easing.out(Easing.cubic) }); }, [pct, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  // aria-value* is what react-native-web renders; accessibilityValue covers older native paths.
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, ...(max !== null ? { max } : {}), now: value }}
    aria-valuemin={0} aria-valuemax={max ?? undefined} aria-valuenow={value} style={styles.progressTrack}>
    <Animated.View style={[styles.progressFill, fill]} />
  </View>;
}

// Screen wrapper: fades and slides its content in each time the screen gains focus.
export function ScreenEnter({ children }) {
  const reduce = useReducedMotion();
  const opacity = useSharedValue(1);
  const y = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    if (reduce) return;
    opacity.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 260 }));
    y.value = withSequence(withTiming(14, { duration: 0 }), withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) }));
  }, [reduce, opacity, y]));
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}

// Page title set in a comic panel: heavy ink border, hard shadow, screentone strip.
export function PanelTitle({ title }) {
  const { colors, styles } = useThemed(makeStyles);
  return <View style={styles.panelWrap}>
    <View style={styles.panelShadow} />
    <View style={styles.panel}>
      <Image source={screentone} resizeMode="repeat" style={[styles.panelTone, colors.toneTint && { tintColor: colors.toneTint }]} accessible={false} />
      <View style={styles.panelTitleBox}><Text accessibilityRole="header" style={styles.pageTitle}>{title}</Text></View>
    </View>
  </View>;
}

const MODE_ICON = { system: 'contrast-outline', light: 'sunny-outline', dark: 'moon-outline' };
const MODE_LABEL = { system: 'System', light: 'Light', dark: 'Dark' };

// Cycles System -> Light -> Dark. The label names the current mode and the action.
export function ThemeToggle() {
  const { mode, setMode } = useThemed(makeStyles);
  const next = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
  return <IconButton name={MODE_ICON[mode]} label={`Theme: ${MODE_LABEL[mode]}. Switch to ${MODE_LABEL[next]}`} onPress={() => setMode(next)} />;
}

// Manga speed lines radiating from a point (cx, cy) inside the parent. Plain Views, so they render
// the same on web and native. Decorative only.
export function SpeedLines({ cx = '50%', cy = '50%', count = 30, inner = 36, length = 700, opacity = 0.16 }) {
  const { colors } = useThemed(makeStyles);
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
    style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
    {Array.from({ length: count }, (_, i) => <View key={i} style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0, transform: [{ rotate: `${(i * 360) / count}deg` }] }}>
      <View style={{ position: 'absolute', left: -1.5, top: inner + (i % 3) * 14, width: i % 2 ? 2 : 3.5, height: length, backgroundColor: colors.ink, opacity }} />
    </View>)}
  </View>;
}

// Oversized page title in a comic panel, with speed lines behind it. Lines ease in once.
export function Masthead({ eyebrow, title, subtitle }) {
  const { styles } = useThemed(makeStyles);
  const { width } = useWindowDimensions();
  const size = Math.round(Math.min(112, Math.max(52, Math.min(width, 1120) * 0.1)));
  const reduce = useReducedMotion();
  const scale = useSharedValue(reduce ? 1 : 1.14);
  useEffect(() => { if (!reduce) scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }); }, [reduce, scale]);
  const art = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <View style={styles.panelWrap}>
    <View style={styles.panelShadow} />
    <View style={styles.mastheadPanel}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, art]}><SpeedLines cx="86%" cy="48%" /></Animated.View>
      <View style={styles.mastheadBox}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={[styles.mastheadTitle, { fontSize: size, lineHeight: Math.round(size * 1.04), letterSpacing: -size * 0.045 }]}>{title}</Text>
        {subtitle ? <Text style={styles.mastheadSub}>{subtitle}</Text> : null}
      </View>
    </View>
  </View>;
}

// Small solid red label, e.g. POPULAR NOW.
export function Tag({ label }) {
  const { styles } = useThemed(makeStyles);
  return <View style={styles.tag}><Text style={styles.tagText}>{label}</Text></View>;
}

// Empty state art: the cat mascot in a burst of speed lines.
export function EmptyArt({ size = 150 }) {
  const { styles } = useThemed(makeStyles);
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <SpeedLines count={24} inner={size * 0.3} length={size} opacity={0.2} />
    <View style={styles.emptyArtFrame}><Image source={mascot} accessibilityLabel="PanelPaw cat" style={{ width: size * 0.46, height: size * 0.46 }} /></View>
  </View>;
}

// Loading placeholder shaped like a cover. Pulses unless reduce motion is on.
export function SkeletonCover({ width, height }) {
  const { colors, styles } = useThemed(makeStyles);
  const reduce = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(withSequence(withTiming(0.55, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
  }, [reduce, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <View style={{ width, height }} accessible={false}>
    <View style={styles.coverShadow} />
    <Animated.View style={[styles.cover, { width, height, backgroundColor: colors.surface }, style]}>
      <Image source={screentone} resizeMode="repeat" accessible={false} style={[{ width: '100%', height: '100%', opacity: 0.5 }, colors.toneTint && { tintColor: colors.toneTint }]} />
    </Animated.View>
  </View>;
}

export function Notice({ title, message, actionLabel, onAction, tone = 'info' }) {
  const { colors, styles } = useThemed(makeStyles);
  return <View accessibilityLiveRegion="polite" style={[styles.notice, tone === 'error' && { borderLeftColor: colors.danger, backgroundColor: colors.surface }]}>
    <Ionicons name={tone === 'error' ? 'alert-circle-outline' : 'information-circle-outline'} size={21} color={tone === 'error' ? colors.danger : colors.accent} />
    <View style={{ flex: 1, gap: 7 }}><Text style={styles.noticeTitle}>{title}</Text><Text style={styles.body}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}</View>
  </View>;
}

export function SectionHeading({ title, subtitle, action, onAction }) {
  const { colors, styles } = useThemed(makeStyles);
  return <View style={styles.sectionRow}><View style={{ flex: 1, gap: 5 }}>
    <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}</View>
    {action && onAction ? <Button label={action} onPress={onAction} variant="ghost" /> : null}</View>;
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  const { colors, styles } = useThemed(makeStyles);
  return <View style={{ gap: 12 }}>
    {(eyebrow || action) && <View style={styles.pageTop}><Text style={styles.eyebrow}>{eyebrow}</Text>{action}</View>}
    <PanelTitle title={title} />
    {subtitle ? <Text style={styles.body}>{subtitle}</Text> : null}
  </View>;
}

const SHADOW = 5;

const makeStyles = (colors) => StyleSheet.create({
  button: { outlineColor: colors.highlight, minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 2, borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  hot: { backgroundColor: colors.highlight, borderColor: colors.highlight },
  buttonText: { fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold, flexShrink: 1, textAlign: 'center' },
  iconButton: { outlineColor: colors.highlight, minWidth: 44, minHeight: 44, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  chip: { outlineColor: colors.highlight, minHeight: 44, borderRadius: 2, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', backgroundColor: colors.paper },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, lineHeight: 20, color: colors.ink, fontFamily: fonts.medium },
  coverShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: colors.ink, borderRadius: 2 },
  cover: { borderRadius: 2, borderWidth: 2, borderColor: colors.ink, overflow: 'hidden', backgroundColor: colors.surface },
  coverFallback: { flex: 1, padding: 12, justifyContent: 'center', alignItems: 'center', gap: 12 },
  coverLabel: { color: colors.muted, textAlign: 'center', fontFamily: fonts.medium, fontSize: 12 },
  stamp: { position: 'absolute', left: '50%', top: '50%', borderColor: colors.highlight, backgroundColor: colors.stampBack, alignItems: 'center', justifyContent: 'center' },
  stampText: { color: colors.highlight, fontWeight: '900', textAlign: 'center' },
  progressTrack: { height: 8, borderWidth: 1.5, borderColor: colors.ink, borderRadius: 1, marginVertical: 3, overflow: 'hidden', backgroundColor: colors.paper },
  progressFill: { height: '100%', backgroundColor: colors.highlight },
  mastheadPanel: { borderWidth: 3, borderColor: colors.ink, backgroundColor: colors.paper, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18, overflow: 'hidden' },
  mastheadBox: { alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: colors.paper, paddingRight: 14, paddingBottom: 2, gap: 4 },
  mastheadTitle: { fontFamily: fonts.bold, color: colors.ink },
  mastheadSub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.muted, marginTop: 4 },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.highlight, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2, color: colors.onHighlight },
  emptyArtFrame: { padding: 10, borderWidth: 3, borderColor: colors.ink, backgroundColor: colors.paper },
  panelWrap: { marginRight: SHADOW, marginBottom: SHADOW },
  panelShadow: { position: 'absolute', top: SHADOW, left: SHADOW, right: -SHADOW, bottom: -SHADOW, backgroundColor: colors.ink },
  panel: { borderWidth: 3, borderColor: colors.ink, backgroundColor: colors.paper, paddingHorizontal: 18, paddingVertical: 14, overflow: 'hidden' },
  panelTone: { position: 'absolute', top: 0, right: 0, width: '42%', height: '100%', opacity: 0.55 },
  panelTitleBox: { alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: colors.paper, paddingRight: 8 },
  notice: { padding: 16, borderLeftWidth: 3, borderLeftColor: colors.accent, borderRadius: 2, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noticeTitle: { fontSize: 14, fontFamily: fonts.semibold, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.muted },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontFamily: fonts.semibold, letterSpacing: -0.3 },
  pageTop: { minHeight: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.ink, marginBottom: 6 },
  eyebrow: { fontSize: 12, fontFamily: fonts.bold, color: colors.highlight, letterSpacing: 1.2, textTransform: 'uppercase' },
  pageTitle: { fontSize: 34, lineHeight: 40, fontFamily: fonts.bold, letterSpacing: -1, color: colors.ink },
});
