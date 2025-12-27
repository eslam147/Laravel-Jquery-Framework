/**
 * Route Class - نظام Routes مثل Laravel
 * يدعم GET, POST, PUT, DELETE, PATCH
 */

class Route {
    static groupStack = [];
    static routes = {
        get: [],
        post: [],
        put: [],
        prefix: [],
        delete: [],
        group: [],
        patch: [],
        options: {}
    };

    /**
     * تسجيل Route للـ GET request
     * @param {string} url - URL للـ request
     * @param {Array} controller - [ControllerClass, 'methodName']
     * @param {Object} options - خيارات إضافية (headers, data, etc.)
     */
    static get(url, controller, options = {}) {
        this.routes.get.push({
            url,
            controller,
            options,
            method: 'GET'
        });
        return this;
    }
    static group(options, callback) {
        // check if options is callback
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        this.routes.group.push(options);
        callback();
        return this;
    }
    static getCurrentGroupOptions() {
        return this.routes.group.slice(-1)[0];
    }

    static prefix(prefix) {
        this.routes.group.push({
            prefix,
            callback: callback
        });
        return this;
    }
    /**
     * تسجيل Route للـ POST request
     * @param {string} url - URL للـ request
     * @param {Array} controller - [ControllerClass, 'methodName']
     * @param {Object} options - خيارات إضافية (headers, data, etc.)
     */
    static post(url, controller, options = {}) {
        this.routes.post.push({
            url,
            controller,
            options,
            method: 'POST'
        });
        return this;
    }

    /**
     * تسجيل Route للـ PUT request
     * @param {string} url - URL للـ request
     * @param {Array} controller - [ControllerClass, 'methodName']
     * @param {Object} options - خيارات إضافية
     */
    static put(url, controller, options = {}) {
        this.routes.put.push({
            url,
            controller,
            options,
            method: 'PUT'
        });
        return this;
    }

    /**
     * تسجيل Route للـ DELETE request
     * @param {string} url - URL للـ request
     * @param {Array} controller - [ControllerClass, 'methodName']
     * @param {Object} options - خيارات إضافية
     */
    static delete(url, controller, options = {}) {
        this.routes.delete.push({
            url,
            controller,
            options,
            method: 'DELETE'
        });
        return this;
    }

    /**
     * تسجيل Route للـ PATCH request
     * @param {string} url - URL للـ request
     * @param {Array} controller - [ControllerClass, 'methodName']
     * @param {Object} options - خيارات إضافية
     */
    static patch(url, controller, options = {}) {
        this.routes.patch.push({
            url,
            controller,
            options,
            method: 'PATCH'
        });
        return this;
    }

    /**
     * تنفيذ Route - إرسال AJAX request واستدعاء Controller method
     * @param {string} method - HTTP method (GET, POST, etc.)
     * @param {string} url - URL للـ request
     * @param {Object} data - البيانات المرسلة (للـ POST, PUT, etc.)
     * @param {Object} options - خيارات إضافية
     */
    static async dispatch(method, url, data = {}, options = {}) {
        method = method.toUpperCase();
        
        // البحث عن Route مطابق
        const route = this.findRoute(method, url);
        
        if (!route) {
            throw new Error(`Route not found for ${method} ${url}`);
        }

        const [ControllerClass, methodName] = route.controller;
        
        // إنشاء instance من Controller
        const controller = new ControllerClass();
        
        // التأكد من تعيين element من selector
        if (controller.selector && typeof controller.selector === 'function') {
            const selector = controller.selector();
            if (selector) {
                controller.element = document.querySelector(selector);
            }
        }
        
        // استدعاء beforeOnSend قبل إرسال AJAX request
        let requestData = data;
        let requestOptions = {
            ...route.options,
            ...options
        };
        
        if (controller.beforeOnSend && typeof controller.beforeOnSend === 'function') {
            const result = controller.beforeOnSend(requestData, requestOptions);
            if (result && typeof result === 'object') {
                if (result.data !== undefined) {
                    requestData = result.data;
                }
                if (result.options !== undefined) {
                    requestOptions = { ...requestOptions, ...result.options };
                }
            }
        }
        
        // إرسال AJAX request
        try {
            const response = await this.sendRequest(method, route.url, requestData, requestOptions);
            // استدعاء Controller method مع response
            if (controller[methodName] && typeof controller[methodName] === 'function') {
                return await controller[methodName](response);
            } else {
                throw new Error(`Method ${methodName} not found in ${ControllerClass.name}`);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * البحث عن Route مطابق
     * @param {string} method - HTTP method
     * @param {string} url - URL للبحث
     */
    static findRoute(method, url) {
        const routes = this.routes[method.toLowerCase()] || [];
        return routes.find(route => route.url === url);
    }

    /**
     * إرسال AJAX request
     * @param {string} method - HTTP method
     * @param {string} url - URL
     * @param {Object} data - البيانات
     * @param {Object} options - خيارات
     */
    static async sendRequest(method, url, data = {}, options = {}) {
        const groupOptions = this.getCurrentGroupOptions();
        const pasepath = window.appConfig.basePath;
        // check if url is starts with http or https
        if(url.startsWith('http') || url.startsWith('https')){
            url = url;
        } else {
            url = groupOptions.prefix ?  pasepath + groupOptions.prefix + url : pasepath + url;
        }
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        // إضافة البيانات للـ request
        if (method !== 'GET' && method !== 'HEAD') {
            if (data && typeof data === 'object') {
                config.body = JSON.stringify(data);
            } else if (data) {
                config.body = data;
            }
        } else if (data && Object.keys(data).length > 0) {
            // للـ GET، إضافة البيانات كـ query parameters
            const params = new URLSearchParams(data);
            url += (url.includes('?') ? '&' : '?') + params.toString();
        }
        try {
            const response = await fetch(url, config);
            
            // التحقق من حالة الـ response
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            
            // محاولة parse JSON response
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                responseData = await response.json();
                } catch (jsonError) {
                    responseData = await response.text();
                }
            } else {
                responseData = await response.text();
            }

            // إرجاع response object مع data و status
            return {
                data: responseData,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                success: response.ok,
                url: response.url
            };
        } catch (error) {
            // تحسين رسالة الخطأ
            const errorMessage = error.message || 'Failed to fetch';
            console.error(`Error sending ${method} request to ${url}:`, errorMessage);
            throw new Error(`Failed to send request: ${errorMessage}`);
        }
    }

    /**
     * الحصول على جميع Routes
     */
    static all() {
        return this.routes;
    }
    /**
     * مسح جميع Routes
     */
    static clear() {
        this.routes = {
            get: [],
            post: [],
            put: [],
            delete: [],
            patch: []
        };
    }
}

export default Route;

