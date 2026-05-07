import {StyleSheet} from 'react-native';
import {Theme} from '../../utils/types';
import {EdgeInsets} from 'react-native-safe-area-context';

export const createStyles = ({
  insets,
  headerHeight,
}: {
  theme: Theme;
  insets: EdgeInsets;
  headerHeight: number;
}) =>
  StyleSheet.create({
    container: {
      height: headerHeight,
      paddingTop: insets.top,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 1,
    },
    menuIcon: {
      height: 40,
      width: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerWithoutDivider: {
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
      backgroundColor: 'transparent',
    },
    headerWithDivider: {
      backgroundColor: 'transparent',
    },
  });
