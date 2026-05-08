import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  scrollviewContainer: {
    padding: 12,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  resetWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    marginRight: 0,
  },
  resetButtonContent: {
    flexDirection: 'row-reverse',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    maxWidth: '70%',
  },
  button: {
    flex: 1,
  },
  settingsSourceContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingItemContainer: {
    marginVertical: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  textLabel: {
    fontWeight: '500',
  },
  textDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
});
