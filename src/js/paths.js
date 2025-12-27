// دالة للحصول على المسارات الديناميكية
export function getPath(type) {
    if (typeof window === 'undefined' || !window.appConfig) {
        // Fallback للمسارات النسبية إذا لم يكن appConfig متاحاً
        const paths = {
            vendor: '../../../vendor/',
            app: '../../../app/',
            views: '../../../resources/views/'
        };
        return paths[type] || '';
    }
    
    const config = window.appConfig;
    const pathMap = {
        vendor: config.vendorPath,
        app: config.appPath,
        views: config.viewsPath,
        base: config.basePath
    };
    
    return pathMap[type] || '';
}

// دالة مساعدة لبناء مسار كامل
export function path(relativePath) {
    // إذا كان المسار يبدأ بـ / فهو مطلق
    if (relativePath.startsWith('/')) {
        return relativePath;
    }
    
    // إذا كان المسار يبدأ بـ vendor/ أو app/ أو resources/
    if (relativePath.startsWith('vendor/')) {
        return getPath('vendor') + relativePath.replace('vendor/', '');
    }
    if (relativePath.startsWith('app/')) {
        return getPath('app') + relativePath.replace('app/', '');
    }
    if (relativePath.startsWith('resources/views/')) {
        return getPath('views') + relativePath.replace('resources/views/', '');
    }
    
    // افتراضياً، مسار نسبي
    return relativePath;
}

