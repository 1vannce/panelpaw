import assert from 'node:assert/strict';
import test from 'node:test';
import { darkColors, isThemeMode, lightColors, paletteFor, resolveScheme } from '../src/theme.js';

test('an explicit mode wins over the system scheme', () => {
  assert.equal(resolveScheme('light', 'dark'), 'light');
  assert.equal(resolveScheme('dark', 'light'), 'dark');
});

test('system mode follows the device and defaults to light', () => {
  assert.equal(resolveScheme('system', 'dark'), 'dark');
  assert.equal(resolveScheme('system', 'light'), 'light');
  assert.equal(resolveScheme('system', null), 'light');
  assert.equal(resolveScheme('system', undefined), 'light');
});

test('only known modes are accepted', () => {
  assert.ok(['system', 'light', 'dark'].every(isThemeMode));
  assert.equal(isThemeMode('sepia'), false);
  assert.equal(isThemeMode(null), false);
});

test('both palettes define the same tokens', () => {
  assert.deepEqual(Object.keys(darkColors).sort(), Object.keys(lightColors).sort());
  assert.equal(paletteFor('dark'), darkColors);
  assert.equal(paletteFor('light'), lightColors);
});

// WCAG contrast for the red text on its own background.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

test('red and muted text meet 4.5:1 on the page background in both schemes', () => {
  for (const palette of [lightColors, darkColors]) {
    assert.ok(contrast(palette.highlight, palette.background) >= 4.5, 'highlight');
    assert.ok(contrast(palette.muted, palette.background) >= 4.5, 'muted');
    assert.ok(contrast(palette.onHighlight, palette.highlight) >= 4.5, 'onHighlight');
    assert.ok(contrast(palette.onInk, palette.ink) >= 4.5, 'onInk');
  }
});
