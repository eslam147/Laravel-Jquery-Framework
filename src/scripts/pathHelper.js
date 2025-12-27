// Helper للحصول على المسارات الديناميكية
// يمكن استخدامه في جميع الملفات لتجنب تكرار الكود
export function getPath(type, relativePath = '') {
    if (typeof window !== 'undefined' && window.appConfig) {
        const config = window.appConfig;
        const pathMap = {
            vendor: config.vendorPath,
            app: config.appPath,
            views: config.viewsPath,
            base: config.basePath
        };
        
        const base = pathMap[type] || '';
        return relativePath ? base + relativePath : base;
    }
    
    // Fallback للمسارات النسبية
    const fallbackMap = {
        vendor: '../../../vendor/',
        app: '../../../app/',
        views: '../../../resources/views/',
        base: '../../../'
    };
    
    const base = fallbackMap[type] || '';
    return relativePath ? base + relativePath : base;
}

/**
 * Helper function للاستيراد مثل Laravel use statement
 * يمكن استخدامه كـ statement مباشر في top-level
 * 
 * @param {string} namespace - مثل 'App\\Http\\Requests\\UserRequest'
 * @returns {Promise<*>} - الكلاس المستورد
 * 
 * @example
 * use App\\Http\\Requests\\UserRequest;
 * use Vendor\\Jquery-Framework\\src\\Controllers\\Controller;
 */
export async function use(namespace) {
    // تحويل namespace إلى مسار
    // App\Http\Requests\UserRequest -> app/Http/Requests/UserRequest.js
    // Jquery-Framework\scripts\Controller -> vendor/Jquery-Framework/src/Controllers/Controller.js
    
    let path = '';
    
    if (namespace.startsWith('App\\')) {
        // App\Http\Requests\UserRequest -> app/Http/Requests/UserRequest.js
        path = namespace
            .replace('App\\', '')
            .replace(/\\/g, '/');
        path = getPath('app', path + '.js');
    } else if (namespace.startsWith('Vendor\\') || namespace.startsWith('vendor\\')) {
        // Jquery-Framework\scripts\Controller -> vendor/Jquery-Framework/src/Controllers/Controller.js
        path = namespace
            .replace(/^(Vendor|vendor)\\/, '')
            .replace(/\\/g, '/');
        path = getPath('vendor', path + '.js');
    } else {
        // إذا كان namespace يحتوي على مسار مباشر
        path = namespace.replace(/\\/g, '/');
        if (!path.endsWith('.js')) {
            path += '.js';
        }
    }
    
    // محاولة قراءة الملف وتحليل namespace و use statements
    try {
        const fileResponse = await fetch(path);
        if (fileResponse.ok) {
            const fileCode = await fileResponse.text();
            // استيراد convertNamespaceAndUseToImports من namespaceHelper باستخدام dynamic import
            const namespaceHelperPath = getPath('base', 'Jquery-Framework/scripts/namespaceHelper.js');
            const namespaceHelper = await import(namespaceHelperPath);
            
            // تحويل الملف وإزالة namespace و use statements
            const convertedCode = await namespaceHelper.convertNamespaceAndUseToImports(fileCode, path);
            
            // إنشاء blob URL للملف المعدل
            const blob = new Blob([convertedCode], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            
            try {
                const module = await import(blobUrl);
                URL.revokeObjectURL(blobUrl);
                return module.default;
            } catch (importError) {
                URL.revokeObjectURL(blobUrl);
                // إذا فشل، استخدم import عادي
                const module = await import(path);
                return module.default;
            }
        }
    } catch (fetchError) {
        // إذا فشل fetch، استخدم import عادي
    }
    
    // استيراد عادي إذا فشل fetch أو التحويل
    const module = await import(path);
    return module.default;
}

/**
 * Helper function لاستخدام use statements في top-level
 * يتم استدعاؤها تلقائياً عند تحميل الملف
 */
export function useStatement(namespace) {
    return use(namespace);
}
