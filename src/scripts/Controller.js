// استيراد دالة getPath من الملف المشترك
import { getPath } from './pathHelper.js';
// استيراد EventHandler لمعالجة الأحداث
import { EventHandler } from './EventHandler.js';
// استيراد helper لتحليل namespace و use statements
import { parseNamespaceAndUse } from './namespaceHelper.js';
// دالة لتحويل namespace و use statements إلى imports صحيحة
function convertNamespaceAndUseToImports(code, imports, filePath) {
    const lines = code.split('\n');
    const convertedLines = [];
    
    // حساب base path للملف
    const basePath = filePath ? filePath.substring(0, filePath.lastIndexOf('/') + 1) : '';
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // تخطي namespace و use statements فقط (وليس import statements)
        if ((trimmedLine.startsWith('namespace') || trimmedLine.startsWith('use')) && !trimmedLine.startsWith('import')) {
            continue;
        }
        
        // تحويل relative imports إلى absolute paths
        if (trimmedLine.startsWith('import') && trimmedLine.includes('from')) {
            const importMatch = trimmedLine.match(/from\s+['"]([^'"]+)['"]/);
            if (importMatch && importMatch[1]) {
                const importPath = importMatch[1];
                // إذا كان relative import (يبدأ بـ . أو ..)
                if (importPath.startsWith('.') || importPath.startsWith('..')) {
                    // تحويل إلى absolute path
                    const absolutePath = resolveRelativePath(basePath, importPath);
                    const newLine = trimmedLine.replace(importMatch[1], absolutePath);
                    convertedLines.push(newLine);
                    continue;
                }
            }
        }
        
        // تحويل public function إلى method syntax (دعم Laravel-like syntax)
        // دعم: public function selector() { -> selector() {
        // دعم: private function helper() { -> helper() {
        // دعم: protected function helper() { -> helper() {
        let convertedLine = line;
        // البحث عن public/private/protected function داخل class body
        // يجب أن يكون بعد class definition
        // regex يطابق: (مسافات)(public|private|protected) function methodName(
        const publicFunctionMatch = convertedLine.match(/(\s*)(public|private|protected)\s+function\s+(\w+)\s*\(/);
        if (publicFunctionMatch) {
            // استبدال public/private/protected function بـ method syntax فقط (بدون function)
            // مثال: "    public function selector() {" -> "    selector() {"
            convertedLine = convertedLine.replace(/(\s*)(public|private|protected)\s+function\s+/, '$1');
        }
        
        convertedLines.push(convertedLine);
    }
    
    // إضافة imports للكلاسات المستوردة في البداية (بعد import statements الموجودة)
    if (Object.keys(imports).length > 0) {
        const importsCode = Object.keys(imports).map(name => {
            return `const ${name} = window.${name} || globalThis.${name};`;
        }).join('\n');
        
        // إضافة imports بعد آخر import statement
        let lastImportIndex = -1;
        for (let i = 0; i < convertedLines.length; i++) {
            if (convertedLines[i].trim().startsWith('import')) {
                lastImportIndex = i;
            }
        }
        
        if (lastImportIndex >= 0) {
            convertedLines.splice(lastImportIndex + 1, 0, '', importsCode);
        } else {
            convertedLines.unshift(importsCode);
        }
    }
    
    // التحقق من وجود export default وإضافتها تلقائياً إذا لم تكن موجودة
    // أيضاً إضافة export لجميع الـ classes التي تنتهي بـ Controller
    let hasExportDefault = false;
    let classDefinitionIndex = -1;
    const controllerClasses = [];
    
    for (let i = 0; i < convertedLines.length; i++) {
        const line = convertedLines[i].trim();
        if (line.includes('export default')) {
            hasExportDefault = true;
        }
        // البحث عن class definition
        if (line.startsWith('class ')) {
            if (classDefinitionIndex === -1) {
            classDefinitionIndex = i;
        }
            // استخراج اسم الـ class
            const classMatch = line.match(/class\s+(\w+)/);
            if (classMatch && classMatch[1]) {
                const className = classMatch[1];
                // إذا كان الـ class ينتهي بـ Controller، أضفه للقائمة
                if (className.endsWith('Controller')) {
                    controllerClasses.push({ index: i, name: className });
                }
            }
        }
    }
    
    // إضافة export default للـ class الأول إذا لم يكن موجوداً
    if (!hasExportDefault && classDefinitionIndex >= 0) {
        const classLine = convertedLines[classDefinitionIndex];
        convertedLines[classDefinitionIndex] = 'export default ' + classLine;
    }
    
    // إضافة export لجميع الـ Controller classes الأخرى (named exports)
    // وإضافة كود لإضافتها إلى window/globalThis
    if (controllerClasses.length > 1) {
        const exportStatements = [];
        const windowStatements = [];
        
        controllerClasses.forEach(({ index, name }) => {
            const line = convertedLines[index];
            // إذا لم يكن هناك export، أضفه
            if (!line.includes('export')) {
                convertedLines[index] = line.replace(/^class\s+/, 'export class ');
            }
            // إضافة statement لإضافة الـ class إلى window
            if (name !== 'Controller') {
                windowStatements.push(`if (typeof window !== 'undefined') window.${name} = ${name};`);
                windowStatements.push(`if (typeof globalThis !== 'undefined') globalThis.${name} = ${name};`);
            }
        });
        
        // إضافة window statements في نهاية الملف
        if (windowStatements.length > 0) {
            convertedLines.push('');
            convertedLines.push('// Add all Controller classes to window/globalThis');
            windowStatements.forEach(stmt => convertedLines.push(stmt));
        }
    }
    
    return convertedLines.join('\n');
}

// دالة لحل relative paths إلى absolute paths
function resolveRelativePath(basePath, relativePath) {
    // إزالة query string و hash من basePath
    const cleanBasePath = basePath.split('?')[0].split('#')[0];
    
    // الحصول على origin من window.location أو appConfig
    let origin = '';
    if (typeof window !== 'undefined') {
        origin = window.location.origin;
    }
    
    // تقسيم المسارات
    const baseParts = cleanBasePath.split('/').filter(p => p);
    const relativeParts = relativePath.split('/').filter(p => p);
    // حل relative path
    for (const part of relativeParts) {
        if (part === '..') {
            if (baseParts.length > 0) {
                baseParts.pop();
            }
        } else if (part !== '.') {
            baseParts.push(part);
        }
    }
    
    // إعادة بناء المسار الكامل
    return origin + '/' + baseParts.join('/');
}

class Controller {
    constructor(initializeControllers = false) {
        if(initializeControllers) {
            this.initializeAllControllers();
        }
        // حفظ use statements للاستخدام لاحقاً
        this.useStatements = {};
        
        // تعيين element تلقائياً من selector
        if (this.selector && typeof this.selector === 'function') {
            const selector = this.selector();
            if (selector) {
                this.element = document.querySelector(selector);
            }
        }
    }
    
    /**
     * Method يتم استدعاؤها قبل إرسال AJAX request
     * يمكن override هذه method في Controllers لإضافة منطق قبل الإرسال
     * @param {Object} data - البيانات المرسلة
     * @param {Object} options - خيارات الـ request
     * @returns {Object} - البيانات المعدلة (اختياري)
     */
    beforeOnSend(data, options) {
        // يمكن override في Controllers
        return { data, options };
    }    
    async initializeAllControllers() {
        // التحقق من أن الـ controllers لم يتم تهيئتها من قبل
        if(window.controllersInitialized) {
            return;
        }
        
        if(window.controllers && window.controllers.length > 0){
            window.controllersInitialized = true;

            // حفظ EventHandlers لمنع التكرار
            if (!window.eventHandlers) {
                window.eventHandlers = new Map();
            }
            for (const Ctrl of window.controllers) {
                if (typeof Ctrl !== 'function' || Ctrl === Controller) continue;
                
                // 1️⃣ إنشاء instance
                const controller = new Ctrl();
                // 2️⃣ التأكد من وجود selector
                if (!controller.selector || typeof controller.selector !== 'function') continue;
        
                const sel = controller.selector();
                if (!sel) continue;
        
                const element = document.querySelector(sel);
                if (!element) continue;
        
                // 3️⃣ ربط methods بالأحداث
                Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
                    .filter(m => m !== 'constructor' && m !== 'selector')
                    .forEach(method => {
        
                        const handlerKey = `${Ctrl.name}_${method}_${sel}`;
        
                        if (window.eventHandlers.has(handlerKey)) return;
        
                        const eventHandler = new EventHandler(controller, method, sel);
                        eventHandler.attachEvents();
        
                        window.eventHandlers.set(handlerKey, eventHandler);
                    });
            }
        }
    }
}
// دالة لاكتشاف جميع Controllers في المجلد تلقائياً
async function discoverControllers() {
    const controllers = [];
    const apiPath = '/api/controllers';
    const controllersPath = `${window.location.origin}/Jquery-Framework/app/Http/Controllers/`;
    let controllerFiles = [];
    try {
        // محاولة قراءة المجلد باستخدام fetch (إذا كان الخادم يدعم directory listing)
        const response = await fetch(apiPath);
        if (response.ok) {
            const controllerNames = await response.json();
            for (const fileName of controllerNames) {
                const controllerName = fileName.replace('.js', '');
                controllerFiles.push(controllerName);
            }
        }
    } catch (fetchError) {
        // إذا فشل fetch، استخدم قائمة افتراضية
        console.warn('Directory listing not available, using default controllers list...');
        controllerFiles = ['UserController']; // قائمة افتراضية
    }
    // إضافة Controller نفسه إلى global scope أولاً
    if (typeof window !== 'undefined') {
        window.Controller = Controller;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.Controller = Controller;
    }

    // استيراد جميع Controllers المكتشفة
    for (const controllerName of controllerFiles) {
        try {
            // قراءة الملف وتحليل namespace و use statements تلقائياً
            const controllerFilePath = `${controllersPath}${controllerName}.js`;
            let fileCode = null;
            let imports = {};    
            try {
                const fileResponse = await fetch(controllerFilePath);
                if (fileResponse.ok) {
                    fileCode = await fileResponse.text();
                    // تحليل namespace و use statements من الكود
                    imports = await parseNamespaceAndUse(fileCode, controllerFilePath);
                    
                    // جعل الكلاسات المستوردة متاحة في global scope قبل تحويل الملف
                    for (const [name, value] of Object.entries(imports)) {
                        if (typeof window !== 'undefined') {
                            window[name] = value;
                        }
                        if (typeof globalThis !== 'undefined') {
                            globalThis[name] = value;
                        }
                    }
                }
            } catch (fetchError) {
                // تجاهل خطأ fetch، نكمل مع import
                console.error(`Error fetching ${controllerName}:`, fetchError);
            }
            
            // تحويل الملف قبل استيراده (إزالة namespace و use statements)
            if (fileCode) {
                // التأكد مرة أخرى من أن جميع الكلاسات المستوردة متاحة في global scope
                for (const [name, value] of Object.entries(imports)) {
                    if (typeof window !== 'undefined') {
                        window[name] = value;
                    }
                    if (typeof globalThis !== 'undefined') {
                        globalThis[name] = value;
                    }
                }
                
                const convertedCode = convertNamespaceAndUseToImports(fileCode, imports, controllerFilePath);
                
                // التأكد مرة أخرى قبل إنشاء Blob
                for (const [name, value] of Object.entries(imports)) {
                    if (typeof window !== 'undefined') {
                        window[name] = value;
                    }
                    if (typeof globalThis !== 'undefined') {
                        globalThis[name] = value;
                    }
                }
                
                // إنشاء blob URL للملف المعدل
                const blob = new Blob([convertedCode], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                
                try {
                    // استيراد الملف المعدل
                    const module = await import(blobUrl);
                    
                    // إضافة default export إذا كان موجوداً
                    if (module.default) {
                        // إضافة use statements إلى Controller class
                        module.default.prototype.useStatements = imports;
                        controllers.push(module.default);
                    }
                    
                    // البحث عن جميع الـ classes التي تم تصديرها (named exports)
                    // أو التي تم إضافتها إلى window/globalThis
                    const exportedClasses = Object.keys(module).filter(key => {
                        const value = module[key];
                        return value && typeof value === 'function' && value.prototype && value.prototype.constructor && value !== Controller;
                    });
                    
                    exportedClasses.forEach(className => {
                        if (module[className] && !controllers.includes(module[className])) {
                            module[className].prototype.useStatements = imports;
                            controllers.push(module[className]);
                        }
                    });
                    
                    // البحث عن classes في window/globalThis التي تنتهي بـ Controller
                    // (لأن الكود قد يضيف classes إلى window مباشرة)
                    const windowControllers = Object.keys(window || {}).filter(key => {
                        return key.endsWith('Controller') && 
                                window[key] && 
                                typeof window[key] === 'function' && 
                                window[key].prototype &&
                                window[key] !== Controller &&
                                !controllers.includes(window[key]);
                    });
                    
                    windowControllers.forEach(controllerName => {
                        window[controllerName].prototype.useStatements = imports;
                        controllers.push(window[controllerName]);
                    });
                    
                    URL.revokeObjectURL(blobUrl);
                } catch (importError) {
                    URL.revokeObjectURL(blobUrl);
                    console.error(`Error importing ${controllerName}:`, importError);
                    console.error('Available in window:', Object.keys(window).filter(k => k.includes('Controller') || k.includes('Request')));
                    throw importError;
                }
            } else {
                // إذا فشل fetch، استخدم import عادي
                const module = await import(`${controllersPath}${controllerName}.js`);
                if (module.default) {
                    controllers.push(module.default);
                }
            }
        } catch (importError) {
            console.warn(`Could not import controller ${controllerName}:`, importError);
        }
    }

    return controllers;
}

async function loadControllers() {
    // منع التحميل المتكرر
    if(window.controllersLoading || window.controllersInitialized) {
        return;
    }
    
    window.controllersLoading = true;
    try {
        // اكتشاف جميع Controllers تلقائياً
        const controllers = await discoverControllers();
        window.controllers = controllers || [];
        window.controllersLoaded = true;
        new Controller(true);
    } catch (error) {
        console.error('Error loading controllers:', error);
        window.controllers = [];
    } finally {
        window.controllersLoading = false;
    }
}

export { loadControllers };
export default Controller;
