<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SliderController;
use App\Http\Controllers\Api\KuponController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Password reset routes
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');

// public route kategoris
Route::get('/kategoris', [KategoriController::class, 'index']);
Route::get('/kategoris/search', [KategoriController::class, 'search']);
Route::get('/kategoris/{id}', [KategoriController::class, 'show']);

// public route products
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/{id}', [ProductController::class, 'show']);

//public route sliders
Route::get('/sliders', [SliderController::class, 'index']);
Route::get('/sliders/search', [SliderController::class, 'search']);
Route::get('/sliders/active', [SliderController::class, 'getActiveSliders']);
Route::get('/sliders/{id}', [SliderController::class, 'show']);

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Super Admin only routes
    Route::middleware(['role:super_admin'])->group(function () {
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::post('/', [UserController::class, 'store']);
            Route::get('/search', [UserController::class, 'search']);
            Route::get('/{user}', [UserController::class, 'show']);
            Route::put('/{user}', [UserController::class, 'update']);
            Route::delete('/{user}', [UserController::class, 'destroy']);
            Route::patch('/{user}/status', [UserController::class, 'updateStatus']);
        });
    });

    //staff and super admin route
    Route::middleware(['role:super_admin,staff'])->group(function () {

    Route::prefix('kategoris')->group(function () {
        Route::post('/', [KategoriController::class, 'store']);
        Route::put('/{id}', [KategoriController::class, 'update']);
        Route::delete('/{id}', [KategoriController::class, 'destroy']);
        Route::patch('/{id}/status', [KategoriController::class, 'updateStatus']);
    });

    Route::prefix('products')->group(function () {
        Route::post('/', [ProductController::class, 'store']);
        Route::post('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
        Route::patch('/{id}/status', [ProductController::class, 'updateStatus']);
        
    });

    Route::prefix('sliders')->group(function () {
        Route::post('/', [SliderController::class, 'store']);
        Route::post('/{id}', [SliderController::class, 'update']);
        Route::delete('/{id}', [SliderController::class, 'destroy']);
        Route::patch('/{id}/status', [SliderController::class, 'updateStatus']);
    });

    Route::prefix('kupons')->group(function () {
        Route::get('/', [KuponController::class, 'index']);
        Route::post('/', [KuponController::class, 'store']);
        Route::get('/search', [KuponController::class, 'search']);
        Route::get('/active', [KuponController::class, 'getActiveKupons']);
        Route::get('/{id}', [KuponController::class, 'show']);
        Route::put('/{id}', [KuponController::class, 'update']);
        Route::delete('/{id}', [KuponController::class, 'destroy']);
        Route::patch('/{id}/status', [KuponController::class, 'updateStatus']);
    });
    
});

});
