function compact(...args) {
    let result = {};
    for (let variable of args) {
        let value = undefined;
        
        // First, try to get from globalThis (works for window variables)
        if (variable in globalThis) {
            value = globalThis[variable];
        } else {
            try {
                value = eval('typeof ' + variable + ' !== "undefined" ? ' + variable + ' : undefined');
            } catch (e) {
                value = undefined;
            }
        }
        if (value !== undefined) {
            result[variable] = value;
        }
    }
    // Always return object (view() needs object, not direct value)
    return result;
}
// دالة لاستخراج القيم من body بناءً على request
function extractValuesFromBody(body, request) {
    const values = {};
    
    // استخراج جميع المتغيرات التي تأخذ قيمها من request
    // مثل: const name = request.name; أو let email = request.email;
    const requestPattern = /(?:const|let|var)\s+(\w+)\s*=\s*request\.(\w+)/g;
    let match;
    
    while ((match = requestPattern.exec(body)) !== null) {
        const varName = match[1]; // اسم المتغير (name, email)
        const requestProp = match[2]; // خاصية request (name, email)
        
        // إذا كان request موجود، حاول الحصول على القيمة
        if (request) {
            try {
                // محاولة الحصول على القيمة من request (يدعم Proxy)
                const value = request[requestProp];
                if (value !== undefined) {
                    values[varName] = value;
                } else if (request.data && requestProp in request.data) {
                    // إذا كان request.data موجود، جرب منه
                    values[varName] = request.data[requestProp];
                }
            } catch (e) {
                // Silent error handling
            }
        }
    }
    
    return values;
}

// دالة لاستخراج القيم من body بناءً على response
// response متاح تلقائياً في globalThis/window
function extractValuesFromResponse(body, response) {
    const values = {};
    
    // إضافة response إلى globalThis إذا لم يكن موجوداً
    if (response) {
        if (typeof window !== 'undefined') {
            window.response = response;
        }
        if (typeof globalThis !== 'undefined') {
            globalThis.response = response;
        }
    }
    
    // استخراج جميع المتغيرات التي تأخذ قيمها من response
    // مثل: var data = response.data; أو const status = response.status;
    // أو: var data = JSON.stringify(response.data, null, 2);
    const responsePattern = /(?:const|let|var)\s+(\w+)\s*=\s*([^;]+)/g;
    let match;
    
    while ((match = responsePattern.exec(body)) !== null) {
        const varName = match[1]; // اسم المتغير (data, status, statusText)
        const assignment = match[2].trim(); // التعبير الكامل (response.data أو JSON.stringify(response.data, null, 2))
        
        // إذا كان التعبير يحتوي على response، حاول الحصول على القيمة
        if (assignment.includes('response')) {
            try {
                let value = undefined;
                
                // إذا كان التعبير بسيط (response.property)
                const simpleMatch = assignment.match(/^response\.(\w+)$/);
                if (simpleMatch) {
                    const responseProp = simpleMatch[1];
                    if (response) {
                        value = response[responseProp];
                        if (value === undefined && response.data && responseProp in response.data) {
                            value = response.data[responseProp];
                        }
                    }
                }
                // إذا كان التعبير معقد (مثل JSON.stringify(response.data, null, 2))
                else {
                    // محاولة تقييم التعبير مع response في scope من globalThis
                    try {
                        // إنشاء function لتقييم التعبير بأمان مع الوصول إلى JSON و response من globalThis
                        const evalFunc = new Function('response', 'JSON', 'return ' + assignment);
                        // استخدام response من globalThis أو من المعامل
                        const responseValue = (typeof globalThis !== 'undefined' && globalThis.response) || response;
                        value = evalFunc(responseValue, JSON);
                    } catch (e) {
                        // إذا فشل التقييم، جرب استخراج الخاصية مباشرة
                        const propMatch = assignment.match(/response\.(\w+)/);
                        if (propMatch && response) {
                            const responseProp = propMatch[1];
                            value = response[responseProp];
                            if (value === undefined && response.data && responseProp in response.data) {
                                value = response.data[responseProp];
                            }
                        }
                    }
                }
                
                if (value !== undefined) {
                    values[varName] = value;
                }
            } catch (e) {
                // Silent error handling
            }
        }
    }
    
    return values;
}

function wrapMethodWithVariableCapture(methodName, originalMethod, context) {
    // Get method body to extract variable names and modify it
    var methodBody = originalMethod.toString();
    // Extract function parameters
    var paramsMatch = methodBody.match(/\(([^)]*)\)/);
    var params = '';
    if (paramsMatch && paramsMatch[1]) {
        params = paramsMatch[1].trim();
    }
    
    var bodyMatch = methodBody.match(/\{([\s\S]*)\}/);
    if (!bodyMatch) {
        // Can't parse, return original
        return originalMethod;
    }
    var body = bodyMatch[1];
    
    // Extract all variable declarations (var, let, const) with their full lines
    // Match pattern: var/let/const variableName = value;
    var lines = body.split('\n');
    var modifiedLines = [];
    var modified = false;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Check if this line has a variable declaration
        var varMatch = line.match(/(var|let|const)\s+(\w+)\s*=/);
        if (varMatch) {
            var varName = varMatch[2];
            // Add registration in globalThis right after the variable assignment
            // Replace the line to add globalThis registration before semicolon
            if (line.trim().endsWith(';')) {
                // Insert globalThis registration before semicolon
                var modifiedLine = line.replace(/;(\s*)$/, function(match, spaces) {
                    return '; if (typeof globalThis !== "undefined") { globalThis["' + varName + '"] = ' + varName + '; }' + (spaces || '');
                });
                modifiedLines.push(modifiedLine);
                modified = true;
            } else {
                // Line doesn't end with semicolon, add the line and then add registration
                modifiedLines.push(line);
                var nextLine = 'if (typeof globalThis !== "undefined") { globalThis["' + varName + '"] = ' + varName + '; }';
                modifiedLines.push(nextLine);
                modified = true;
            }
        } else {
            // No variable declaration, keep line as is
            modifiedLines.push(line);
        }
    }
    
    if (modified) {
        var modifiedBody = modifiedLines.join('\n');
        // Create new function with modified body and original parameters
        try {
            var funcStr = 'return function(' + params + ') {' + modifiedBody + '}';
            var newFunc = new Function(funcStr)();
            // Bind 'this' context
            return function() {
                return newFunc.apply(context, arguments);
            };
        } catch (e) {
            return originalMethod;
        }
    }
    // No modifications needed, return original
    return originalMethod;
}

async function view(path, mount, data) {
    const el = document.querySelector(mount);
    if (!el) return;
    const viewPath = path.replace(/\./g, '/');
    const response = await fetch(`/__views/${viewPath}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify(data)
    });
    const html = await response.text();
    el.innerHTML = html;
    if(currentController.modal && currentController.modal != undefined) {
        var modalSelector = currentController.modal();
        if(modalSelector && currentController.request && modalSelector != null) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const baseSelector = modalSelector.startsWith('.') ? modalSelector.slice(1) : modalSelector.slice(0);
            const allElements = Array.from(doc.querySelectorAll('*')).filter(el => {
                const classes = Array.from(el.classList || []);
                const id = el.id || '';
                return classes.some(c => c.startsWith(baseSelector)) || id.startsWith(baseSelector);
            });
            const suffixes = allElements.map(el => {
                let target = el.id || el.className;
                if (el.classList && el.classList.length > 1 && el.className.includes(' ')) {
                    target = Array.from(el.classList).find(c => c.startsWith(baseSelector));
                }
                const match = target.match(new RegExp(`^${baseSelector}([_-])(.+)$`));
                return match ? { separator: match[1], suffix: match[2] } : null;
            }).filter(Boolean);
            modalSelector = modalSelector + suffixes.map(suffix => suffix.separator + suffix.suffix).join('');
            $(modalSelector).modal('show');
        }
    }
}
// دالة مساعدة لفتح الـ modal
function openModal(modalSelector) {
    // دعم Bootstrap modal
    if (typeof window.$ !== 'undefined' && window.$.fn.modal) {
        const $modal = window.$(modalSelector);
        if ($modal.length > 0) {
            $modal.modal('show');
            return;
        }
    }
    
    // دعم Bootstrap 5 modal (بدون jQuery)
    const modalElement = typeof modalSelector === 'string' ? document.querySelector(modalSelector) : modalSelector;
    if (modalElement) {
        // استخدام Bootstrap 5 Modal API
        if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal) {
            const modal = new window.bootstrap.Modal(modalElement);
            modal.show();
            return;
        }
        
        // Fallback: إضافة class show يدوياً
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        modalElement.setAttribute('aria-hidden', 'false');
        modalElement.setAttribute('aria-modal', 'true');
        
        // إضافة backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'modal-backdrop-' + Date.now();
        document.body.appendChild(backdrop);
        
        // إضافة event listener لإغلاق الـ modal عند الضغط على backdrop
        backdrop.addEventListener('click', () => {
            closeModal(modalSelector);
        });
        
        // إضافة event listener لإغلاق الـ modal عند الضغط على زر الإغلاق
        const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], [data-dismiss="modal"], .close, .btn-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(modalSelector);
            });
        });
    }
}

// دالة مساعدة لإغلاق الـ modal
function closeModal(modalSelector) {
    // دعم Bootstrap modal
    if (typeof window.$ !== 'undefined' && window.$.fn.modal) {
        const $modal = window.$(modalSelector);
        if ($modal.length > 0) {
            $modal.modal('hide');
            return;
        }
    }
    
    // دعم Bootstrap 5 modal
    const modalElement = typeof modalSelector === 'string' ? document.querySelector(modalSelector) : modalSelector;
    if (modalElement) {
        if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal) {
            const modal = window.bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
            return;
        }
        
        // Fallback: إزالة class show يدوياً
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.setAttribute('aria-modal', 'false');
        
        // إزالة backdrop
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
    }
}
// دالة helper للحصول على المسارات الديناميكية
function getPath(type, relativePath = '') {
    if (typeof window !== 'undefined' && window.appConfig) {
        const config = window.appConfig;
        const pathMap = {
            vendor: config.vendorPath,
            app: config.appPath,
            views: config.viewsPath,
            base: config.basePath
        };
        
        const base = pathMap[type] || '';
        return relativePath ? base + relativePath : base;
    }
    
    // Fallback للمسارات النسبية
    const fallbackPaths = {
        vendor: '../../../vendor/',
        app: '../../../app/',
        views: '../../../resources/views/',
        base: '../../../'
    };
    
    const base = fallbackPaths[type] || '';
    return relativePath ? base + relativePath : base;
}

window.compact = compact;
window.wrapMethodWithVariableCapture = wrapMethodWithVariableCapture;
window.extractValuesFromBody = extractValuesFromBody;
window.extractValuesFromResponse = extractValuesFromResponse;
window.view = view;
window.getPath = getPath;