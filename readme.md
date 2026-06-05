# Jquery-Framework (Laravel-Style Frontend)

A lightweight **frontend framework** built on **jQuery**, inspired by the **Laravel** development experience.
It helps organize JavaScript code in large projects by providing a clear **MVC architecture**, a smart **routing system**, and full **localization (i18n)** support.

---

## 🚀 Key Features

* **MVC Architecture**: Organize code into Controllers and Requests for easier maintenance.
* **Smart Routing**: Laravel-like routing system that automatically binds DOM events.
* **Localization (i18n)**: Built-in multi-language support (ar, en) with programmatic access to validation messages.
* **Dynamic Views**: Load and render Blade views via AJAX with easy data passing.
* **Artisan Integration**: CLI commands for scaffolding and publishing framework files.

---

## 🛠 Installation

### 1. Install the package

```bash
composer require frontend/jquery-framework
```

### 2. Publish framework files

```bash
php artisan jquery:publish
```

### 3. Add boot Script in Resource File

```bash
<script type="module" src="{{ asset('Jquery-Framework/scripts/boot.js') }}"></script>
```

### 4. Add meta csrf tag in Resource File head

```bash
<meta name="csrf-token" content="{{ csrf_token() }}">
```

### 5. Add provider in your project

```bash
    JqueryFramework\Providers\JqueryFrameworkServiceProvider::class,
```


---

## 📚 Usage

### Creating Controllers

#### Basic Controller

```bash
node artisanJs make:controller ButtonController
```

Creates a controller with a **class selector** (`.button`).

---

#### Controller with ID Selector

```bash
node artisanJs make:controller ButtonController --id
```

Creates a controller with an **ID selector** (`#button`).

---

#### Controller with Custom Match Character

```bash
node artisanJs make:controller TestReadController --match="_"
```

Creates a controller using an underscore separator:

```css
.test_read
```

```bash
node artisanJs make:controller TestReadController --match="-"
```

Creates a controller using a hyphen separator:

```css
.test-read
```

---

### Controller Options Explained

#### `--id`

Creates a controller that uses an **ID selector** instead of a class selector.

* Without `--id`: `ButtonController` → `.button`
* With `--id`: `ButtonController` → `#button`

---

#### `--match`

Defines the separator used between words in the selector.

* Default: `.` (class selector)
* `--match="_"`: underscore separator
* `--match="-"`: hyphen separator

Examples:

* `TestReadController --match="_"` → `.test_read`
* `TestReadController --match="-"` → `.test-read`

> Note:
> `--match` only controls the separator.
> Selector type (class or ID) is controlled by the `--id` flag.

---

### Controller Naming Convention

* Controller names must end with `Controller`
* `ButtonController` → `.button`
* Namespaces are supported:

```bash
node artisanJs make:controller Auth/LoginController
```

Creates:

```text
public/Jquery-Framework/app/Http/Controllers/Auth/LoginController.js
```

---

## Creating Requests

```bash
node artisanJs make:request UserRequest
node artisanJs make:request Auth/LoginRequest
```

---

## Deleting Controllers

```bash
node artisanJs delete:controller ButtonController
node artisanJs delete:controller Auth/LoginController
```

---

## Deleting Requests

```bash
node artisanJs delete:request UserRequest
node artisanJs delete:request Auth/LoginRequest
```

---

## 📝 Example Controller

```javascript
namespace App\\Http\\Controllers;
use Jquery-Framework\\scripts\\Controller;

class ButtonController extends Controller {

    public function selector() {
        return '.button'; // or '#button' if created with --id
    }

    public function click(request, id, variation_id = null) {
        console.log('ID:', id);
        console.log('Variation ID:', variation_id);

        console.log('All data:', request.all());
        console.log('ID from request:', request.id);

        return view('welcome', '#result', compact('id', 'variation_id'));
    }
}
```

---

## 🛣️ Routing Examples

```javascript
Route.get('/data', [ButtonController::class, 'click']);
Route.post('/posts', [PostController::class, 'submit']);
```

---

## 🛣️ Route Groups

```javascript
Route.group({ prefix: 'admin' }, function () {
    Route.post('/', [AdminController::class, 'submit']);
});
```

---

## 🔄 Modal System

Fully integrated **Bootstrap 5 modal system** with automatic detection and opening.

### Using view() Helper

With parameters:

```javascript
public function click(id) {
    return view('modal1', '#modal-content', compact('id'));
}
```

Without parameters:

```javascript
public function click() {
    return view('modal2', '#modal-content');
}
```

### Modal Features

* Automatic opening
* Selector preservation
* Dynamic Bootstrap loading
* `d-none` auto removal
* Fresh instance on every open

---

## modal() Method

```javascript
public function modal() {
    return '#modal1';
}
```

or

```javascript
public function modal() {
    return '.modal1';
}
```

---

## 🌍 Language Files

Path:

```text
lang/{locale}/messages.js
```

### English

```javascript
return {
    welcome: 'Welcome',
    description: 'This is a description'
};
```

### Arabic

```javascript
return {
    welcome: 'مرحبا',
    description: 'هذا وصف'
};
```

---

## 📊 Collection - طرق جلب ومعالجة البيانات

### 🎯 مقدمة عن Collection

`Collection` هي فئة قوية لمعالجة البيانات (المصفوفات والكائنات) بطريقة سهلة وفعالة، مشابهة لـ Laravel Collections.

### 📝 نموذج البيانات

```javascript
const usersArray = [
    {
        id: 1,
        name: 'eslam',
        email: 'eslam@gmail.com',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        posts: [
            {
                id: 1,
                title: 'post 1',
                content: 'content 1',
                user_id: 1,
                comments: [
                    { id: 1, text: 'تعليق رقم 1', author: 'Ahmed' },
                    { id: 2, text: 'تعليق رقم 2', author: 'Mohamed' }
                ]
            },
            {
                id: 2,
                title: 'post 2',
                content: 'content 2',
                user_id: 1,
                comments: []
            }
        ]
    },
    {
        id: 2,
        name: 'ali',
        email: 'ali@gmail.com',
        created_at: '2025-01-02',
        updated_at: '2025-01-02',
        posts: [
            {
                id: 3,
                title: 'post ali',
                content: 'content ali',
                user_id: 2,
                comments: [
                    { id: 3, text: 'تعليق على منشور علي', author: 'Eslam' }
                ]
            }
        ]
    },
    {
        id: 3,
        name: 'sara',
        email: 'sara@gmail.com',
        created_at: '2025-01-03',
        updated_at: '2025-01-03',
        posts: [
            {
                id: 4,
                title: 'post sara',
                content: 'content sara',
                user_id: 3,
                comments: [
                    { id: 4, text: 'تعليق على منشور سارة', author: 'Eslam' }
                ]
            }
        ]
    }
];
```

---

### 🔍 طرق البحث والتصفية (Filtering Methods)

#### **1. where() - البحث عن قيمة محددة**

```javascript
// البحث عن جميع المستخدمين بـ id = 2
const result = collect(usersArray).where('id', 2).all();
// ↓ النتيجة: [{ id: 2, name: 'ali', ... }]
```

#### **2. whereIn() - البحث عن قيم من ضمن قائمة**

```javascript
// البحث عن المستخدمين بـ id 1 أو 3
const result = collect(usersArray).whereIn('id', [1, 3]).all();
// ↓ النتيجة: [{ id: 1, name: 'eslam', ... }, { id: 3, name: 'sara', ... }]
```

#### **3. whereNotIn() - البحث عن القيم غير الموجودة في قائمة**

```javascript
// البحث عن المستخدمين ما عدا id 1 و 3
const result = collect(usersArray).whereNotIn('id', [1, 3]).all();
// ↓ النتيجة: [{ id: 2, name: 'ali', ... }]
```

#### **4. whereNull() - البحث عن القيم الفارغة**

```javascript
// البحث عن المستخدمين بدون deleted_at
const result = collect(usersArray).whereNull('deleted_at').all();
// ↓ النتيجة: جميع المستخدمين (لأن جميعهم بدون deleted_at)
```

#### **5. whereNotNull() - البحث عن القيم غير الفارغة**

```javascript
// البحث عن المستخدمين الذين لديهم email
const result = collect(usersArray).whereNotNull('email').all();
// ↓ النتيجة: جميع المستخدمين
```

#### **6. whereHas() - البحث حسب العلاقات**

```javascript
// البحث عن المستخدمين الذين لديهم منشورات
const result = collect(usersArray).whereHas('posts', function(query) {
    return query.isNotEmpty();
}).all();
// ↓ النتيجة: جميع المستخدمين (جميعهم لديهم منشورات)
```

#### **7. whereDoesntHave() - البحث عن العناصر بدون علاقات محددة**

```javascript
// البحث عن المستخدمين الذين ليس لديهم منشور بعنوان 'post 1'
const result = collect(usersArray).whereDoesntHave('posts', function(query) {
    return query.where('title', 'post 1');
}).all();

// ↓ النتيجة:
// [
//     { id: 2, name: 'ali', posts: [...] },
//     { id: 3, name: 'sara', posts: [...] }
// ]
```

---

### 🔄 طرق التحويل والمعالجة (Transformation Methods)

#### **1. map() - تحويل كل عنصر**

```javascript
// الحصول على أسماء جميع المستخدمين فقط
const names = collect(usersArray).map(user => user.name).all();
// ↓ النتيجة: ['eslam', 'ali', 'sara']
```

#### **2. pluck() - استخراج خاصية واحدة**

```javascript
// استخراج جميع الـ emails
const emails = collect(usersArray).pluck('email').all();
// ↓ النتيجة: ['eslam@gmail.com', 'ali@gmail.com', 'sara@gmail.com']
```

#### **3. select() - اختيار خصائص محددة**

```javascript
// اختيار فقط id و name من كل مستخدم
const result = collect(usersArray).select(['id', 'name']).all();
// ↓ النتيجة:
// [
//     { id: 1, name: 'eslam' },
//     { id: 2, name: 'ali' },
//     { id: 3, name: 'sara' }
// ]
```

#### **4. flatten() - تسطيح المصفوفة المتداخلة**

```javascript
// تسطيح جميع المستخدمين والمنشورات
const result = collect(usersArray).flatten(2).all();
// ↓ النتيجة: مصفوفة مسطحة من جميع الكائنات
```

#### **5. collapse() - دمج المصفوفات المتداخلة**

```javascript
// الحصول على جميع المنشورات من جميع المستخدمين
const allPosts = collect(usersArray).map(user => user.posts).collapse().all();
// ↓ النتيجة: [{ id: 1, title: 'post 1', ... }, { id: 2, title: 'post 2', ... }, ...]
```

---

### 📊 طرق التجميع والترتيب (Grouping & Sorting)

#### **1. groupBy() - تجميع حسب خاصية**

```javascript
// تجميع المستخدمين حسب الحرف الأول من الاسم
const grouped = collect(usersArray).groupBy(u => u.name.charAt(0)).all();
// ↓ النتيجة:
// {
//     'e': [{ id: 1, name: 'eslam', ... }],
//     'a': [{ id: 2, name: 'ali', ... }],
//     's': [{ id: 3, name: 'sara', ... }]
// }
```

#### **2. sortBy() - ترتيب تصاعدي**

```javascript
// ترتيب المستخدمين حسب الاسم تصاعديًا
const result = collect(usersArray).sortBy('name').all();
// ↓ النتيجة: [ali, eslam, sara]
```

#### **3. sortByDesc() - ترتيب تنازلي**

```javascript
// ترتيب المستخدمين حسب الاسم تنازليًا
const result = collect(usersArray).sortByDesc('name').all();
// ↓ النتيجة: [sara, eslam, ali]
```

#### **4. unique() - إزالة التكرارات**

```javascript
// إزالة المستخدمين المكررين حسب الاسم
const result = collect(usersArray).unique('name').all();
// ↓ النتيجة: جميع المستخدمين (لا توجد تكرارات)
```

#### **5. reverse() - عكس الترتيب**

```javascript
// عكس ترتيب المستخدمين
const result = collect(usersArray).reverse().all();
// ↓ النتيجة: [sara, ali, eslam]
```

---

### 🔗 طرق الربط والدمج (Join Methods)

#### **1. join() - ربط داخلي**

```javascript
const users = collect(usersArray);
const posts = collect([
    { id: 1, title: 'post 1', user_id: 1 },
    { id: 2, title: 'post 2', user_id: 1 }
]);

const joined = users.join(posts, 'id', 'user_id').all();
// ↓ النتيجة: فقط المستخدمون الذين لديهم منشورات
```

#### **2. leftJoin() - ربط يساري**

```javascript
// تضمين جميع المستخدمين حتى بدون منشورات
const result = users.leftJoin(posts, 'id', 'user_id').all();
```

#### **3. with() - تحميل العلاقات**

```javascript
// تحميل المنشورات ومعالجتها
const result = collect(usersArray).with('posts', function(posts) {
    return posts.where('user_id', 1).all();
}).all();
```

---

### 📈 طرق الإحصاء والتجميع (Aggregate Methods)

#### **1. sum() - جمع القيم**

```javascript
const posts = collect([
    { id: 1, likes: 10 },
    { id: 2, likes: 20 },
    { id: 3, likes: 30 }
]);

const total = posts.sum('likes');
// ↓ النتيجة: 60
```

#### **2. avg() - المتوسط**

```javascript
const average = posts.avg('likes');
// ↓ النتيجة: 20
```

#### **3. max() - القيمة الأكبر**

```javascript
const maximum = posts.max('likes');
// ↓ النتيجة: 30
```

#### **4. min() - القيمة الأصغر**

```javascript
const minimum = posts.min('likes');
// ↓ النتيجة: 10
```

#### **5. count() - عد العناصر**

```javascript
// لا توجد method count مباشرة، لكن يمكن:
const count = collect(usersArray).all().length;
// ↓ النتيجة: 3
```

---

### ✅ طرق التحقق (Checking Methods)

#### **1. isEmpty() - التحقق من الفراغ**

```javascript
const empty = collect([]).isEmpty();
// ↓ النتيجة: true

const notEmpty = collect(usersArray).isEmpty();
// ↓ النتيجة: false
```

#### **2. isNotEmpty() - التحقق من عدم الفراغ**

```javascript
const hasData = collect(usersArray).isNotEmpty();
// ↓ النتيجة: true
```

#### **3. contains() - البحث عن قيمة**

```javascript
const has = collect([1, 2, 3]).contains(2);
// ↓ النتيجة: true
```

#### **4. every() - التحقق من جميع العناصر**

```javascript
// التحقق من أن جميع المستخدمين لديهم id > 0
const allValid = collect(usersArray).every(u => u.id > 0);
// ↓ النتيجة: true
```

#### **5. some() - التحقق من وجود عنصر واحد**

```javascript
// التحقق من وجود مستخدم باسم 'ali'
const hasAli = collect(usersArray).some(u => u.name === 'ali');
// ↓ النتيجة: true
```

---

### 🎁 طرق أخرى مفيدة (Other Methods)

#### **1. first() - الحصول على العنصر الأول**

```javascript
const first = collect(usersArray).first();
// ↓ النتيجة: { id: 1, name: 'eslam', ... }
```

#### **2. last() - الحصول على العنصر الأخير**

```javascript
const last = collect(usersArray).last();
// ↓ النتيجة: { id: 3, name: 'sara', ... }
```

#### **3. get() - الحصول على عنصر بـ index**

```javascript
const second = collect(usersArray).get(1);
// ↓ النتيجة: { id: 2, name: 'ali', ... }
```

#### **4. chunk() - تقسيم إلى مجموعات**

```javascript
// تقسيم المستخدمين إلى مجموعات من 2
const chunks = collect(usersArray).chunk(2).all();
// ↓ النتيجة:
// [
//     [user1, user2],
//     [user3]
// ]
```

#### **5. merge() - دمج مع مصفوفة أخرى**

```javascript
const merged = collect([1, 2]).merge([3, 4]).all();
// ↓ النتيجة: [1, 2, 3, 4]
```

#### **6. dd() - عرض وإيقاف التنفيذ**

```javascript
// يفتح نافذة جديدة لعرض البيانات بشكل منسق
collect(usersArray).dd();
```

---

### 💡 أمثلة متقدمة (Advanced Examples)

#### **مثال 1: الحصول على جميع التعليقات من جميع المنشورات**

```javascript
const allComments = collect(usersArray)
    .map(user => user.posts)
    .collapse()
    .map(post => post.comments)
    .collapse()
    .all();

// النتيجة: جميع التعليقات من جميع المنشورات
```

#### **مثال 2: البحث عن مستخدم ومنشوراته**

```javascript
const user = collect(usersArray)
    .where('name', 'eslam')
    .map(u => ({
        ...u,
        posts: collect(u.posts)
            .where('user_id', u.id)
            .sortByDesc('id')
            .all()
    }))
    .first();
```

#### **مثال 3: إحصائيات المنشورات**

```javascript
const stats = collect(usersArray)
    .map(user => user.posts)
    .collapse()
    .reduce((acc, post) => {
        acc.totalPosts++;
        acc.totalComments += post.comments.length;
        return acc;
    }, { totalPosts: 0, totalComments: 0 });

// النتيجة: { totalPosts: 5, totalComments: 5 }
```

---

### 🎯 ملخص الطرق الأساسية

| الطريقة | الوصف | النتيجة |
|--------|-------|--------|
| `where()` | البحث عن قيمة محددة | Collection |
| `map()` | تحويل كل عنصر | Collection |
| `pluck()` | استخراج خاصية واحدة | Collection |
| `filter()` | تصفية العناصر | Collection |
| `first()` | الحصول على الأول | العنصر |
| `last()` | الحصول على الأخير | العنصر |
| `count()` | عد العناصر | رقم |
| `sum()` | جمع القيم | رقم |
| `all()` | الحصول على المصفوفة الكاملة | Array |
