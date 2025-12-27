/**
 * MakeRequestCommand - إنشاء Request class جديد
 */

const BaseCommand = require('./BaseCommand');
const fs = require('fs');
const path = require('path');

class MakeRequestCommand extends BaseCommand {
    handle(args) {
        if (!args || args.length === 0) {
            console.error('\x1b[31mError: Request name is required\x1b[0m');
            console.log('Example: node artisanJs make:request Auth/LoginRequest');
            return;
        }

        const name = args[0];
        const parsed = this.parseName(name);

        // Check if file exists
        if (fs.existsSync(parsed.filePath)) {
            console.log('\x1b[33mWarning: File already exists: ' + parsed.filePath + '\x1b[0m');
            return;
        }

        // Read template
        const template = this.readTemplate('Request.js.template');

        // Prepare data
        const replacements = {
            CLASS_NAME: parsed.className,
            FULL_PATH: parsed.filePath
        };

        // Replace placeholders
        const content = this.replacePlaceholders(template, replacements);

        // Write file
        this.writeFile(parsed.filePath, content);

        // Add request to boot.js automatically
        this.addToBootJs(parsed);

        console.log('\x1b[32m✅ Request created successfully: ' + parsed.filePath + '\x1b[0m');
    }

    /**
     * Add request to boot.js automatically
     */
    addToBootJs(parsed) {
        const bootJsPath = path.join(process.cwd(), 'vendor/src/js/boot.js');
        
        if (!fs.existsSync(bootJsPath)) {
            console.log('\x1b[33mWarning: boot.js not found, skipping auto-registration\x1b[0m');
            return;
        }

        try {
            let bootJsContent = fs.readFileSync(bootJsPath, 'utf8');
            
            // Calculate relative path from app/ to request
            // boot.js paths are relative to app/, so from app/Http/requests/UserRequest.js
            // the path should be: 'Http/requests/UserRequest.js'
            const relativePath = parsed.filePath.replace(new RegExp('^public[\\\\/]app[\\\\/]Jquery-Framework[\\\\/]'), '').replace(/\\/g, '/');
            
            // Check if request already exists
            if (bootJsContent.includes(relativePath)) {
                console.log('\x1b[33mInfo: Request already registered in boot.js\x1b[0m');
                return;
            }
            
            // Find the Requests section comment
            const requestsCommentIndex = bootJsContent.indexOf('// Requests (Jquery-Framework/scripts/Requests for FormRequest, app/Http/requests for UserRequest)');
            
            if (requestsCommentIndex === -1) {
                console.log('\x1b[33mWarning: Could not find Requests comment in boot.js\x1b[0m');
                return;
            }
            
            // Find the Controllers comment to insert before it
            const controllersCommentIndex = bootJsContent.indexOf('// Controllers (Jquery-Framework/scripts/controllers for Controller, app/Http/controllers for others)');
            
            if (controllersCommentIndex === -1) {
                console.log('\x1b[33mWarning: Could not find Controllers comment in boot.js\x1b[0m');
                return;
            }
            
            // Get the section between Requests and Controllers comments
            const requestsSection = bootJsContent.substring(requestsCommentIndex, controllersCommentIndex);
            
            // Find the last request line in this section
            const requestPattern = /(\s+)(['"])(public\/Jquery-Framework\/app\/Http\/requests\/[^'"]+\.js)\2,?\s*\n/g;
            const lastRequestMatch = [...requestsSection.matchAll(requestPattern)].pop();
            
            if (lastRequestMatch) {
                // Insert after last request (relative to full content)
                const insertIndex = requestsCommentIndex + lastRequestMatch.index + lastRequestMatch[0].length;
                const indent = lastRequestMatch[1];
                const newLine = indent + "'" + relativePath + "',\n";
                bootJsContent = bootJsContent.slice(0, insertIndex) + newLine + bootJsContent.slice(insertIndex);
            } else {
                // If no requests found (only FormRequest), add after UserRequest line
                const userRequestIndex = bootJsContent.indexOf("'public/Jquery-Framework/app/Http/requests/UserRequest.js'");
                if (userRequestIndex !== -1 && userRequestIndex < controllersCommentIndex) {
                    const insertIndex = bootJsContent.indexOf('\n', userRequestIndex) + 1;
                    const indent = '        ';
                    const newLine = indent + "'" + relativePath + "',\n";
                    bootJsContent = bootJsContent.slice(0, insertIndex) + newLine + bootJsContent.slice(insertIndex);
                } else {
                    // Add after FormRequest
                    const formRequestIndex = bootJsContent.indexOf("'Jquery-Framework/scripts/Requests/FormRequest.js'");
                    if (formRequestIndex !== -1) {
                        const insertIndex = bootJsContent.indexOf('\n', formRequestIndex) + 1;
                        const indent = '        ';
                        const newLine = indent + "'" + relativePath + "',\n";
                        bootJsContent = bootJsContent.slice(0, insertIndex) + newLine + bootJsContent.slice(insertIndex);
                    } else {
                        console.log('\x1b[33mWarning: Could not find insertion point in boot.js\x1b[0m');
                        return;
                    }
                }
            }
            
            // Write updated boot.js
            fs.writeFileSync(bootJsPath, bootJsContent, 'utf8');
            console.log('\x1b[32m✅ Request added to boot.js automatically\x1b[0m');
        } catch (error) {
            console.log('\x1b[33mWarning: Failed to update boot.js: ' + error.message + '\x1b[0m');
        }
    }
}

module.exports = MakeRequestCommand;

