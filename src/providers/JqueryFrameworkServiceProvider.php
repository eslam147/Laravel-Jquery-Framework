<?php

namespace JqueryFramework\Providers;

use Illuminate\Support\ServiceProvider;
use JqueryFramework\console\commands\JqueryFrameworkPublish;
use Illuminate\Support\Facades\Route;
class JqueryFrameworkServiceProvider extends ServiceProvider
{
    public function boot()
    {
        
        Route::middleware('web')->group(function () {
            // Route لجلب controllers
            Route::get('/api/controllers', function () {
                $controllersPath = public_path('Jquery-Framework/app/Http/Controllers');

                if (!is_dir($controllersPath)) {
                    return response()->json([], 404);
                }

                $files = scandir($controllersPath);
                $controllers = [];

                foreach ($files as $file) {
                    if ($file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'js') {
                        $controllers[] = $file;
                    }
                }

                return response()->json($controllers);
            });

            // Route لتحميل الـ Blade views
            Route::post('/__views/{path}', function ($path) {
                $data = (object) request()->all();
                $view = str_replace('.', '/', $path);
                return view($view, compact('data'))->render();
            })->where('path', '.*');
        });
        if ($this->app->runningInConsole()) {
            $this->publishes([
                base_path('vendor/Jquery-Framework/src/scripts') => public_path('jquery-framework/scripts'),
            ], 'jquery-framework');
        }
    }

    public function register()
    {
        // تسجيل الأمر
        if ($this->app->runningInConsole()) {
            $this->commands([
                JqueryFrameworkPublish::class,
            ]);
        }
    }
}