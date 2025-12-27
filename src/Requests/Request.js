export default class Requests {
    constructor(selector){
        this.form = document.querySelector(selector);
        this.element = document.querySelector(selector);
        try {
            this.data = this.collect();
            Object.assign(this, this.data); 
        } catch(err) {
            this.data = {};
        }
    }

    // دالة لجمع البيانات من عنصر واحد
    collectElementData(element){
        const elementData = {};
        
        // جمع data attributes
        if(element.dataset){
            Object.keys(element.dataset).forEach(key => {
                // convert - to _
                const newKey = key.replace(/-/g, '_');
                elementData[newKey] = element.dataset[key];
            });
        }
        
        // جمع name attribute إذا كان موجوداً (استخدام getAttribute لجميع العناصر)
        const nameAttr = element.getAttribute('name') || element.name;
        if(nameAttr){
            elementData.name = nameAttr;
        }
        
        // جمع value attribute إذا كان موجوداً
        if(element.value !== undefined && element.value !== null && element.value !== ''){
            elementData.value = element.value;
        }
        
        // جمع id attribute إذا كان موجوداً
        if(element.id){
            elementData.id = element.id;
        }
        
        // جمع inputs من form إذا كان العنصر form
        if(element.tagName === 'FORM'){
            const inputs = element.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if(input.name){
                    elementData[input.name] = input.value || '';
                }
            });
        }
        
        return elementData;
    }

    collect(){
        const data = {};
        
        // إذا كان العنصر form، اجمع البيانات من form
        if(this.form && this.form.tagName === 'FORM'){
            const formData = this.collectElementData(this.form);
            Object.assign(data, formData);
        }
        // إذا كان العنصر داخل form، اجمع البيانات من form أولاً
        else if(this.element && this.element.closest('form')){
            const form = this.element.closest('form');
            const formData = this.collectElementData(form);
            Object.assign(data, formData);
        }
        
        // جمع البيانات من العنصر نفسه وجميع الـ parent elements التي لها name attribute
        if(!this.element) return data;
        
        // جمع البيانات من العنصر الحالي (بدون name attribute)
        const currentElementData = this.collectElementData(this.element);
        // إزالة name من البيانات إذا كان موجوداً (لأننا لا نريد استخدامه كـ key للعنصر الحالي)
        if(currentElementData.name){
            delete currentElementData.name;
        }
        
        // دالة مساعدة لإضافة parent data بشكل متداخل
        const addParentData = (currentData, parentElement) => {
            if(!parentElement || parentElement.tagName === 'BODY' || parentElement.tagName === 'HTML'){
                return;
            }
            
            // التحقق من name attribute باستخدام getAttribute (يعمل لجميع العناصر)
            const parentNameAttr = parentElement.getAttribute('name') || parentElement.name;
            if(parentNameAttr){
                const parentName = parentNameAttr;
                const parentData = this.collectElementData(parentElement);
                // إزالة name من البيانات (لأننا نستخدمه كـ key)
                if(parentData.name){
                    delete parentData.name;
                }
                
                // إضافة parent كـ nested object
                currentData[parentName] = parentData;
                
                // البحث عن parents أخرى داخل هذا parent
                addParentData(parentData, parentElement.parentElement);
            } else {
                // إذا لم يكن له name، استمر في البحث
                addParentData(currentData, parentElement.parentElement);
            }
        };
        
        // إضافة جميع الـ parent elements
        addParentData(currentElementData, this.element.parentElement);
        
        // إضافة بيانات العنصر الحالي مباشرة (بدون استخدام name كـ key)
        Object.assign(data, currentElementData);
        
        return data;
    }

    all(){ return this.data; }
    get(name){ return this.data[name]; }
}