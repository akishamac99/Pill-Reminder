class SettingsManager {
    constructor() {
        this.defaultSettings = {
            theme: 'Light',
            fontSize: 'Medium',
            notificationSound: 'On',
            language: 'English',
            textToSpeech: 'Enabled',
            reminderAdvanced: false,
            backupFrequency: 'Weekly',
            primaryColor: '#28a745',
            primaryDark: '#218838',
            lightColor: '#eafbea',
            vibration: true,
            fontSizeCustom: 16,
            highContrast: false
        };
        this.currentColors = {};
        this.init();
    }

    init() {
        this.initSettingsPage();
        this.loadAndApplySettings();
        this.setupEventListeners();
    }

    initSettingsPage() {
        try {
            // Set current year in footer
            const footerText = document.querySelector('footer .bi-c-circle').nextElementSibling;
            if (footerText) {
                footerText.textContent = ` ${new Date().getFullYear()} Pill Reminder. All rights reserved.`;
            }
            
            // Initialize tooltips
            this.initTooltips();
            
            // Add loading states to buttons
            document.querySelectorAll('button').forEach(button => {
                button.dataset.originalText = button.innerHTML;
            });
            
            // Initialize color picker
            this.initColorPicker();
        } catch (error) {
            console.error('Error in initSettingsPage:', error);
            throw error;
        }
    }

    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    initColorPicker() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                if (this.validateColor(e.target.value)) {
                    this.applyColorScheme(e.target.value);
                    this.saveSettings();
                }
            });
        }
    }

    loadAndApplySettings() {
        let savedSettings = JSON.parse(localStorage.getItem('pillReminderSettings')) || this.defaultSettings;

        // Backward compatibility for old fontSize (Small/Medium/Large) and fontSizeCustom
        if (savedSettings.fontSize === 'Small') {
            savedSettings.fontSize = 14;
        } else if (savedSettings.fontSize === 'Large') {
            savedSettings.fontSize = 18;
        } else if (savedSettings.fontSize === 'Medium') {
            savedSettings.fontSize = 16;
        } else if (savedSettings.fontSizeCustom) {
            savedSettings.fontSize = savedSettings.fontSizeCustom;
        }

        // Ensure fontSize is a valid number within the new range (12-24)
        savedSettings.fontSize = parseInt(savedSettings.fontSize) || this.defaultSettings.fontSize;
        if (savedSettings.fontSize < 12) savedSettings.fontSize = 12;
        if (savedSettings.fontSize > 24) savedSettings.fontSize = 24;

        // Apply all settings
        this.applyTheme(savedSettings.theme || this.defaultSettings.theme);
        this.applyFontSize(savedSettings.fontSize || this.defaultSettings.fontSize);
        this.toggleHighContrast(savedSettings.highContrast || this.defaultSettings.highContrast);
        this.applyColorScheme(savedSettings.primaryColor || this.defaultSettings.primaryColor);
        this.applyLanguage(savedSettings.language || this.defaultSettings.language);
        this.applyTextToSpeech(savedSettings.textToSpeech || this.defaultSettings.textToSpeech);
        this.applyNotificationSound(savedSettings.notificationSound || this.defaultSettings.notificationSound);
        this.applyBackupFrequency(savedSettings.backupFrequency || this.defaultSettings.backupFrequency);

        // Update settings page form controls if on settings page
        if (document.getElementById('theme')) {
            this.populateSettingsForm(savedSettings);
        }
    }

    populateSettingsForm(settings) {
        document.getElementById('theme').value = settings.theme || this.defaultSettings.theme;
        document.getElementById('fontSize').value = settings.fontSize || this.defaultSettings.fontSize;
        document.getElementById('notification').value = settings.notificationSound || this.defaultSettings.notificationSound;
        document.getElementById('language').value = settings.language || this.defaultSettings.language;
        document.getElementById('tts').value = settings.textToSpeech || this.defaultSettings.textToSpeech;
        document.getElementById('highContrast').checked = settings.highContrast || false;
        document.getElementById('backupFrequency').value = settings.backupFrequency || this.defaultSettings.backupFrequency;
        if (document.getElementById('colorPicker')) {
            document.getElementById('colorPicker').value = settings.primaryColor || this.defaultSettings.primaryColor;
        }
    }

    setupEventListeners() {
        // Theme and appearance
        document.getElementById('theme').addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
            this.saveSettings();
        });

        document.getElementById('fontSize').addEventListener('change', (e) => {
            this.applyFontSize(parseInt(e.target.value));
            this.saveSettings();
        });

        // Color picker event
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            if (this.validateColor(e.target.value)) {
                this.applyColorScheme(e.target.value);
                this.saveSettings();
            }
        });

        // Notifications
        document.getElementById('notification').addEventListener('change', (e) => {
            this.saveSettings();
            // Restart notification system if enabled
            if (e.target.value === 'On') {
                if (typeof initNotificationSystem === 'function') {
                    initNotificationSystem();
                }
            }
        });

        // Language
        document.getElementById('language').addEventListener('change', () => {
            this.applyLanguage(document.getElementById('language').value);
            this.saveSettings();
            this.showAlert('Language change will take effect after page reload', 'info');
        });

        document.getElementById('tts').addEventListener('change', () => {
            this.applyTextToSpeech(document.getElementById('tts').value);
            this.saveSettings();
        });

        // Accessibility
        document.getElementById('highContrast').addEventListener('change', (e) => {
            this.toggleHighContrast(e.target.checked);
            this.saveSettings();
        });

        // Backup frequency
        document.getElementById('backupFrequency').addEventListener('change', () => this.saveSettings());

        // Buttons
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('exportSettings').addEventListener('click', () => this.exportSettings());
        document.getElementById('importSettingsFile').addEventListener('change', (e) => this.importSettings(e));
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('theme')?.value || this.defaultSettings.theme,
            fontSize: parseInt(document.getElementById('fontSize')?.value) || this.defaultSettings.fontSize,
            notificationSound: document.getElementById('notification')?.value || this.defaultSettings.notificationSound,
            language: document.getElementById('language')?.value || this.defaultSettings.language,
            textToSpeech: document.getElementById('tts')?.value || this.defaultSettings.textToSpeech,
            highContrast: document.getElementById('highContrast')?.checked || this.defaultSettings.highContrast,
            backupFrequency: document.getElementById('backupFrequency')?.value || this.defaultSettings.backupFrequency,
            primaryColor: this.currentColors?.primary || this.defaultSettings.primaryColor,
            primaryDark: this.currentColors?.primaryDark || this.defaultSettings.primaryDark,
            lightColor: this.currentColors?.light || this.defaultSettings.lightColor,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('pillReminderSettings', JSON.stringify(settings));
        this.loadAndApplySettings(); // Reapply settings to ensure consistency
        this.showAlert('Settings saved successfully!', 'success');
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            localStorage.setItem('pillReminderSettings', JSON.stringify(this.defaultSettings));
            this.loadAndApplySettings();
            this.showAlert('Settings reset to default!', 'success');
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
            
            // Apply dark mode colors
            root.style.setProperty('--text-color', this.defaultSettings.darkModeText);
            root.style.setProperty('--bg-color', this.defaultSettings.darkModeBg);
            root.style.setProperty('--card-bg', this.defaultSettings.darkModeCardBg);
            root.style.setProperty('--border-color', this.defaultSettings.darkModeBorder);
            
            // Ensure form controls are readable
            root.style.setProperty('--form-control-bg', this.defaultSettings.darkModeCardBg);
            root.style.setProperty('--form-control-border', this.defaultSettings.darkModeBorder);
            root.style.setProperty('--form-control-text', this.defaultSettings.darkModeText);
            
            // Ensure alerts are readable
            root.style.setProperty('--alert-bg', this.defaultSettings.darkModeCardBg);
            root.style.setProperty('--alert-border', this.defaultSettings.darkModeBorder);
            root.style.setProperty('--alert-text', this.defaultSettings.darkModeText);
            
            // Ensure buttons are visible
            root.style.setProperty('--btn-text', this.defaultSettings.darkModeText);
            root.style.setProperty('--btn-border', this.defaultSettings.darkModeBorder);
            
            // Ensure links are visible
            root.style.setProperty('--link-color', '#4dabf7');
            root.style.setProperty('--link-hover-color', '#74c0fc');
            
            // Ensure placeholders are visible
            root.style.setProperty('--placeholder-color', '#adb5bd');
        } else {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-dark');
            
            // Reset to light mode colors
            root.style.removeProperty('--text-color');
            root.style.removeProperty('--bg-color');
            root.style.removeProperty('--card-bg');
            root.style.removeProperty('--border-color');
            root.style.removeProperty('--form-control-bg');
            root.style.removeProperty('--form-control-border');
            root.style.removeProperty('--form-control-text');
            root.style.removeProperty('--alert-bg');
            root.style.removeProperty('--alert-border');
            root.style.removeProperty('--alert-text');
            root.style.removeProperty('--btn-text');
            root.style.removeProperty('--btn-border');
            root.style.removeProperty('--link-color');
            root.style.removeProperty('--link-hover-color');
            root.style.removeProperty('--placeholder-color');
        }
    }

    applyFontSize(size) {
        document.documentElement.style.fontSize = `${size}px`;
    }

    toggleHighContrast(enabled) {
        if (enabled) {
            document.body.classList.add('high-contrast');
            document.documentElement.style.setProperty('--text-color', '#000000');
            document.documentElement.style.setProperty('--bg-color', '#ffffff');
        } else {
            document.body.classList.remove('high-contrast');
            document.documentElement.style.removeProperty('--text-color');
            document.documentElement.style.removeProperty('--bg-color');
        }
    }

    applyColorScheme(color) {
        try {
            const darkerColor = this.darkenColor(color, 15);
            const lighterColor = this.lightenColor(color, 90);
            document.documentElement.style.setProperty('--primary-color', color);
            document.documentElement.style.setProperty('--primary-dark', darkerColor);
            document.documentElement.style.setProperty('--light-green', lighterColor);
            this.currentColors = {
                primary: color,
                primaryDark: darkerColor,
                light: lighterColor
            };
        } catch (error) {
            console.error('Error applying color scheme:', error);
        }
    }

    applyLanguage(language) {
        document.documentElement.setAttribute('data-lang', language.toLowerCase());
        // Placeholder for actual language translation logic
    }

    applyTextToSpeech(enabled) {
        if (enabled === 'Enabled') {
            document.body.classList.add('tts-enabled');
        } else {
            document.body.classList.remove('tts-enabled');
        }
    }

    applyNotificationSound(sound) {
        // Placeholder for notification sound logic
    }

    applyBackupFrequency(frequency) {
        // Placeholder for backup scheduling logic
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
    }

    exportSettings() {
        const settings = JSON.parse(localStorage.getItem('pillReminderSettings')) || this.defaultSettings;
        const dataStr = JSON.stringify(settings, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportName = `pill-reminder-settings-${new Date().toISOString().slice(0,10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
        this.showAlert('Settings exported successfully!', 'success');
    }

    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                localStorage.setItem('pillReminderSettings', JSON.stringify(settings));
                this.loadAndApplySettings();
                this.showAlert('Settings imported successfully!', 'success');
            } catch (error) {
                this.showAlert('Error importing settings: Invalid file format', 'danger');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        while (alertContainer.firstChild) {
            alertContainer.removeChild(alertContainer.firstChild);
        }
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertContainer.appendChild(alert);
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    }

    validateColor(color) {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(color)) {
            this.showAlert('Invalid color format. Please use a valid hex color.', 'danger');
            return false;
        }
        return true;
    }
}

// Initialize SettingsManager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});