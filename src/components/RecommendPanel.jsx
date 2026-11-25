import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Cover, Notice, SkeletonCover, Tag } from './ui.jsx';
import { useRecommendations } from '../hooks/useRecommend.js';
import { useEntries } from '../hooks/useTracker.js';
import { useConnection } from '../providers/ConnectionProvider.jsx';
import { useThemed } from '../providers/ThemeProvider.jsx';
import { fonts } from '../theme.js';

// "What to read next" on Discover. Asks the AI first; any problem falls back to similar titles by genre.
// A failure is never shown raw: the worst case is a plain "try again" notice.
export default function RecommendPanel() {
  const { styles } = useThemed(makeStyles);
  const connection = useConnection();
  const entries = useEntries();
  const library = entries.data ?? [];
  const picks = useRecommendations(library);
  if (!connection.isConfigured || library.length === 0) return null;

  const result = picks.data;
  const ai = result?.source === 'ai';
  return <View style={styles.wrap}>
    <View style={styles.head}>
      <Tag label="WHAT TO READ NEXT" />
      {result && result.items.length > 0 && <Text style={styles.meta}>{ai ? 'Picked for you by AI' : 'Similar titles by genre'}</Text>}
    </View>
    {!result && !picks.isPending && !picks.isError && <Text style={styles.meta}>Get five suggestions based on what you have saved.</Text>}
    {picks.isPending && <View accessibilityLabel="Finding your next read" accessibilityLiveRegion="polite" style={styles.row}>
      {[0, 1, 2, 3].map((i) => <SkeletonCover key={i} width={92} height={131} />)}
    </View>}
    {picks.isError && <Notice title="Couldn't find picks right now" message="Please try again in a moment." actionLabel="Try again" onAction={() => picks.mutate()} />}
    {result && result.items.length === 0 && <Notice title="No new picks found" message="Try again later, or browse the catalog below." />}
    {result && result.items.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {result.items.map((manga) => <Pressable key={manga.id} accessibilityRole="button" accessibilityLabel={`View ${manga.title}`}
        onPress={() => router.push(`/title/${manga.id}`)} style={styles.card}>
        {({ pressed, hovered }) => <>
          <Cover uri={manga.imageUrl} title={manga.title} width={92} height={131} lifted={pressed || hovered} />
          <Text numberOfLines={2} style={styles.cardTitle}>{manga.title}</Text>
        </>}
      </Pressable>)}
    </ScrollView>}
    {!picks.isError && <View style={styles.action}>
      <Button label={result ? 'Suggest again' : 'Suggest what to read next'} variant={result ? 'secondary' : 'primary'} icon="sparkles-outline"
        loading={picks.isPending} onPress={() => picks.mutate()} />
    </View>}
  </View>;
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { marginTop: 22, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 14, paddingRight: 8 },
  card: { width: 92, gap: 8 },
  cardTitle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.ink },
  action: { alignItems: 'flex-start' }
});
