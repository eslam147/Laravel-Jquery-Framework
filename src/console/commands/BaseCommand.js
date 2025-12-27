/**
 * BaseCommand - الكلاس الأساسي للأوامر
 */

const fs = require('fs');
const path = require('path');

class BaseCommand {
    constructor() {
        // يمكن استخدام Console methods بشكل static
    }

    /**
     * تنفيذ الأمر (يجب override في الأوامر الفرعية)
     */
    handle(args) {
        throw new Error('يجب override method handle()');
    }

    /**
     * إنشاء مجلد إذا لم يكن موجوداً
     */
    ensureDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            return true;
        }
        return false;
    }

    /**
     * كتابة ملف
     */
    writeFile(filePath, content) {
        const dir = path.dirname(filePath);
        this.ensureDirectory(dir);
        fs.writeFileSync(filePath, content, 'utf8');
    }

    /**
     * قراءة template
     */
    readTemplate(templateName) {
        // Templates are now in vendor/src/console/templates
        const templatePath = path.join(__dirname, '../templates', templateName);
        if (!fs.existsSync(templatePath)) {
            throw new Error('Template غير موجود: ' + templateName);
        }
        return fs.readFileSync(templatePath, 'utf8');
    }

    /**
     * استبدال placeholders في template
     */
    replacePlaceholders(template, replacements) {
        let result = template;
        for (const key in replacements) {
            const regex = new RegExp('{{' + key + '}}', 'g');
            result = result.replace(regex, replacements[key]);
        }
        return result;
    }

    /**
     * تحليل الاسم (مثل Auth/LoginRequest)
     */
    parseName(name) {
        const parts = name.split('/');
        const className = parts[parts.length - 1];
        const namespace = parts.slice(0, -1).join('/');
        
        return {
            className: className,
            namespace: namespace,
            fullPath: name,
            directory: namespace ? path.join('public/Jquery-Framework/app/Http/requests', namespace) : 'public/Jquery-Framework/app/Http/requests',
            filePath: namespace 
                ? path.join('public/Jquery-Framework/app/Http/requests', namespace, className + '.js')
                : path.join('public/Jquery-Framework/app/Http/requests', className + '.js')
        };
    }
}

module.exports = BaseCommand;

