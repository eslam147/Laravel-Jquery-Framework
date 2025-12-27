/**
 * Route Loader - تحميل Routes من routes/web.js
 */
import { getPath } from './pathHelper.js';
import { parseNamespaceAndUse, convertNamespaceAndUseToImports } from './namespaceHelper.js';
import Route from '../Route.js';

/**
 * تحميل Routes من routes/web.js
 */
export async function loadRoutes() {
    try {
        const routesPath = getPath('base', 'Jquery-Framework/routes/web.js');
        
        // قراءة ملف routes
        const response = await fetch(routesPath);
        if (!response.ok) {
            return;
        }
        
        const fileCode = await response.text();
        // تحليل namespace و use statements
        const imports = await parseNamespaceAndUse(fileCode, routesPath);
        
        // جعل الكلاسات المستوردة متاحة في global scope
        for (const [name, value] of Object.entries(imports)) {
            if (typeof window !== 'undefined') {
                window[name] = value;
            }
            if (typeof globalThis !== 'undefined') {
                globalThis[name] = value;
            }
        }
        
        // تحويل الملف إلى JavaScript صحيح
        const convertedCode = await convertNamespaceAndUseToImports(fileCode, routesPath);
        
        // إضافة Route إلى global scope
        if (typeof window !== 'undefined') {
            window.Route = Route;
        }
        if (typeof globalThis !== 'undefined') {
            globalThis.Route = Route;
        }
        
        // تنفيذ الكود المحول
        // استبدال Route::get() و Route::post() إلخ
        let routeCode = convertedCode
            .replace(/Route::get\(/g, 'Route.get(')
            .replace(/Route::post\(/g, 'Route.post(')
            .replace(/Route::put\(/g, 'Route.put(')
            .replace(/Route::delete\(/g, 'Route.delete(')
            .replace(/Route::patch\(/g, 'Route.patch(');
        
        // استبدال [Controller::class, 'method'] بـ [Controller, 'method']
        // يجب أن يكون بعد تحويل use statements
        routeCode = routeCode.replace(/(\w+)::class/g, (match, className) => {
            // التحقق من أن الكلاس موجود في global scope
            if (typeof window !== 'undefined' && window[className]) {
                return className;
            }
            return className; // إرجاع الاسم حتى لو لم يكن موجوداً بعد
        });
        
        // إنشاء blob URL وتنفيذ الكود
        const blob = new Blob([routeCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        
        try {
            await import(blobUrl);
            URL.revokeObjectURL(blobUrl);
        } catch (importError) {
            URL.revokeObjectURL(blobUrl);
            throw importError;
        }
    } catch (error) {
        // Silent fail
    }
}

/**
 * تنفيذ Route يدوياً
 * @param {string} method - HTTP method
 * @param {string} url - URL
 * @param {Object} data - البيانات
 */
export async function dispatchRoute(method, url, data = {}) {
    return await Route.dispatch(method, url, data);
}

export { Route };

