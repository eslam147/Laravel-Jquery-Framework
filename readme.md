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
