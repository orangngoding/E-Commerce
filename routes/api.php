<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SliderController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Password reset routes
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');


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
        Route::get('/', [KategoriController::class, 'index']);
        Route::post('/', [KategoriController::class, 'store']);
        Route::get('/search', [KategoriController::class, 'search']);
        Route::get('/{id}', [KategoriController::class, 'show']);
        Route::post('/{id}', [KategoriController::class, 'update']);
        Route::delete('/{id}', [KategoriController::class, 'destroy']);
        Route::patch('/{id}/status', [KategoriController::class, 'updateStatus']);
    });

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::get('/search', [ProductController::class, 'search']);
        Route::get('/{id}', [ProductController::class, 'show']);
        Route::post('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
        Route::patch('/{id}/status', [ProductController::class, 'updateStatus']);
        
    });

    Route::prefix('sliders')->group(function () {
        Route::get('/', [SliderController::class, 'index']);
        Route::post('/', [SliderController::class, 'store']);
        Route::get('/search', [SliderController::class, 'search']);
        Route::get('/active', [SliderController::class, 'getActiveSliders']);
        Route::get('/{id}', [SliderController::class, 'show']);
        Route::post('/{id}', [SliderController::class, 'update']);
        Route::delete('/{id}', [SliderController::class, 'destroy']);
        Route::patch('/{id}/status', [SliderController::class, 'updateStatus']);
    });
});

});
