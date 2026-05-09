import React, {useContext, useEffect} from 'react';
import {Modal, TextInput, TouchableOpacity, View} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {LiquidGlass} from '..';

import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {chatSessionStore, SessionMetaData, uiStore} from '../../store';

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

  const modalInner = (
    <>
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
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
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
    </>
  );

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      animationType="fade">
      <View style={styles.modalOverlay}>
        {uiStore.useLiquidGlass ? (
          <LiquidGlass
            cornerRadius={14}
            blurAmount={16}
            style={styles.modalContent}>
            {modalInner}
          </LiquidGlass>
        ) : (
          <View style={styles.modalContent}>{modalInner}</View>
        )}
      </View>
    </Modal>
  );
};
