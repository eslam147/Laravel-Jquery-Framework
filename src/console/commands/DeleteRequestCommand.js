/**
 * DeleteRequestCommand - حذف Request class
 */

const BaseCommand = require('./BaseCommand');
const fs = require('fs');
const path = require('path');

class DeleteRequestCommand extends BaseCommand {
    handle(args) {
        if (!args || args.length === 0) {
            console.error('\x1b[31mError: Request name is required\x1b[0m');
            console.log('Example: node artisanJs delete:request UserRequest');
            console.log('Example: node artisanJs delete:request Auth/LoginRequest');
            return;
        }

        const name = args[0];
        const parsed = this.parseName(name);

        // Check if file exists
        if (!fs.existsSync(parsed.filePath)) {
            console.log('\x1b[33mWarning: File does not exist: ' + parsed.filePath + '\x1b[0m');
            return;
        }

        // Remove from boot.js first
        this.removeFromBootJs(parsed);

        // Delete file
        try {
            fs.unlinkSync(parsed.filePath);
            console.log('\x1b[32m✅ Request deleted successfully: ' + parsed.filePath + '\x1b[0m');
        } catch (error) {
            console.error('\x1b[31mError: Failed to delete file: ' + error.message + '\x1b[0m');
        }
    }

    /**
     * Remove request from boot.js automatically
     */
    removeFromBootJs(parsed) {
        const bootJsPath = path.join(process.cwd(), 'vendor/src/js/boot.js');
        
        if (!fs.existsSync(bootJsPath)) {
            console.log('\x1b[33mWarning: boot.js not found, skipping removal\x1b[0m');
            return;
        }

        try {
            let bootJsContent = fs.readFileSync(bootJsPath, 'utf8');
            
            // حساب المسار النسبي من public/
            const relativePath = parsed.filePath.replace(new RegExp('^public[\\\\/]Jquery-Framework[\\\\/]app[\\\\/]'), '').replace(/\\/g, '/');
            // تحقق من وجود الملف في boot.js
            if (!bootJsContent.includes(relativePath)) {
                console.log('\x1b[33mInfo: Request not found in boot.js\x1b[0m');
                return;
            }
            
            // إزالة السطر الخاص بالـ request (مع علامات الاقتباس والفاصلة ونهاية السطر)
            const pattern = new RegExp('\\s+[\'"]' + relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"],?\\s*\\n', 'g');
            bootJsContent = bootJsContent.replace(pattern, '');
            
            // كتابة boot.js بعد التعديل
            fs.writeFileSync(bootJsPath, bootJsContent, 'utf8');
            console.log('\x1b[32m✅ Request removed from boot.js automatically\x1b[0m');
        } catch (error) {
            console.log('\x1b[33mWarning: Failed to update boot.js: ' + error.message + '\x1b[0m');
        }
    }
}

module.exports = DeleteRequestCommand;
