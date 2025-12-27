import { getPath } from './pathHelper.js';

// دالة لمعالجة الأحداث
export class EventHandler {
    constructor(controller, method, selector) {
        this.controller = controller;
        this.method = method;
        this.selector = selector;
        this.element = document.querySelector(selector);
        this.eventHandler = null; // حفظ الـ handler function لإزالته لاحقاً
        this.eventName = null; // حفظ اسم الحدث
    }

    // ربط الأحداث بالعناصر
    attachEvents() {
        if (!this.element) return;

        // تحديد نوع الحدث بناءً على اسم الـ method
        const eventName = this.getEventName(this.method);
        
        if (!eventName) {
            return;
        }

        // للـ scroll event، يمكن ربطه على window أو العنصر نفسه
        const targetElement = (eventName === 'scroll' && this.selector === '.example-scroll') 
            ? this.element 
            : this.element;

        // إنشاء مفتاح فريد للتحقق من ربط الحدث
        const eventKey = `__event_${this.selector}_${this.method}_${eventName}`;
        
        // التحقق من أن الحدث لم يتم ربطه من قبل على هذا العنصر
        if (targetElement[eventKey]) {
            return; // الحدث مربوط بالفعل
        }

        // إزالة الـ listener السابق إذا كان موجوداً (للأمان)
        if (this.eventHandler && this.eventName) {
            targetElement.removeEventListener(this.eventName, this.eventHandler);
        }

        // إنشاء الـ handler function
        this.eventHandler = async (e) => {
            // للـ scroll event، قد لا يكون هناك target
            if (!e) return;
            
            // التأكد من وجود بيانات في الحدث (لكن scroll قد لا يكون له target)
            // للـ dblclick و click، e.target قد يكون null في بعض الحالات النادرة
            if (eventName !== 'scroll' && eventName !== 'dblclick' && eventName !== 'click' && !e.target) return;
            
            // للـ dblclick و click، استخدم e.currentTarget إذا لم يكن e.target موجوداً
            if ((eventName === 'dblclick' || eventName === 'click') && !e.target && e.currentTarget) {
                e.target = e.currentTarget;
            }
            
            // للـ dblclick، التأكد من أن e.target موجود
            if (eventName === 'dblclick' && !e.target) {
                e.target = e.currentTarget || this.element;
            }

            // للـ submit، التأكد من وجود form
            if (eventName === 'submit') {
                const form = e.target.closest('form');
                if (!form) return;
                e.preventDefault();
            }
            // للـ click، نستدعي handleEvent أولاً
            await this.handleEvent(e, eventName);
        };

        // حفظ اسم الحدث
        this.eventName = eventName;

        // ربط الحدث
        targetElement.addEventListener(eventName, this.eventHandler);
        
        // وضع علامة أن الحدث مربوط
        targetElement[eventKey] = true;
    }

    // تحديد نوع الحدث بناءً على اسم الـ method
    getEventName(method) {
        // إذا كان method يبدأ بـ 'on'، أزل 'on' واستخدم الباقي كاسم الحدث
        let eventName = method;
        if (method.toLowerCase().startsWith('on')) {
            // تحويل onClick -> click, onChange -> change
            eventName = method.substring(2);
            // تحويل أول حرف إلى صغير: onClick -> click
            eventName = eventName.charAt(0).toLowerCase() + eventName.slice(1);
        }
        
        const eventMap = {
            // Form events
            'submit': 'submit',
            'reset': 'reset',
            
            // Input events
            'change': 'change',
            'input': 'input',
            'blur': 'blur',
            'focus': 'focus',
            'focusin': 'focusin',
            'focusout': 'focusout',
            'select': 'select',
            'invalid': 'invalid',
            
            // Mouse events
            'click': 'click',
            'dblclick': 'dblclick',
            'contextmenu': 'contextmenu',
            'mouseenter': 'mouseenter',
            'mouseleave': 'mouseleave',
            'mouseover': 'mouseover',
            'mouseout': 'mouseout',
            'mousedown': 'mousedown',
            'mouseup': 'mouseup',
            'mousemove': 'mousemove',
            'wheel': 'wheel',
            
            // Keyboard events
            'keyup': 'keyup',
            'keydown': 'keydown',
            'keypress': 'keypress',
            
            // Touch events
            'touchstart': 'touchstart',
            'touchend': 'touchend',
            'touchmove': 'touchmove',
            'touchcancel': 'touchcancel',
            
            // Drag & Drop events
            'drag': 'drag',
            'dragstart': 'dragstart',
            'dragend': 'dragend',
            'dragover': 'dragover',
            'dragenter': 'dragenter',
            'dragleave': 'dragleave',
            'drop': 'drop',
            
            // Window/Document events
            'scroll': 'scroll',
            'resize': 'resize',
            'load': 'load',
            'unload': 'unload',
            'beforeunload': 'beforeunload',
            'error': 'error',
            
            // Media events
            'play': 'play',
            'pause': 'pause',
            'ended': 'ended',
            'volumechange': 'volumechange',
            'timeupdate': 'timeupdate'
        };

        // البحث المباشر (case-sensitive)
        if (eventMap[eventName]) {
            return eventMap[eventName];
        }

        // البحث case-insensitive
        const eventNameLower = eventName.toLowerCase();
        for (const [key, value] of Object.entries(eventMap)) {
            if (eventNameLower === key.toLowerCase()) {
                return value;
            }
        }
        return null;
    }
    // معالجة الحدث
    async handleEvent(event, eventName) {
        // التأكد من وجود selector
        if (!this.selector) {
            return;
        }
        // التأكد من وجود العنصر في DOM
        const target = event.target.closest(this.selector);
        let request = null;
        let RequestClassName = null;
        if (!target) return;    
        // إضافة element و event إلى controller للوصول إليهما في methods
        // للـ scroll event، استخدم العنصر نفسه بدلاً من event.target
        this.element = target;
        this.controller.element = target;
        this.controller.event = event;
        // التحقق أولاً إذا كان هناك route مطابق (AJAX route)
        if (typeof window !== 'undefined' && window.Route) {
            const route = this.findMatchingRoute();
            if (route) {
                // جمع البيانات من form إذا كان موجوداً
                try {
                    // إنشاء Request
                    // إذا كان هناك RequestClassName في معاملات الدالة (يبدأ بحرف كبير)، أنشئ FormRequest
                    if (RequestClassName) {
                        // محاولة استخدام Request من global scope أولاً (من use statement)
                        let RequestClass = null;
                        
                        if (typeof window !== 'undefined' && window[RequestClassName]) {
                            RequestClass = window[RequestClassName];
                        } else if (typeof globalThis !== 'undefined' && globalThis[RequestClassName]) {
                            RequestClass = globalThis[RequestClassName];
                        }  
                        // إذا لم يكن موجوداً في global scope، استورده من الملف
                        if (!RequestClass) {
                            try {
                                const RequestModule = await import(getPath('app', `Http/Requests/${RequestClassName}.js`));
                                RequestClass = RequestModule.default;
                            } catch (importError) {
                                const RequestModule = await import(getPath('base', `Jquery-Framework/scripts/Requests/Request.js`));
                                RequestClass = RequestModule.default;
                            }
                        }
                        request = new RequestClass(this.selector);
                    } else {
                        // إذا لم يكن هناك RequestClassName، استخدم Request عادي (بدون فاليديشن)
                        const RequestModule = await import(getPath('base', `Jquery-Framework/scripts/Requests/Request.js`));
                        const RequestClass = RequestModule.default;
                        request = new RequestClass(this.selector);
                    }
                    // التأكد من وجود request
                    if (!request) {
                        return;
                    }
                    if (request.authorize && typeof request.authorize === 'function') {
                        const authResult = request.authorize();
                        if (authResult === false) {
                            this.handleAuthorizeError('Unauthorized');
                            return;
                        }
                        if (typeof authResult === 'object') {
                            if (authResult.allowed === false) {
                                this.handleAuthorizeError(authResult.message || 'Unauthorized');
                                return;
                            }
                        }
                    }
                    // للـ submit فقط، يجب تنفيذ الفاليديشن
                    if (eventName === 'submit' && request.validate && typeof request.validate === 'function') {
                        request.validate();
                    }
                    
                    // التأكد من وجود errors
                    if (!request.errors || typeof request.errors !== 'object') {
                        request.errors = {};
                    }
                    
                    this.controller.request = request;
                    
                    // للـ submit فقط، التحقق من الفاليديشن
                    const hasErrors = request.errors && typeof request.errors === 'object' && Object.keys(request.errors).length > 0;
                    if (hasErrors) {
                        return;
                    } else {
                        let requestData = {};
                        const form = this.element.closest('form');
                        if(form){
                            const formData = new FormData(form);
                            requestData = Object.fromEntries(formData);
                        }
                        // استدعاء beforeOnSend قبل إرسال AJAX request
                        let requestOptions = route.options || {};
                        if (this.controller.beforeOnSend && typeof this.controller.beforeOnSend === 'function') {
                            const result = this.controller.beforeOnSend(requestData, requestOptions);
                            if (result && typeof result === 'object') {
                                if (result.data !== undefined) {
                                    requestData = result.data;
                                }
                                if (result.options !== undefined) {
                                    requestOptions = { ...requestOptions, ...result.options };
                                }
                            }
                        }
                        const response = await window.Route.sendRequest(route.method, route.url, requestData, requestOptions);
                        if (typeof window !== 'undefined') {
                            window.response = response;
                        }
                        if (typeof globalThis !== 'undefined') {
                            globalThis.response = response;
                        }
                        // استخراج القيم من body بناءً على response (مثل extractValuesFromBody مع request)
                        const originalMethod = this.controller[this.method];
                        if (originalMethod && typeof originalMethod === 'function' && typeof window.extractValuesFromResponse === 'function') {
                            const methodBody = originalMethod.toString().match(/\{([\s\S]*)\}/)[1];
                            const extractedValues = window.extractValuesFromResponse(methodBody, response);
                            // إضافة القيم المستخرجة إلى globalThis للاستخدام في compact
                            Object.keys(extractedValues).forEach(key => {
                                if (typeof window !== 'undefined') {
                                    window[key] = extractedValues[key];
                                }
                                if (typeof globalThis !== 'undefined') {
                                    globalThis[key] = extractedValues[key];
                                }
                            });
                        }
                        return result;
                    }
                } catch (err) {
                    await this.fallbackRequest(err);
                }
                return;
            }
        }
        // التأكد من وجود الـ method قبل استخراج اسم الـ Request class
        if (!this.controller[this.method] || typeof this.controller[this.method] !== 'function') {
            return;
        }
        // استخراج اسم الـ Request class من معاملات الدالة
        const methodString = this.controller[this.method].toString();
        // البحث عن معاملات الدالة - فقط معاملات بسيطة (اسم متغير فقط، ليس تعبيرات)
        // مثال: (UserRequest) أو (request) أو () - لكن ليس (scrollTop / ...)
        const simpleParamMatch = methodString.match(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)/);
        if (simpleParamMatch && simpleParamMatch[1]) {
            const paramName = simpleParamMatch[1].trim();
            // التحقق من أن المعامل يبدأ بحرف كبير (اسم class) وليس متغير عادي
            if (paramName && paramName[0] === paramName[0].toUpperCase() && paramName !== 'request') {
                RequestClassName = paramName;
            } else if (paramName === 'request' || paramName.toLowerCase() === 'request') {
                // إذا كان المعامل 'request' (lowercase)، ابحث عن Request class في use statements
                if (this.controller.useStatements) {
                    // البحث عن Request class في use statements (التي تنتهي بـ Request)
                    for (const [name, value] of Object.entries(this.controller.useStatements)) {
                        if (name.endsWith('Request') && name !== 'FormRequest' && name !== 'Request') {
                            RequestClassName = name;
                            break;
                        }
                    }
                }
            }
        }
        try {
            // إنشاء Request
            // إذا كان هناك RequestClassName في معاملات الدالة (يبدأ بحرف كبير)، أنشئ FormRequest
            if (RequestClassName) {
                // محاولة استخدام Request من global scope أولاً (من use statement)
                let RequestClass = null;
                
                if (typeof window !== 'undefined' && window[RequestClassName]) {
                    RequestClass = window[RequestClassName];
                } else if (typeof globalThis !== 'undefined' && globalThis[RequestClassName]) {
                    RequestClass = globalThis[RequestClassName];
                }                
                // إذا لم يكن موجوداً في global scope، استورده من الملف
                if (!RequestClass) {
                    try {
                        const RequestModule = await import(getPath('app', `Http/Requests/${RequestClassName}.js`));
                        RequestClass = RequestModule.default;
                    } catch (importError) {
                        const RequestModule = await import(getPath('base', `Jquery-Framework/scripts/Requests/Request.js`));
                        RequestClass = RequestModule.default;
                    }
                }
                request = new RequestClass(this.selector);
            } else {
                // إذا لم يكن هناك RequestClassName، استخدم Request عادي (بدون فاليديشن)
                const RequestModule = await import(getPath('base', `Jquery-Framework/scripts/Requests/Request.js`));
                const RequestClass = RequestModule.default;
                request = new RequestClass(this.selector);
            }
            // التأكد من وجود request
            if (!request) {
                return;
            }
            
            // استدعاء الفاليديشن إذا كان Request من نوع FormRequest
            if (request.authorize && typeof request.authorize === 'function') {
                const authResult = request.authorize();
            
                // لو رجع false
                if (authResult === false) {
                    this.handleAuthorizeError('Unauthorized');
                    return;
                }
            
                // لو رجع object
                if (typeof authResult === 'object') {
                    if (authResult.allowed === false) {
                        this.handleAuthorizeError(authResult.message || 'Unauthorized');
                        return;
                    }
                }
            }
            // للـ submit فقط، يجب تنفيذ الفاليديشن
            if (eventName === 'submit' && request.validate && typeof request.validate === 'function') {
                request.validate();
            }
            
            // التأكد من وجود errors
            if (!request.errors || typeof request.errors !== 'object') {
                request.errors = {};
            }
            
            this.controller.request = request;
            
            // للـ submit فقط، التحقق من الفاليديشن
            const hasErrors = request.errors && typeof request.errors === 'object' && Object.keys(request.errors).length > 0;
            if (eventName === 'submit' && hasErrors) {
                // منع تنفيذ الـ method إذا كانت هناك أخطاء
                return;
            } else if(eventName === 'submit' && !hasErrors) {
                const result = await this.executeMethod(request, RequestClassName, event);
                return result;
            }
            // تنفيذ الـ method إذا لم تكن هناك أخطاء (للـ submit) أو لأي حدث آخر
            if (request && (eventName !== 'submit' || !hasErrors)) {
                const result = await this.executeMethod(request, RequestClassName, event);
                return result;
            }
        } catch (err) {
            await this.fallbackRequest(err);
        }
    }
    handleAuthorizeError(message){
        if(typeof window !== 'undefined'){
            window.authorizeError = message;
        }
        if(typeof globalThis !== 'undefined'){
            globalThis.authorizeError = message;
        }
        if(this.controller.onAuthorizeError && typeof this.controller.onAuthorizeError === 'function'){
            this.controller.onAuthorizeError(message);
            return;
        }
        console.error('Authorize Error:', message);
        alert(message);
    }
    async executeMethod(request, RequestClassName, event) {
        try {
            const originalMethod = this.controller[this.method];
            if (!originalMethod || typeof originalMethod !== 'function') {
                return;
            }
            const methodBody = originalMethod.toString().match(/\{([\s\S]*)\}/)[1];
            // استخراج القيم من body تلقائياً
            if (typeof window.extractValuesFromBody === 'function') {
                const extractedValues = window.extractValuesFromBody(methodBody, request);
                // إضافة القيم المستخرجة إلى globalThis للاستخدام في compact
                Object.keys(extractedValues).forEach(key => {
                    window[key] = extractedValues[key];
                });
            }
            // إضافة element و event إلى controller
            this.controller.element = event?.target || this.element;
            this.controller.event = event;
            // استخراج جميع parameters من method signature
            const methodString = originalMethod.toString();
            const paramMatch = methodString.match(/\(([^)]*)\)/);
            const paramsString = paramMatch && paramMatch[1] ? paramMatch[1].trim() : '';
            // تقسيم parameters إلى array
            const params = paramsString ? paramsString.split(',').map(p => p.trim()) : [];
            // استخراج القيم للـ parameters من request
            const paramValues = [];
            const paramNames = [];
            let extraDeclarations = '';
            params.forEach(paramName => {
                if(!paramName) return;
                if (paramName && paramName !== 'request' && paramName.endsWith('Request')) {
                    paramName = 'Request';
                }
                // تخطي request و event (سيتم تمريرهما بشكل خاص)
                if(paramName === 'request' || paramName.toLowerCase() === 'request') {
                    paramNames.push('request');
                    paramValues.push(request);
                } else if(paramName === 'event') {
                    paramNames.push('event');
                    paramValues.push(event);
                } else {
                    // البحث عن القيمة في request.data أو request
                    let value = null;
                    if(request && request.data && request.data[paramName] !== undefined) {
                        value = request.data[paramName];
                    } else if(request && request[paramName] !== undefined) {
                        value = request[paramName];
                    } else if(request && request.get && typeof request.get === 'function') {
                        value = request.get(paramName);
                    }
                    
                    paramNames.push(paramName);
                    paramValues.push(value);
                }
            });
            // إضافة الـ parameters إلى globalThis للاستخدام في view() قبل استدعاء الدالة
            params.forEach((paramName, index) => {
                if(paramName && paramName !== 'request' && paramName !== 'event') {
                    const value = paramValues[index];
                    if(value !== null && value !== undefined) {
                        window[paramName] = value;
                        if(typeof globalThis !== 'undefined') {
                            globalThis[paramName] = value;
                        }
                    }
                }
            });
            
            if(typeof window !== 'undefined') {
                window.currentController = this.controller;
            }
            if(typeof globalThis !== 'undefined') {
                globalThis.currentController = this.controller;
            }
            // استخراج القيم من body تلقائياً
            if (typeof window.extractValuesFromBody === 'function') {
                const extractedValues = window.extractValuesFromBody(methodBody, request);
                // إضافة القيم المستخرجة إلى globalThis للاستخدام في compact
                Object.keys(extractedValues).forEach(key => {
                    window[key] = extractedValues[key];
                });
            }
            // إنشاء function جديد مع جميع parameters
            let functionParams = paramNames.join(', ');
            let functionBody = methodBody;
            // إذا كان RequestClassName موجوداً وليس 'request'، أنشئ const جديد
            if (RequestClassName && RequestClassName !== 'request' && !paramNames.includes(RequestClassName)) {
                functionBody = `const ${RequestClassName} = request;\n${functionBody}`;
            }
            const wrappedMethod = new Function(functionParams, functionBody);
            // تمرير جميع parameters
            const result = wrappedMethod.apply(this.controller, paramValues);
            return result;
        } catch (err) {
            console.log(err);
            return null;
        }
    }
    // البحث عن Route مطابق للـ controller و method
    findMatchingRoute() {
        if (typeof window === 'undefined' || !window.Route) {
            return null;
        }
        const routes = window.Route.all();
        const controllerName = this.controller.constructor.name;
        const controllerConstructor = this.controller.constructor;
        // البحث في جميع أنواع الـ routes
        for (const methodType of ['get', 'post', 'put', 'delete', 'patch']) {
            const methodRoutes = routes[methodType] || [];
            for (const route of methodRoutes) {
                if (route.controller && Array.isArray(route.controller)) {
                    const [ControllerClass, methodName] = route.controller;
                    // التحقق من أن Controller و method يطابقان
                    // التحقق من الاسم أو من أن controller هو instance من ControllerClass
                    const matchesController = ControllerClass && (
                        ControllerClass.name === controllerName || 
                        controllerConstructor === ControllerClass ||
                        this.controller instanceof ControllerClass
                    );
                    if (matchesController && methodName === this.method) {
                        return {
                            ...route,
                            method: methodType.toUpperCase()
                        };
                    }
                }
            }
        }
        
        return null;
    }
    // Fallback في حالة فشل إنشاء Request
    async fallbackRequest(err) {
        try {
            const RequestModule = await import(getPath('base', `Jquery-Framework/scripts/Requests/Request.js`));
            const RequestClass = RequestModule.default;
            // التأكد من وجود selector
            if (!this.selector) {
                return;
            }
            const request = new RequestClass(this.selector);
            // التأكد من وجود request و errors
            if (!request) {
                return;
            }
            // إضافة errors إذا لم تكن موجودة
            if (!request.errors) {
                request.errors = {};
            }
            this.controller.request = request;
            await this.executeMethod(request, null, null);
        } catch (fallbackErr) {
            // Silent error handling
        }
    }
    // فتح الـ modal
    openModal(modalSelector) {
        // دعم Bootstrap modal
        if (typeof window.$ !== 'undefined' && window.$.fn.modal) {
            // استخدام jQuery/Bootstrap
            const $modal = window.$(modalSelector);
            if ($modal.length > 0) {
                $modal.modal('show');
                return;
            }
        }
        
        // دعم Bootstrap 5 modal (بدون jQuery)
        const modalElement = document.querySelector(modalSelector);
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
                this.closeModal(modalSelector);
            });
            
            // إضافة event listener لإغلاق الـ modal عند الضغط على زر الإغلاق
            const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], [data-dismiss="modal"], .close, .btn-close');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeModal(modalSelector);
                });
            });
        }
    }
    // إغلاق الـ modal
    closeModal(modalSelector) {
        // دعم Bootstrap modal
        if (typeof window.$ !== 'undefined' && window.$.fn.modal) {
            const $modal = window.$(modalSelector);
            if ($modal.length > 0) {
                $modal.modal('hide');
                return;
            }
        }
        
        // دعم Bootstrap 5 modal
        const modalElement = document.querySelector(modalSelector);
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
}

