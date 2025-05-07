import { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { FileText, Mic, Image as ImageIcon, File } from 'lucide-react-native';
import { searchNotes, Note } from '@/lib/db';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim()) {
      const searchResults = await searchNotes(text);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  };

  const getMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'audio':
        return <Mic size={20} color="#6b7280" />;
      case 'image':
        return <ImageIcon size={20} color="#6b7280" />;
      case 'document':
        return <File size={20} color="#6b7280" />;
      default:
        return <FileText size={20} color="#6b7280" />;
    }
  };

  const renderNote = ({ item }: { item: Note }) => (
    <Link href={`/note/${item.id}`} asChild>
      <TouchableOpacity style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle}>{item.title}</Text>
          {getMediaIcon(item.mediaType as any)}
        </View>
        <Text style={styles.notePreview} numberOfLines={2}>
          {item.content}
        </Text>
        {item.category && (
          <View style={styles.categoryContainer}>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search notes..."
        value={query}
        onChangeText={handleSearch}
      />
      <FlatList
        data={results}
        renderItem={renderNote}
        keyExtractor={item => item.id?.toString() ?? ''}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  notePreview: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  categoryContainer: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  category: {
    fontSize: 12,
    color: '#4b5563',
  },
});