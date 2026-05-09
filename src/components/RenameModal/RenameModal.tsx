import React, {useContext, useEffect} from 'react';
import {Modal, Platform, TextInput, TouchableOpacity, View} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {
  LiquidGlassView,
  LIQUID_GLASS_FROSTED,
} from '@uginy/react-native-liquid-glass';

import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {chatSessionStore, SessionMetaData} from '../../store';

const isGlassSupported =
  Platform.OS === 'ios' ||
  (Platform.OS === 'android' &&
    typeof Platform.Version === 'number' &&
    Platform.Version >= 33);

interface RenameModalProps {
  visible: boolean;
  onClose: () => void;
  session: SessionMetaData | null;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  visible,
  onClose,
  session,
}) => {
  const [newTitle, setNewTitle] = React.useState(session?.title || '');
  const theme = useTheme();
  const styles = createStyles(theme);
  const l10n = useContext(L10nContext);

  useEffect(() => {
    setNewTitle(session?.title || '');
  }, [session, visible]);

  const handleRename = async () => {
    if (session?.id && newTitle.trim()) {
      await chatSessionStore.updateSessionTitleBySessionId(
        session?.id,
        newTitle,
      );
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      animationType="fade">
      <View style={styles.modalOverlay}>
        {isGlassSupported ? (
          <LiquidGlassView
            {...LIQUID_GLASS_FROSTED}
            noiseIntensity={0.02}
            cornerRadius={14}
            style={styles.modalContent}>
            <Text style={styles.modalTitle}>{l10n.common.rename}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="New Title"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newTitle}
              maxLength={40}
              onChangeText={setNewTitle}
              autoFocus={true}
              onSubmitEditing={handleRename}
              returnKeyType="done"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}>
                <Text style={styles.cancelText}>{l10n.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !newTitle.trim() && styles.disabledButton,
                ]}
                onPress={handleRename}
                disabled={!newTitle.trim()}>
                <Text style={styles.confirmText}>{l10n.common.save}</Text>
              </TouchableOpacity>
            </View>
          </LiquidGlassView>
        ) : (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{l10n.common.rename}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="New Title"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newTitle}
              maxLength={40}
              onChangeText={setNewTitle}
              autoFocus={true}
              onSubmitEditing={handleRename}
              returnKeyType="done"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}>
                <Text style={styles.cancelText}>{l10n.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !newTitle.trim() && styles.disabledButton,
                ]}
                onPress={handleRename}
                disabled={!newTitle.trim()}>
                <Text style={styles.confirmText}>{l10n.common.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};
