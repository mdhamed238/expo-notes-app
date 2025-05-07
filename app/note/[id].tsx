import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Image as RNImage } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Note, deleteNote, getNotes, updateNote } from '@/lib/db';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Layout,
  Text,
  Button,
  Icon,
  Card,
  Modal,
  Divider,
  Input,
} from '@ui-kitten/components';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const [note, setNote] = useState<Note>();
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadNote();
  }, []);

  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  }, [note]);

  const loadNote = async () => {
    try {
      // Get all notes and find the one with matching ID
      const notes = await getNotes();
      const foundNote = notes.find((n) => n.id === Number(id));
      if (foundNote) {
        setNote(foundNote);
      } else {
        console.error('Note not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading note:', error);
      router.back();
    }
  };

  const handleDelete = async () => {
    setDeleteModalVisible(false);
    if (note) {
      try {
        await deleteNote(note);
        router.back();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!note) return;

    setIsSaving(true);
    try {
      const updatedNote: Note = {
        ...note,
        title: editTitle,
        content: editContent,
      };

      await updateNote(updatedNote);
      setNote(updatedNote);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditMode = () => {
    if (
      isEditing &&
      (editTitle !== note?.title || editContent !== note?.content)
    ) {
      // Confirm before discarding changes
      alert('Do you want to save your changes?');
    } else {
      setIsEditing(!isEditing);
    }
  };

  const openDocument = async () => {
    if (!note?.mediaPath || note.mediaType !== 'document') return;
    console.log('Opening document:', note.mediaPath);
    try {
      const uri = note.mediaPath;
      // Use Expo's sharing API to open the document
      await Sharing.shareAsync(uri, {
        UTI: '.pdf', // Universal Type Identifier, adjust based on your document types
        mimeType: 'application/pdf', // Adjust based on your document types
      });
    } catch (error) {
      console.error('Error opening document:', error);
      alert(
        'Could not open this document. The file might be corrupted or in an unsupported format.'
      );
    }
  };
  // UI Kitten Icons
  const TrashIcon = (props: any) => <Icon {...props} name="trash-2-outline" />;
  const BackIcon = (props: any) => (
    <Icon {...props} name="arrow-back-outline" />
  );
  const FileIcon = (props: any) => <Icon {...props} name="file-text-outline" />;
  const EditIcon = (props: any) => <Icon {...props} name="edit-outline" />;
  const SaveIcon = (props: any) => <Icon {...props} name="save-outline" />;

  if (!note) {
    return (
      <Layout style={styles.loadingContainer}>
        <Text category="h5">Loading note...</Text>
      </Layout>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Layout style={styles.container}>
        <View style={styles.header}>
          <Button
            appearance="ghost"
            accessoryLeft={BackIcon}
            onPress={() => router.back()}
            style={styles.backButton}
          />

          {isEditing ? (
            <Input
              style={styles.titleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              size="large"
              placeholder="Note Title"
            />
          ) : (
            <Text category="h4" style={styles.title}>
              {note.title}
            </Text>
          )}

          <View style={styles.headerButtons}>
            {isEditing ? (
              <Button
                appearance="ghost"
                status="success"
                accessoryLeft={SaveIcon}
                onPress={handleSaveChanges}
                disabled={isSaving}
              />
            ) : (
              <>
                <Button
                  appearance="ghost"
                  accessoryLeft={EditIcon}
                  onPress={toggleEditMode}
                  style={styles.editButton}
                />
                <Button
                  appearance="ghost"
                  status="danger"
                  accessoryLeft={TrashIcon}
                  onPress={() => setDeleteModalVisible(true)}
                />
              </>
            )}
          </View>
        </View>

        <Divider style={styles.divider} />

        {isEditing ? (
          <Input
            style={styles.contentInput}
            textStyle={styles.contentInputText}
            value={editContent}
            onChangeText={setEditContent}
            multiline={true}
            textAlignVertical="top"
            placeholder="Note Content"
          />
        ) : (
          <Text style={styles.content}>{note.content}</Text>
        )}

        {note.mediaType === 'image' && note.mediaPath && (
          <Card style={styles.mediaCard}>
            <RNImage
              source={{ uri: note.mediaPath }}
              style={styles.image}
              resizeMode="contain"
            />
          </Card>
        )}

        {note.mediaType === 'document' && note.mediaPath && (
          <Button
            style={styles.mediaButton}
            accessoryLeft={FileIcon}
            onPress={openDocument}
          >
            Open Document
          </Button>
        )}

        <Text appearance="hint" style={styles.date}>
          Last updated: {new Date(note.updatedAt).toLocaleString()}
        </Text>

        <Modal
          visible={isDeleteModalVisible}
          backdropStyle={styles.backdrop}
          onBackdropPress={() => setDeleteModalVisible(false)}
        >
          <Card disabled>
            <Text category="h6" style={styles.modalTitle}>
              Delete Note
            </Text>
            <Text>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </Text>
            <View style={styles.modalButtonContainer}>
              <Button
                style={styles.modalButton}
                appearance="outline"
                onPress={() => setDeleteModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                style={styles.modalButton}
                status="danger"
                onPress={handleDelete}
              >
                Delete
              </Button>
            </View>
          </Card>
        </Modal>
      </Layout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  backButton: {
    width: 40,
  },
  editButton: {
    marginRight: -8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  titleInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  divider: {
    marginVertical: 16,
  },
  content: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  contentInput: {
    flex: 1,
    marginBottom: 20,
  },
  contentInputText: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mediaCard: {
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  mediaButton: {
    marginBottom: 16,
  },
  date: {
    marginTop: 'auto',
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
