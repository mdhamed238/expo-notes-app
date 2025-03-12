import { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { getNotes, Note } from '@/lib/db';
import { 
  Layout, 
  Text, 
  Card, 
  Icon,
  Spinner,
  Divider
} from '@ui-kitten/components';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
      return () => {};
    }, [])
  );

  const loadNotes = async () => {
    setLoading(true);
    try {
      const loadedNotes = await getNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // UI Kitten Icons for media types
  const ImageIcon = (props: any) => <Icon {...props} name="image-outline" />;
  const DocumentIcon = (props: any) => <Icon {...props} name="file-text-outline" />;
  const NoteIcon = (props: any) => <Icon {...props} name="file-outline" />;


const getMediaIcon = (mediaType?: string | null) => {
  switch (mediaType) {
    case 'image':
      return <ImageIcon size={20} style={styles.mediaIcon} />;
    case 'document':
      return <DocumentIcon size={20} style={styles.mediaIcon} />;
    default:
      return <NoteIcon size={20} style={styles.mediaIcon} />;
  }
};

  const renderNote = ({ item }: { item: Note }) => (
    <Link href={`/note/${item.id}`} asChild>
      <Card style={styles.noteCard} activeOpacity={0.7}>
        <View style={styles.noteHeader}>
          <Text category="h6" style={styles.noteTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {getMediaIcon(item.mediaType)}
        </View>
        <Text appearance="hint" style={styles.notePreview} numberOfLines={2}>
          {item.content}
        </Text>
        <Divider style={styles.divider} />
        <Text appearance="hint" category="c1" style={styles.noteDate}>
          {new Date(item.updatedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <Layout style={styles.loadingContainer}>
        <Spinner size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      {notes.length > 0 ? (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={item => item.id?.toString() ?? ''}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Layout style={styles.emptyContainer}>
          <Icon
            name="file-text-outline"
            fill="#8F9BB3"
            style={styles.emptyIcon}
          />
          <Text category="h6" appearance="hint">
            No notes yet
          </Text>
          <Text appearance="hint" style={styles.emptyText}>
            Tap the "New Note" tab to create your first note
          </Text>
        </Layout>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  noteCard: {
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    flex: 1,
    marginRight: 8,
  },
  mediaIcon: {
    width: 20,
    height: 20,
    tintColor: '#8F9BB3',
  },
  notePreview: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  noteDate: {
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  }
});