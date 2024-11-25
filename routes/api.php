<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SizeProductController;
use App\Http\Controllers\Api\ColorProductController;
use App\Http\Controllers\Api\SliderController;
use App\Http\Controllers\Api\KuponController;
use App\Http\Controllers\Api\RegisterCustomerController;
use App\Http\Controllers\Api\LoginCustomerController;
use App\Http\Controllers\Api\CustomerUserController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Password reset routes
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');


Route::prefix('customer')->group(function () {
    Route::post('/register', [RegisterCustomerController::class, 'register']);
    Route::post('/verify-otp', [RegisterCustomerController::class, 'verifyOtp']);
    Route::post('/resend-otp', [RegisterCustomerController::class, 'resendOtp']);
    Route::post('/login', [LoginCustomerController::class, 'login']);
    Route::post('/forgot-password', [LoginCustomerController::class, 'forgotPassword']);
    Route::post('/reset-password', [LoginCustomerController::class, 'resetPassword']);
    
    // Protected routes
    Route::middleware(['auth:customer', 'ensure.customer.active'])->group(function () {
        Route::post('/logout', [LoginCustomerController::class, 'logout']);
        Route::get('/me', [LoginCustomerController::class, 'me']);
        Route::put('/profile', [LoginCustomerController::class, 'updateProfile']);
        Route::post('/change-password', [LoginCustomerController::class, 'changePassword']);
    });
});

// public route kategoris
Route::get('/kategoris', [KategoriController::class, 'index']);
Route::get('/kategoris/search', [KategoriController::class, 'search']);
Route::get('/kategoris/{id}', [KategoriController::class, 'show']);

// public route products
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/latest-published', [ProductController::class, 'getLatestPublished']);
Route::get('/products/get-published/{id?}', [ProductController::class, 'getPublished']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/{id}', [ProductController::class, 'show']);

//public route sliders
Route::get('/sliders', [SliderController::class, 'index']);
Route::get('/sliders/search', [SliderController::class, 'search']);
Route::get('/sliders/active', [SliderController::class, 'getActiveSliders']);
Route::get('/sliders/{id}', [SliderController::class, 'show']);

// Protected routes
Route::middleware(['auth:admin'])->group(function () {
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

    Route::prefix('customer-users')->group(function () {
        Route::get('/', [CustomerUserController::class, 'index']);
        Route::get('/search', [CustomerUserController::class, 'search']);
        Route::get('/statistics', [CustomerUserController::class, 'statistics']);
        Route::get('/{id}', [CustomerUserController::class, 'show']);
        Route::patch('/{id}/status', [CustomerUserController::class, 'updateStatus']);
        Route::delete('/{id}', [CustomerUserController::class, 'destroy']);
    });
    
    Route::prefix('sizes')->group(function () {
        Route::get('/', [SizeProductController::class, 'index']);
        Route::post('/', [SizeProductController::class, 'store']);
        Route::get('/search', [SizeProductController::class, 'search']);
        Route::get('/active', [SizeProductController::class, 'getActiveSizes']);
        Route::get('/{id}', [SizeProductController::class, 'show']);
        Route::put('/{id}', [SizeProductController::class, 'update']);
        Route::delete('/{id}', [SizeProductController::class, 'destroy']);
        Route::patch('/{id}/status', [SizeProductController::class, 'updateStatus']);
        Route::post('/{id}/colors', [SizeProductController::class, 'manageColors']);
    });

    Route::prefix('colors')->group(function () {
        Route::get('/', [ColorProductController::class, 'index']);
        Route::post('/', [ColorProductController::class, 'store']);
        Route::get('/search', [ColorProductController::class, 'search']);
        Route::get('/active', [ColorProductController::class, 'getActiveColors']);
        Route::get('/{id}', [ColorProductController::class, 'show']);
        Route::put('/{id}', [ColorProductController::class, 'update']);
        Route::delete('/{id}', [ColorProductController::class, 'destroy']);
        Route::patch('/{id}/status', [ColorProductController::class, 'updateStatus']);
    });
});

});
