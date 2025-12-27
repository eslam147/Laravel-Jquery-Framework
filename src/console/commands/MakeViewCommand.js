/**
 * MakeViewCommand - إنشاء View جديد
 */

const BaseCommand = require('./BaseCommand');
const fs = require('fs');
const path = require('path');

class MakeViewCommand extends BaseCommand {
    handle(args) {
        if (!args || args.length === 0) {
            console.error('\x1b[31mError: View name is required\x1b[0m');
            console.log('Example: node artisanJs make:view form');
            console.log('Example: node artisanJs make:view auth/login');
            return;
        }

        const name = args[0];
        const parsed = this.parseViewName(name);

        // Check if file exists
        if (fs.existsSync(parsed.filePath)) {
            console.log('\x1b[33mWarning: File already exists: ' + parsed.filePath + '\x1b[0m');
            return;
        }

        // Read template
        const template = this.readTemplate('View.html.template');

        // Prepare data
        const replacements = {
            VIEW_NAME: parsed.viewName,
            FULL_PATH: parsed.filePath
        };

        // Replace placeholders
        const content = this.replacePlaceholders(template, replacements);

        // Write file
        this.writeFile(parsed.filePath, content);

        console.log('\x1b[32m✅ View created successfully: ' + parsed.filePath + '\x1b[0m');
    }

    /**
     * Parse view name
     */
    parseViewName(name) {
        const parts = name.split('/');
        const viewName = parts[parts.length - 1];
        const namespace = parts.slice(0, -1).join('/');
        
        return {
            viewName: viewName,
            namespace: namespace,
            fullPath: name,
            directory: namespace ? path.join('resources/views', namespace) : 'resources/views',
            filePath: namespace 
                ? path.join('resources/views', namespace, viewName + '.html')
                : path.join('resources/views', viewName + '.html')
        };
    }
}

module.exports = MakeViewCommand;

