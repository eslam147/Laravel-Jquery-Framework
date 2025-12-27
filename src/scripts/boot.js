/**
 * Bootstrap file - تهيئة التطبيق
 * يتم استدعاؤه عند تحميل الصفحة لتهيئة جميع الإعدادات والمسارات
 */
// استخراج اسم المشروع من المسار الحالي
const currentPath = window.location.pathname;
const pathParts = currentPath.split('/').filter(p => p);
const projectName = pathParts[0] || '';

// إنشاء متغيرات عامة للمسارات
window.appConfig = {
    projectName: projectName,
    basePath: projectName ? `/${projectName}/` : '/',
    vendorPath: projectName ? `/${projectName}/vendor/` : '/vendor/',
    appPath: projectName ? `/${projectName}/Jquery-Framework/app/` : '/Jquery-Framework/app/',
    viewsPath: projectName ? `/${projectName}/resources/views/` : '/resources/views/',
    langPath: projectName ? `/${projectName}/lang/` : '/lang/',
    configPath: projectName ? `/${projectName}/config/` : '/config/'
};
window.currentPath = currentPath;
const { vendorPath } = window.appConfig;
// استخدام dynamic import مع المسار الصحيح
Promise.all([
    import(`./helpers.js`),
    import(`./localeHelper.js`),
    import(`./Controller.js`),
    import(`./RouteLoader.js`),
]).then(([helpersModule, localeModule, controllerModule, routeModule]) => {
    const { loadControllers } = controllerModule;
    const { getLocale } = localeModule;
    const { loadRoutes } = routeModule;
    // إضافة اللغة الافتراضية إلى appConfig
    window.appConfig.locale = getLocale();

    // تحميل Routes
    loadRoutes().catch(() => {
        // Silent fail

    });

    // تهيئة الـ controllers بعد تحميل جميع الملفات
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadControllers);
    } else {
        loadControllers();
    }
}).catch((err) => {
    // Silent fail
    console.error("فشل تحميل الملفات البرمجية:", err);
});

