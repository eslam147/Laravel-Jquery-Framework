/**
 * DeleteControllerCommand - حذف Controller class
 */

const BaseCommand = require('./BaseCommand');
const fs = require('fs');
const path = require('path');
class DeleteControllerCommand extends BaseCommand {
    handle(args) {
        if (!args || args.length === 0) {
            console.error('\x1b[31mError: Controller name is required\x1b[0m');
            console.log('Example: node artisanJs delete:controller ButtonController');
            return;
        }

        const name = args[0];
        const parsed = this.parseControllerName(name);

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
            console.log('\x1b[32m✅ Controller deleted successfully: ' + parsed.filePath + '\x1b[0m');
        } catch (error) {
            console.error('\x1b[31mError: Failed to delete file: ' + error.message + '\x1b[0m');
        }
    }

    /**
     * Parse controller name and generate path
     */
    parseControllerName(name) {
        const parts = name.split('/');
        const className = parts[parts.length - 1];
        const namespace = parts.slice(0, -1).join('/');
        
        return {
            className: className,
            namespace: namespace,
            fullPath: name,
            directory: namespace ? path.join('public/Jquery-Framework/app/Http/controllers', namespace) : 'public/Jquery-Framework/app/Http/controllers',
            filePath: namespace 
                ? path.join('public/Jquery-Framework/app/Http/controllers', namespace, className + '.js')
                : path.join('public/Jquery-Framework/app/Http/controllers', className + '.js')
        };
    }

    /**
     * Remove controller from boot.js automatically
     */
    removeFromBootJs(parsed) {
        const bootJsPath = path.join(process.cwd(), 'vendor/src/js/boot.js');
        
        if (!fs.existsSync(bootJsPath)) {
            console.log('\x1b[33mWarning: boot.js not found, skipping removal\x1b[0m');
            return;
        }

        try {
            let bootJsContent = fs.readFileSync(bootJsPath, 'utf8');
            
            // Calculate relative path from public/Jquery-Framework/app/ to controller
            const relativePath = parsed.filePath.replace(new RegExp('^public[\\\\/]Jquery-Framework[\\\\/]app[\\\\/]'), '').replace(/\\/g, '/');
            
            // Check if controller exists in boot.js
            if (!bootJsContent.includes(relativePath)) {
                console.log('\x1b[33mInfo: Controller not found in boot.js\x1b[0m');
                return;
            }
            
            // Remove the controller line (with quotes, comma, and newline)
            // Pattern: '        'Http/controllers/ControllerName.js',\n'
            const pattern = new RegExp('\\s+[\'"]' + relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"],?\\s*\\n', 'g');
            bootJsContent = bootJsContent.replace(pattern, '');
            
            // Write updated boot.js
            fs.writeFileSync(bootJsPath, bootJsContent, 'utf8');
            console.log('\x1b[32m✅ Controller removed from boot.js automatically\x1b[0m');
        } catch (error) {
            console.log('\x1b[33mWarning: Failed to update boot.js: ' + error.message + '\x1b[0m');
        }
    }
}

module.exports = DeleteControllerCommand;

