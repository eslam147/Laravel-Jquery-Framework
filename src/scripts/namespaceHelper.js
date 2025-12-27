// Helper لتحليل namespace و use statements مثل Laravel
import { getPath } from './pathHelper.js';

// دالة لتحليل use statement
function parseUse(statement) {
    // دعم use App\Http\Requests\UserRequest;
    const match = statement.match(/use\s+([^;]+);?/);
    if (match) {
        return match[1].trim();
    }
    return null;
}

// دالة لاستخراج اسم الكلاس من namespace
function getClassName(namespace) {
    return namespace.split(/[\\\/]/).pop();
}

/**
 * دالة لتحليل namespace و use statements من الملف الحالي
 * وتحويلها إلى imports تلقائياً
 * يتم استدعاؤها تلقائياً عند تحميل الملف
 */
export async function useNamespace() {
    // الحصول على الملف الحالي من import.meta.url
    let callerFile = null;
    
    try {
        if (typeof import.meta !== 'undefined' && import.meta.url) {
            callerFile = new URL(import.meta.url).pathname;
        } else {
            // Fallback: استخدام stack trace
            const stack = new Error().stack;
            const stackLines = stack.split('\n');
            for (let i = 2; i < stackLines.length && i < 5; i++) {
                const match = stackLines[i].match(/(?:file:\/\/\/|http:\/\/[^\/]+)([^:\)]+)/);
                if (match) {
                    callerFile = match[1];
                    break;
                }
            }
        }
        
        if (!callerFile) {
            console.warn('Could not determine current file for namespace parsing');
            return {};
        }
        
        // قراءة الملف
        const response = await fetch(callerFile);
        if (!response.ok) {
            console.warn(`Could not read file ${callerFile} for namespace parsing`);
            return {};
        }
        
        const code = await response.text();
        return await parseNamespaceAndUse(code);
    } catch (error) {
        console.warn('Error reading file for namespace parsing:', error);
        return {};
    }
}

/**
 * دالة لتحليل namespace و use statements من الكود
 * 
 * @param {string} code - الكود المصدري
 * @param {string} filePath - مسار الملف (اختياري)
 * @returns {Promise<Object>} - الكائنات المستوردة
 */
export async function parseNamespaceAndUse(code, filePath = null) {
    const lines = code.split('\n');
    const imports = {};
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // تحليل use statements (حتى لو كانت في comments أو syntax errors)
        // دعم: use App\Http\Requests\UserRequest;
        // دعم: use App/Http/Requests/UserRequest;
        // دعم: use Jquery-Framework\scripts\Controller;
        if (trimmedLine.startsWith('use') && !trimmedLine.startsWith('//')) {
            const namespace = parseUse(trimmedLine);
            if (namespace) {
                // تحويل namespace إلى format صحيح (استبدال / بـ \)
                const normalizedNamespace = namespace.replace(/\//g, '\\');
                const className = getClassName(normalizedNamespace);
                // استخدام dynamic import لتجنب circular dependency
                const { use } = await import('./pathHelper.js');
                const importedClass = await use(normalizedNamespace);
                imports[className] = importedClass;
            }
        }
    }
    
    return imports;
}

/**
 * دالة لتحميل namespace و use statements تلقائياً
 * يتم استدعاؤها في top-level عند تحميل الملف
 */
export async function autoLoadNamespace() {
    const imports = await useNamespace();
    
    // جعل الكلاسات المستوردة متاحة في global scope
    for (const [name, value] of Object.entries(imports)) {
        if (typeof window !== 'undefined') {
            window[name] = value;
        }
        if (typeof globalThis !== 'undefined') {
            globalThis[name] = value;
        }
    }
    
    return imports;
}

// دالة لحل relative paths إلى absolute paths
function resolveRelativePath(basePath, relativePath) {
    // إزالة query string و hash من basePath
    const cleanBasePath = basePath.split('?')[0].split('#')[0];
    
    // الحصول على origin من window.location
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

/**
 * دالة لتحويل namespace و use statements إلى imports صحيحة
 * يمكن استخدامها مع Controllers و Requests
 */
export async function convertNamespaceAndUseToImports(code, filePath) {
    // تحليل namespace و use statements أولاً
    const imports = await parseNamespaceAndUse(code, filePath);
    
    // جعل الكلاسات المستوردة متاحة في global scope
    for (const [name, value] of Object.entries(imports)) {
        if (typeof window !== 'undefined') {
            window[name] = value;
        }
        if (typeof globalThis !== 'undefined') {
            globalThis[name] = value;
        }
    }
    
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
        // دعم: public function rules() { -> rules() {
        // دعم: private function helper() { -> helper() {
        // دعم: protected function helper() { -> helper() {
        let convertedLine = line;
        // البحث عن public/private/protected function داخل class body
        // regex يطابق: (مسافات)(public|private|protected) function methodName(
        const publicFunctionMatch = convertedLine.match(/(\s*)(public|private|protected)\s+function\s+(\w+)\s*\(/);
        if (publicFunctionMatch) {
            // استبدال public/private/protected function بـ method syntax فقط (بدون function)
            // مثال: "    public function rules() {" -> "    rules() {"
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
    let hasExportDefault = false;
    let classDefinitionIndex = -1;
    
    for (let i = 0; i < convertedLines.length; i++) {
        const line = convertedLines[i].trim();
        if (line.includes('export default')) {
            hasExportDefault = true;
        }
        // البحث عن class definition
        if (line.startsWith('class ') && classDefinitionIndex === -1) {
            classDefinitionIndex = i;
        }
    }
    
    // إذا لم يكن هناك export default وكان هناك class definition
    if (!hasExportDefault && classDefinitionIndex >= 0) {
        // إضافة export default قبل class definition
        const classLine = convertedLines[classDefinitionIndex];
        convertedLines[classDefinitionIndex] = 'export default ' + classLine;
    }
    
    return convertedLines.join('\n');
}

