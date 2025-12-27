/**
 * MakeControllerCommand - إنشاء Controller class جديد
 */

const BaseCommand = require('./BaseCommand');
const fs = require('fs');
const path = require('path');

class MakeControllerCommand extends BaseCommand {
    handle(args) {
        if (!args || args.length === 0) {
            console.error('\x1b[31mError: Controller name is required\x1b[0m');
            console.log('Example: node artisanJs make:controller ButtonController');
            console.log('Example: node artisanJs make:controller ButtonController --id');
            console.log('Example: node artisanJs make:controller ButtonController --class');
            console.log('Example: node artisanJs make:controller TestReadController --match="_"');
            console.log('Example: node artisanJs make:controller TestReadController --match="-"');
            return;
        }

        const name = args[0];
        
        // Parse options
        let selectorType = 'class'; // default
        let matchChar = '.';
        
        for (let i = 1; i < args.length; i++) {
            if (args[i] === '--id') {
                selectorType = 'id';
            } else if (args[i] === '--class') {
                selectorType = 'class';
            } else if (args[i] === '--match' && i + 1 < args.length) {
                const matchValue = args[i + 1];
                matchChar = matchValue.replace(/^["']|["']$/g, '');
                // If empty after removing quotes, use the original value
                if (!matchChar && matchValue) {
                    matchChar = matchValue;
                }
            }
        }
        
        const parsed = this.parseControllerName(name, selectorType, matchChar);

        // Check if file exists
        if (fs.existsSync(parsed.filePath)) {
            console.log('\x1b[33mWarning: File already exists: ' + parsed.filePath + '\x1b[0m');
            return;
        }

        // Read template
        const template = this.readTemplate('Controller.js.template');

        // Prepare data
        const replacements = {
            CLASS_NAME: parsed.className,
            FULL_PATH: parsed.filePath,
            SELECTOR: parsed.selector
        };

        // Replace placeholders
        const content = this.replacePlaceholders(template, replacements);

        // Write file
        this.writeFile(parsed.filePath, content);

        // Add controller to boot.js automatically
        this.addToBootJs(parsed);

        console.log('\x1b[32m✅ Controller created successfully: ' + parsed.filePath + '\x1b[0m');
    }

    /**
     * Add controller to boot.js automatically
     */
    addToBootJs(parsed) {
        const bootJsPath = path.join(process.cwd(), 'vendor/src/js/boot.js');
        
        if (!fs.existsSync(bootJsPath)) {
            console.log('\x1b[33mWarning: boot.js not found, skipping auto-registration\x1b[0m');
            return;
        }

        try {
            let bootJsContent = fs.readFileSync(bootJsPath, 'utf8');
            
            // Calculate relative path from app/ to controller
            // boot.js paths are relative to app/, so from app/Http/controllers/Modal1Controller.js
            // the path should be: 'Http/controllers/Modal1Controller.js'
            const relativePath = parsed.filePath.replace(new RegExp('^public[\\\\/]Jquery-Framework[\\\\/]app[\\\\/]'), '').replace(/\\/g, '/');
            
            // Check if controller already exists
            if (bootJsContent.includes(relativePath)) {
                console.log('\x1b[33mInfo: Controller already registered in boot.js\x1b[0m');
                return;
            }
            
            // Find the Routes comment to insert before it
            const routesCommentIndex = bootJsContent.indexOf('// Routes (must load after controllers)');
            
            if (routesCommentIndex === -1) {
                console.log('\x1b[33mWarning: Could not find Routes comment in boot.js\x1b[0m');
                return;
            }
            
            // Find the last controller line before Routes comment
            const beforeRoutes = bootJsContent.substring(0, routesCommentIndex);
            const controllerPattern = /(\s+)(['"])(public\/Jquery-Framework\/app\/Http\/controllers\/[^'"]+\.js)\2,?\s*\n/g;
            const lastControllerMatch = [...beforeRoutes.matchAll(controllerPattern)].pop();
            
            if (lastControllerMatch) {
                // Insert after last controller
                const insertIndex = lastControllerMatch.index + lastControllerMatch[0].length;
                const indent = lastControllerMatch[1];
                const newLine = indent + "'" + relativePath + "',\n";
                bootJsContent = bootJsContent.slice(0, insertIndex) + newLine + bootJsContent.slice(insertIndex);
            } else {
                // If no controllers found, add after LanguageController line
                const languageControllerIndex = bootJsContent.indexOf("'public/Jquery-Framework/app/Http/controllers/LanguageController.js'");
                if (languageControllerIndex !== -1) {
                    const insertIndex = bootJsContent.indexOf('\n', languageControllerIndex) + 1;
                    const indent = '        ';
                    const newLine = indent + "'" + relativePath + "',\n";
                    bootJsContent = bootJsContent.slice(0, insertIndex) + newLine + bootJsContent.slice(insertIndex);
                } else {
                    console.log('\x1b[33mWarning: Could not find insertion point in boot.js\x1b[0m');
                    return;
                }
            }
            
            // Write updated boot.js
            fs.writeFileSync(bootJsPath, bootJsContent, 'utf8');
            console.log('\x1b[32m✅ Controller added to boot.js automatically\x1b[0m');
        } catch (error) {
            console.log('\x1b[33mWarning: Failed to update boot.js: ' + error.message + '\x1b[0m');
        }
    }

    /**
     * Parse controller name and generate selector
     */
    parseControllerName(name, selectorType, matchChar) {
        const parts = name.split('/');
        const className = parts[parts.length - 1];
        const namespace = parts.slice(0, -1).join('/');
        
        // Generate selector from class name
        let selector = '';
        if (selectorType === 'id') {
            // Convert ButtonController to #button
            selector = '#' + this.toKebabCase(className.replace(/Controller$/, ''));
        } else {
            // Convert ButtonController to .button
            selector = '.' + this.toKebabCase(className.replace(/Controller$/, ''));
        }
        
        // Apply match character if specified
        if (matchChar && matchChar !== '.') {
            selector = selector.replace(/\./g, matchChar);
        }
        
        return {
            className: className,
            namespace: namespace,
            fullPath: name,
            directory: namespace ? path.join('public/Jquery-Framework/app/Http/controllers', namespace) : 'public/Jquery-Framework/app/Http/controllers',
            filePath: namespace 
                ? path.join('public/Jquery-Framework/app/Http/controllers', namespace, className + '.js')
                : path.join('public/Jquery-Framework/app/Http/controllers', className + '.js'),
            selector: selector
        };
    }

    /**
     * Convert string to kebab-case
     */
    toKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase();
    }
}

module.exports = MakeControllerCommand;

