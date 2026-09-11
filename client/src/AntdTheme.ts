import type { ThemeConfig } from 'antd';
import { theme as appTheme } from './theme';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: appTheme.colors.accent,
    colorError: appTheme.colors.danger,
    colorSuccess: appTheme.colors.success,
    colorText: appTheme.colors.textPrimary,
    colorTextSecondary: appTheme.colors.textMuted,
    colorBorder: appTheme.colors.border,
    colorBgLayout: appTheme.colors.pageBg,
    colorBgContainer: appTheme.colors.surface,
    borderRadius: parseInt(appTheme.radius), // '6px' -> 6
    fontFamily: appTheme.font.body,
  },
  components: {
    Layout: {
      siderBg: appTheme.colors.sidebarBg,
    },
    Menu: {
      darkItemBg: appTheme.colors.sidebarBg,
      darkItemSelectedBg: appTheme.colors.sidebarActiveBg,
      darkItemColor: appTheme.colors.sidebarText,
      // add darkItemSelectedColor if you want active text to use sidebarTextActive:
      // darkItemSelectedColor: appTheme.colors.sidebarTextActive,
    },
  },
};