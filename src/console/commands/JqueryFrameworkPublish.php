<?php

namespace JqueryFramework\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class JqueryFrameworkPublish extends Command
{
    protected $signature = 'jquery:publish';
    protected $description = 'Publish Jquery-Framework folder structure and scripts';

    public function handle()
    {
        $basePath = public_path('Jquery-Framework');
        $artisanTarget = base_path('artisanJs');
        $artisanSource = base_path('vendor/frontend/jquery-framework/src/artisanJs');
        $directories = [
            $basePath . '/app/Http/Controllers',
            $basePath . '/app/Http/Requests',
            $basePath . '/routes',
            $basePath . '/lang/ar',
            $basePath . '/lang/en',
            $basePath . '/config',
        ];
        $this->info("Checking folder structure...");
        foreach ($directories as $dir) {
            if (!File::isDirectory($dir)) {
                File::makeDirectory($dir, 0755, true);
                $this->line("<info>Created:</info> " . str_replace(public_path(), '', $dir));
            }
        }
        if (!File::exists($artisanTarget)) {
            if (File::exists($artisanSource)) {
                File::copy($artisanSource, $artisanTarget);
        
                // Make executable on Unix systems
                if (PHP_OS_FAMILY !== 'Windows') {
                    chmod($artisanTarget, 0755);
                }
        
                $this->info("artisanJs file published to project root.");
            } else {
                $this->warn("artisanJs source file not found in vendor.");
            }
        } else {
            $this->line("artisanJs already exists, skipped.");
        }
        $vEnPath = base_path('vendor/frontend/jquery-framework/src/lang/en/validation.js');
        $vArPath = base_path('vendor/frontend/jquery-framework/src/lang/ar/validation.js');
        $validationEn = File::exists($vEnPath) ? File::get($vEnPath) : "export default {};";
        $validationAr = File::exists($vArPath) ? File::get($vArPath) : "export default {};";
        $files = [
            $basePath . '/routes/web.js' => "import Route from '../../vendor/frontend/jquery-framework/scripts/Route.js';\n\n// Route.get('/', 'HomeController@index');",
            $basePath . '/config/app.js' => "export default {\n    locale: 'ar',\n    availableLocales: ['ar', 'en'],\n    fallbackLocale: 'en'\n};",
            $basePath . '/lang/en/validation.js' => $validationEn,
            $basePath . '/lang/ar/validation.js' => $validationAr,
        ];
        foreach ($files as $path => $content) {
            if (!File::exists($path)) {
                File::put($path, $content);
                $this->line("<info>File Created:</info> " . str_replace(public_path(), '', $path));
            }
        }
        // 4. عملية الربط (Symlink) - تم دمجها هنا مباشرة بدلاً من دالة خارجية
        $target = public_path('jquery-framework/scripts');
        $source = base_path('vendor/frontend/jquery-framework/src/scripts');
        if (PHP_OS_FAMILY === 'Windows') {
            if (File::exists($target)) {
                $this->info("Removing old link...");
                exec("rmdir /s /q \"$target\"");
            }
            if (!File::isDirectory(dirname($target))) {
                File::makeDirectory(dirname($target), 0755, true);
            }
            $this->info("Creating Junction Link...");
            exec("mklink /J \"$target\" \"$source\"");
        } else {
            if (!File::exists($target)) {
                exec("ln -s \"$source\" \"$target\"");
            }
        }
        $this->info("Published successfully!");
        $this->info("Source: $source");
        $this->info("Target: $target");
    }
}