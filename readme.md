# Jquery-Framework (Laravel-Style Frontend)

إطار عمل أمامي (Frontend Framework) خفيف يعتمد على **jQuery** ويحاكي بنية وتجربة تطوير **Laravel**. يهدف هذا الإطار إلى تنظيم كود الجافا سكريبت في المشاريع الكبيرة من خلال توفير هيكلية MVC واضحة، نظام Routing ذكي، ودعم كامل لتعدد اللغات.

## 🚀 المميزات الرئيسية
- **MVC Architecture:** تنظيم الكود في Controllers و Requests لسهولة الصيانة.
- **Smart Routing:** نظام مسارات يحاكي Laravel يسمح بربط الأحداث (Events) تلقائياً.
- **Localization (i18n):** دعم مدمج للترجمة (ar, en) مع إمكانية استدعاء نصوص التحقق (Validation) برمجياً.
- **Dynamic Views:** معالجة وتحميل ملفات Blade عبر AJAX مع تمرير البيانات بسهولة.
- **Artisan Integration:** أوامر CLI لتهيئة بيئة العمل ونشر الملفات (Publishing).

---

## 🛠 التثبيت (Installation)

1- يمكنك تحميل المكتبة من خلال الأمر

```bash
composer require frontend/jquery-framework
```
2- انشاء الملفات

```bash
php artisan jquery:publish
```



## 📚 Usage

### Creating Controllers

#### Basic Controller
```bash
node artisanJs make:controller ButtonController
```
This creates a controller with a class selector (`.button`).

#### Controller with ID Selector
```bash
node artisanJs make:controller ButtonController --id
```
This creates a controller with an ID selector (`#button`).

#### Controller with Custom Match Character
```bash
node artisanJs make:controller TestReadController --match="_"
```
This creates a controller with underscore separator (`.test_read`).

```bash
node artisanJs make:controller TestReadController --match="-"
```
This creates a controller with hyphen separator (`.test-read`).

#### Controller Options Explained

**`--id`**: Creates a controller that uses an ID selector instead of a class selector.
- Without `--id`: `ButtonController` → selector: `.button`
- With `--id`: `ButtonController` → selector: `#button`

**`--match`**: Specifies the character used to separate words in the selector.
- Default: `.` (dot) - creates class selector
- `--match="_"`: Uses underscore separator
- `--match="-"`: Uses hyphen separator
- Example: `TestReadController` with `--match="_"` → `.test_read`
- Example: `TestReadController` with `--match="-"` → `.test-read`

**Note**: The `--match` option only affects the separator character. The selector type (class or ID) is determined by the `--id` flag.

#### Controller Naming Convention
- Controller names should end with `Controller` (e.g., `ButtonController`, `UserController`)
- The framework automatically converts `ButtonController` to `button` for the selector
- Supports namespaces: `Auth/LoginController` creates `app/Http/controllers/Auth/LoginController.js`

### Creating Requests

```bash
node artisanJs make:request UserRequest
node artisanJs make:request Auth/LoginRequest
```

### Deleting Controllers

```bash
node artisanJs delete:controller ButtonController
node artisanJs delete:controller Auth/LoginController
```

### Deleting Requests

```bash
node artisanJs delete:request UserRequest
node artisanJs delete:request Auth/LoginRequest
```

## 📝 Example Controller

```javascript
namespace App\Http\Controllers;
use Jquery-Framework\scripts\Controller;

class ButtonController extends Controller {
    public function selector() {
        return '.button'; // or '#button' if created with --id
    }
    
    public function click(request,  id, variation_id = null) {
        // Access parameters directly from data-* attributes
        console.log('ID:', id);
        console.log('Variation ID:', variation_id);
        // Or access via request object
        console.log('All data:', request->all());
        console.log('ID from request:', request->id);
        // Use view helper to render templates
        return view('welcome', '#result', compact('id', 'variation_id'));        
    }
}
```

## 🛣️ Example Route

```javascript
// Simple route without element return
Route.get('/data', [ButtonController::class, 'click']);

// POST route
Route.post('/posts', [PostController::class, 'submit']);
```
## 🛣️ New Route Added
```javascript
// route group system
Route.group({prefix: 'admin'}, function(){
    Route.post('/', [AdminController::class, 'submit']);
});
```

## 🔄 Modal System

The framework includes a comprehensive modal system with Bootstrap 5 support, automatic ID detection, and seamless integration with controllers and views.

### Opening Modals Using view() Helper

The recommended way to open modals is using the `view()` helper. The modal will be automatically rendered and opened:

#### With Parameters

If you need to pass parameters to the modal view:

```javascript
public function click(id) {
    // Render modal view with parameters and automatically open it
    return view('modal1', '#modal-content', compact('id'));
    
    // The modal will be:
    // 1. Rendered in the specified selector (#modal-content)
    // 2. Automatically opened using Bootstrap 5
    // 3. Dynamically load Bootstrap if not already loaded
}
```

#### Without Parameters

If you don't need to pass any parameters:

```javascript
public function click() {
    // Render modal view without parameters and automatically open it
    return view('modal2', '#modal-content');
    
    // The modal will be automatically rendered and opened
}
```

**View Modal Features:**
- **Auto-opening**: Modals are automatically opened when rendered via `view()`
- **Selector Preservation**: Modal remains in the specified selector (not moved to body)
- **Bootstrap Loading**: Bootstrap 5 is dynamically loaded if not already present
- **d-none Removal**: The `d-none` class is automatically removed from the target selector
- **Automatic Detection**: The view system automatically detects if the view name contains 'modal' and opens it

### modal Method in Controller

The `modal` method in the Controller class is used to define the modal selector. You only need to write the modal name:

```javascript
public function modal() {
    return '#modal1'; // or '#modal1' or '.modal1'
}
public function modal() {
    return '.modal1'; // or '#modal1' or '.modal1'
}
```

3. **Auto-opening**: Once detected, the framework:
   - Finds the modal element in the rendered content
   - Checks if Bootstrap 5 is loaded
   - Dynamically loads Bootstrap if needed
   - Creates a new Bootstrap Modal instance (disposes old one if exists)
   - Opens the modal automatically

4. **Bootstrap Support**: 
   - Full Bootstrap 5 integration
   - Dynamic loading when needed
   - Proper instance management for reopening

5. **Reopening**: Each call creates a fresh instance, allowing modals to be reopened multiple times

### Language Files
Language files are located in `lang/{locale}/messages.js`:

```javascript
// lang/en/messages.js
return {
    welcome: 'Welcome',
    description: 'This is a description'
};

// lang/ar/messages.js
return {
    welcome: 'مرحباً',
    description: 'هذا وصف'
};
```
