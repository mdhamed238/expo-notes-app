import { useState } from 'react';
import {
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Alert,
  View,
  Image as RNImage,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { saveNote } from '@/lib/db';
import {
  Button,
  Input,
  Layout,
  Text,
  Card,
  Spinner,
} from '@ui-kitten/components';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Image, FileText, Save, X, File } from 'lucide-react-native';

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().optional(),
  media: z
    .object({
      path: z.string().optional(),
      type: z.enum(['image', 'document']).optional(),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewNoteScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{
    path: string;
    type: 'image' | 'document';
  } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      media: undefined,
    },
  });

  const takePicture = async () => {
    try {
      setIsLoading(true);
      const hasPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      console.log('Launching camera');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"] as any,
        quality: 0.8,
        allowsEditing: true,
      });

      console.log('Camera result:', result.canceled ? 'Canceled' : 'Success');

      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          await FileSystem.makeDirectoryAsync(
            FileSystem.documentDirectory + 'notes/',
            { intermediates: true }
          ).catch((err) => console.log('Directory creation error:', err));

          const newPath =
            FileSystem.documentDirectory +
            'notes/' +
            new Date().getTime() +
            '.jpg';
          console.log('Copying from:', result.assets[0].uri);
          console.log('Copying to:', newPath);

          await FileSystem.copyAsync({
            from: result.assets[0].uri,
            to: newPath,
          });

          setValue('media', { path: newPath, type: 'image' });
          setMediaPreview({ path: newPath, type: 'image' });
        } catch (error) {
          console.error('Error saving image:', error);
          Alert.alert('Error', 'Failed to save the captured image.');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'There was a problem opening the camera.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      setIsLoading(true);
      const hasPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      console.log('Launching image picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log(
        'Image picker result:',
        result.canceled ? 'Canceled' : 'Success'
      );

      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          await FileSystem.makeDirectoryAsync(
            FileSystem.documentDirectory + 'notes/',
            { intermediates: true }
          ).catch((err) => console.log('Directory creation error:', err));

          const newPath =
            FileSystem.documentDirectory +
            'notes/' +
            new Date().getTime() +
            '.jpg';
          console.log('Copying from:', result.assets[0].uri);
          console.log('Copying to:', newPath);

          await FileSystem.copyAsync({
            from: result.assets[0].uri,
            to: newPath,
          });

          setValue('media', { path: newPath, type: 'image' });
          setMediaPreview({ path: newPath, type: 'image' });
        } catch (error) {
          console.error('Error saving image:', error);
          Alert.alert('Error', 'Failed to save the selected image.');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'There was a problem opening the image picker.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      setIsLoading(true);
      console.log('Launching document picker');

      const result = await DocumentPicker.getDocumentAsync();
      console.log(
        'Document picker result:',
        result.canceled ? 'Canceled' : 'Success'
      );

      if (result.assets && result.assets.length > 0) {
        try {
          await FileSystem.makeDirectoryAsync(
            FileSystem.documentDirectory + 'notes/',
            { intermediates: true }
          ).catch((err) => console.log('Directory creation error:', err));

          const asset = result.assets[0];
          const newPath =
            FileSystem.documentDirectory +
            'notes/' +
            new Date().getTime() +
            '_' +
            asset.name;

          console.log('Copying from:', asset.uri);
          console.log('Copying to:', newPath);

          await FileSystem.copyAsync({
            from: asset.uri,
            to: newPath,
          });

          setValue('media', { path: newPath, type: 'document' });
          setMediaPreview({ path: newPath, type: 'document' });
        } catch (error) {
          console.error('Error saving document:', error);
          Alert.alert('Error', 'Failed to save the selected document.');
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'There was a problem opening the document picker.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await saveNote({
        title: data.title,
        content: data.content || '',
        mediaPath: data.media?.path,
        mediaType: data.media?.type,
      });
      router.replace('/');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save the note.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeMedia = () => {
    setValue('media', undefined);
    setMediaPreview(null);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (isLoading) {
    return (
      <Layout style={styles.loadingContainer}>
        <Spinner size="large" />
        <Text style={styles.loadingText}>Please wait...</Text>
      </Layout>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <Layout style={styles.container}>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              style={styles.titleInput}
              size="large"
              placeholder="Note Title"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              status={errors.title ? 'danger' : 'basic'}
              caption={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              style={styles.contentInput}
              textStyle={styles.contentInputText}
              placeholder="Note Content"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline={true}
              textAlignVertical="top"
            />
          )}
        />

        {mediaPreview && (
          <Card style={styles.mediaPreviewCard}>
            {mediaPreview.type === 'image' ? (
              <View style={styles.mediaPreviewContainer}>
                <RNImage
                  source={{ uri: mediaPreview.path }}
                  style={styles.mediaPreviewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.mediaPreviewRemoveButton}
                  onPress={removeMedia}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.documentPreviewContainer}>
                <File size={24} color="#0891b2" />
                <Text style={styles.documentPreviewText}>Document Attached</Text>
                <TouchableOpacity
                  style={styles.documentRemoveButton}
                  onPress={removeMedia}
                >
                  <X size={16} color="#FF3D71" />
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        <Text category="h6" style={styles.mediaLabel}>
          Add Media (Optional)
        </Text>

        <View style={styles.mediaButtonsContainer}>
          <TouchableOpacity style={styles.mediaButton} onPress={takePicture}>
            <Camera size={24} color="#0891b2" />
            <Text style={styles.mediaButtonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
            <Image size={24} color="#0891b2" />
            <Text style={styles.mediaButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaButton} onPress={pickDocument}>
            <FileText size={24} color="#0891b2" />
            <Text style={styles.mediaButtonText}>Document</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Save size={24} color="#FFFFFF" style={styles.saveButtonIcon} />
          <Text style={styles.saveButtonText}>SAVE NOTE</Text>
        </TouchableOpacity>
      </Layout>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  titleInput: {
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    marginBottom: 16,
  },
  contentInputText: {
    minHeight: 120,
  },
  mediaLabel: {
    marginBottom: 16,
    marginTop: 8,
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mediaButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    width: '30%',
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 12,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#0891b2',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mediaPreviewCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  mediaPreviewContainer: {
    position: 'relative',
    height: 150,
    width: '100%',
  },
  mediaPreviewImage: {
    height: '100%',
    width: '100%',
    borderRadius: 8,
  },
  mediaPreviewRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  documentPreviewText: {
    marginLeft: 8,
    flex: 1,
  },
  documentRemoveButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCard: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeMediaButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});