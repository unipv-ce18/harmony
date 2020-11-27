import theme from './theme.scss';
import {classList} from '../core/utils';

export type ThemeId = keyof typeof THEMES;

export const THEMES = {
    adaptive: {
        name: "Adaptive",
        themeColor: (dark: boolean) => dark ? '#171717' : '#ffffff',
        appClass: (dark: boolean) => dark ? theme.dark : theme.light
    },
    dark: {
        name: "Dark",
        themeColor: '#171717',
        appClass: theme.dark
    },
    light: {
        name: "Light",
        themeColor: '#ffffff',
        appClass: theme.light
    },
    wine: {
        name: "Samuel's cheap wine",  // Sorry, 1st name that came to mind :P
        themeColor: '#2a0c12',
        appClass: classList(theme.dark, theme.wine)
    }
};
