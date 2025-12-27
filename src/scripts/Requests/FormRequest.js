import Requests from './Request.js';

export default class FormRequest extends Requests {
    constructor(selector){
        super(selector);
        this.errors = {};

        return new Proxy(this, {
            get(target, prop){
                // إرجاع properties من target أولاً (بما في ذلك الدوال)
                if(prop in target) {
                    const value = target[prop];
                    // إذا كانت دالة، ربطها بـ target
                    if(typeof value === 'function') {
                        return value.bind(target);
                    }
                    return value;
                }
                
                // البحث في prototype إذا لم يكن موجوداً في target
                const proto = Object.getPrototypeOf(target);
                if(proto && prop in proto) {
                    const value = proto[prop];
                    // إذا كانت دالة، ربطها بـ target
                    if(typeof value === 'function') {
                        return value.bind(target);
                    }
                    return value;
                }
                
                // ثم إرجاع البيانات من target.data
                if(prop in target.data) return target.data[prop];
                return undefined;
            },
            has(target, prop){
                // دعم 'in' operator
                return prop in target || prop in target.data;
            },
            ownKeys(target){
                // دعم Object.keys() و destructuring
                return [...Object.keys(target), ...Object.keys(target.data)];
            },
            getOwnPropertyDescriptor(target, prop){
                // دعم Object.getOwnPropertyDescriptor() و destructuring
                if(prop in target.data){
                    return {
                        enumerable: true,
                        configurable: true,
                        value: target.data[prop]
                    };
                }
                if(prop in target){
                    return Object.getOwnPropertyDescriptor(target, prop);
                }
            }
        });
    }
    authorize(){ return true; }

    rules(){ return {}; }
    
    messages(){ return {}; }
    
    // دالة للحصول على رسالة الخطأ المخصصة أو الرسالة الافتراضية
    getErrorMessage(field, rule){
        const customMessages = this.messages();
        const messageKey = `${field}.${rule.trim()}`;
        
        // البحث عن رسالة مخصصة
        if(customMessages && customMessages[messageKey]){
            return customMessages[messageKey];
        }
        
        // الرسائل الافتراضية
        const defaultMessages = {
            'required': `${field} is required`,
            'string': `${field} must be a string`,
            'email': `${field} must be a valid email`
        };
        
        return defaultMessages[rule.trim()] || `${field} is invalid`;
    }

    validate(){
        if(typeof this.authorize === 'function'){
            const authorized = this.authorize();
            if(authorized === false){
                this.errors = {
                    _authorize: 'You are not authorized to perform this action'
                };
                return false;
            }
        }
        this.errors = {};
        const rules = this.rules();
        
        // التأكد من وجود data
        if(!this.data || typeof this.data !== 'object'){
            this.data = {};
        }
        
        // إعادة جمع البيانات للتأكد من أحدث القيم
        if(this.form){
            this.data = this.collect();
        }
        
        for(const field in rules){
            let ruleValue = rules[field];
            let ruleList = [];
            if(typeof ruleValue==='string') ruleList = ruleValue.split('|');
            else if(Array.isArray(ruleValue)) ruleList = ruleValue;

            for(const rule of ruleList){
                const fieldValue = this.data[field];
                const fieldValueStr = fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : '';
                
                // التحقق من required
                if(rule.trim()==='required'){
                    if(fieldValue === undefined || fieldValue === null || fieldValueStr.trim() === ''){
                        this.errors[field] = this.getErrorMessage(field, 'required');
                        break; // توقف عند أول خطأ في الحقل
                    }
                }
                
                // التحقق من string (فقط إذا كان الحقل موجود)
                if(rule.trim()==='string' && fieldValue !== undefined && fieldValue !== null){
                    if(typeof fieldValue !== 'string'){
                        this.errors[field] = this.getErrorMessage(field, 'string');
                        break;
                    }
                }
                
                // التحقق من email (فقط إذا كان الحقل موجود)
                if(rule.trim()==='email' && fieldValue !== undefined && fieldValue !== null && fieldValueStr.trim() !== ''){
                    if(!/\S+@\S+\.\S+/.test(fieldValueStr)){
                        this.errors[field] = this.getErrorMessage(field, 'email');
                        break;
                    }
                }
            }
        }

        // عرض الأخطاء مباشرة أسفل كل input وإضافة class is-invalid
        if(this.form){
            const inputs = this.form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                const hasError = this.errors[input.name] && this.errors[input.name].trim() !== '';
                
                // إضافة أو إزالة class is-invalid
                if(hasError){
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                }
                
                let errorEl = input.nextElementSibling;
                if(!errorEl || !errorEl.classList.contains('error-message')){
                    errorEl = document.createElement('div');
                    errorEl.className = 'error-message';
                    errorEl.style.color = 'red';
                    errorEl.style.fontSize = '12px';
                    errorEl.style.marginTop = '5px';
                    input.insertAdjacentElement('afterend', errorEl);
                }
                errorEl.innerText = this.errors[input.name] || '';
            });
        }
    }
}
