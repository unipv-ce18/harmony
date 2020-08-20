import {Session} from '../core/Session';
import {ThemeId, THEMES} from './theme';

declare const DEFAULT_THEME_ID: ThemeId;

const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

type ThemeChangeListener = (appClass: string, done?: Function) => void;

/**
 * Determines which theme to apply and when
 *
 * The current theme is chosen by context (user preference or site defaults) and can be overridden by calling
 * {@link ThemeManager.applyTheme}.
 *
 * Other components can listen for theme changes by registering a listener at {@link ThemeManager.addChangeListener}.
 */
class ThemeManager {

    private readonly changeListeners: Array<ThemeChangeListener> = [];

    private currentTheme: ThemeId;
    private isDarkMode: boolean;

    /**
     * Creates a new {@link ThemeManager} instance
     *
     * @param session - The session to monitor for login status and user preferences
     */
    constructor(private readonly session: Session) {
        this.isDarkMode = darkMediaQuery.matches;

        darkMediaQuery.addEventListener('change', e => {
            this.isDarkMode = e.matches;
            this.applyTheme(this.currentTheme);
        });

        session.addStatusListener(() => this.applyTheme());
        this.applyTheme();
    }

    /**
     * Returns the class name(s) to append at the application's root to apply the currently selected theme
     */
    public get currentAppClass() {
        return this.getColorSchemeAttribute(THEMES[this.currentTheme].appClass);
    }

    /**
     * Applies the given theme by ID
     *
     * The selection is not persistent and will be reset to default/user preferences on next session change
     * (login/logout) or application reload.
     */
    public applyTheme(themeId?: ThemeId) {
        this.currentTheme = themeId != null ? themeId : this.getContextTheme();

        const themeColor = this.getColorSchemeAttribute(THEMES[this.currentTheme].themeColor);
        document.querySelector('meta[name=theme-color]')!.setAttribute('content', themeColor);

        const promises = this.changeListeners.map(l => () => new Promise(done => l(this.currentAppClass, done)));
        // noinspection JSIgnoredPromiseFromCall
        promises.reduce((acc, cur) => acc.then(cur), Promise.resolve());
    }

    /**
     * Add a listener for changes in theme
     *
     * @param listener - The theme change listener function
     * @param retroactive - Whether to invoke immediately the given function with the current values
     */
    public addChangeListener(listener: ThemeChangeListener, retroactive: boolean = false) {
        this.changeListeners.push(listener);
        if (retroactive) listener(this.currentAppClass);
    }

    /**
     * Removes a previously registered theme change listener
     *
     * @param listener - The listener function to remove
     */
    public removeChangeListener(listener: ThemeChangeListener) {
        const idx = this.changeListeners.findIndex(f => f === listener);
        if (idx !== -1)
            this.changeListeners.splice(idx, 1);
        else
            throw new Error('Listener not found');
    }

    private getContextTheme(): ThemeId {
        return this.session.currentUser?.preferences?.theme || DEFAULT_THEME_ID;
    }

    private getColorSchemeAttribute(a: any) {
        return a instanceof Function ? a(this.isDarkMode) : a;
    }

}

export default ThemeManager;
