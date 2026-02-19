// NoorBloom i18n System - No API, Pure JavaScript
class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('noorbloom_lang') || 'en';
        this.translations = {};
        this.init();
    }

    async init() {
        await this.loadTranslations();
        this.setupLanguageSwitcher();
        this.applyLanguage(this.currentLang);
    }

    async loadTranslations() {
        const languages = ['en', 'tr', 'ru'];
        
        for (const lang of languages) {
            try {
                const response = await fetch(`translations/${lang}.json`);
                this.translations[lang] = await response.json();
            } catch (error) {
                console.error(`Failed to load ${lang} translations:`, error);
            }
        }
    }

    setupLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');
        
        langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                this.switchLanguage(lang);
            });
        });
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('noorbloom_lang', lang);
        this.applyLanguage(lang);
        
        // Update active button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            }
        });
    }

    applyLanguage(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translations[lang]?.[key];
            
            if (translation) {
                // Check if element is input/textarea
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.innerHTML = translation;
                }
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update page title
        const titleElement = document.querySelector('[data-i18n="page_title"]');
        if (titleElement) {
            document.title = titleElement.textContent;
        }

        // Set active button on page load
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            }
        });
    }

    translate(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }
}

// Initialize i18n when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});
