<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class CustomerUser extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password',
        'status',
        'last_login_at'
    ];
    
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $guard = 'customer';

    protected static function boot()
    {
        parent::boot();
        
        static::deleting(function($customer) {
            // Revoke all tokens when soft deleted
            $customer->tokens()->delete();
        });
    }

    // Scope for active users
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Update last login timestamp
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

}
