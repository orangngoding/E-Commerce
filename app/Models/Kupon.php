<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kupon extends Model
{
    protected $fillable = [
        'code',
        'discount_amount',
        'discount_type',
        'start_date',
        'end_date',
        'is_active',
        'max_usage',
        'current_usage'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'discount_amount' => 'decimal:2'
    ];
}
