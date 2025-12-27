// Helper للحصول على اللغة الافتراضية للموقع
import { getPath } from './pathHelper.js';

let defaultLocale = null;
let appConfig = null;

/**
 * تهيئة إعدادات اللغة
 * يتم استدعاؤها تلقائياً عند تحميل الملف
 */
async function initLocale() {
    try {
        // محاولة قراءة ملف الإعدادات
        let configPath;
        if (typeof window !== 'undefined' && window.appConfig && window.appConfig.configPath) {
            configPath = `Jquery-Framework${window.appConfig.configPath}app.js`;
        } else {
            configPath = getPath('base', 'public/Jquery-Framework/config/app.js');
        }
        const configModule = await import(configPath);
        appConfig = configModule.default;
        
        if (appConfig && appConfig.locale) {
            defaultLocale = appConfig.locale;
        } else {
            // Fallback: استخدام اللغة من HTML lang attribute
            const htmlLang = document.documentElement.lang || 'en';
            defaultLocale = htmlLang;
        }
        
        // حفظ في window للوصول السريع
        if (typeof window !== 'undefined') {
            window.appLocale = defaultLocale;
            window.getLocale = getLocale;
        }
    } catch (error) {
        console.warn('Error loading locale config, using fallback:', error);
        // Fallback: استخدام اللغة من HTML lang attribute أو 'en'
        const htmlLang = document.documentElement.lang || 'en';
        defaultLocale = htmlLang;
        
        if (typeof window !== 'undefined') {
            window.appLocale = defaultLocale;
            window.getLocale = getLocale;
        }
    }
}

/**
 * الحصول على اللغة الافتراضية للموقع
 * @returns {string} اللغة الافتراضية (مثل 'ar' أو 'en')
 */
export function getLocale() {
    // إذا كانت اللغة محملة بالفعل، أرجعها
    if (defaultLocale) {
        return defaultLocale;
    }
    
    // محاولة الحصول من window
    if (typeof window !== 'undefined' && window.appLocale) {
        return window.appLocale;
    }
    
    // Fallback: استخدام اللغة من HTML lang attribute أو 'en'
    const htmlLang = document.documentElement.lang || 'en';
    return htmlLang;
}

/**
 * الحصول على إعدادات التطبيق
 * @returns {Object|null} إعدادات التطبيق أو null
 */
export function getAppConfig() {
    return appConfig;
}

/**
 * تهيئة اللغة (يتم استدعاؤها تلقائياً)
 */
export async function init() {
    await initLocale();
}

// تهيئة تلقائية عند تحميل الملف
if (typeof window !== 'undefined') {
    // انتظار تحميل DOM أولاً
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}

// تصدير للاستخدام المباشر
export default {
    getLocale,
    getAppConfig,
    init
};

