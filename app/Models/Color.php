<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Color extends Model
{
    protected $fillable = [
        'name',
        'hex_code',
        'status'
    ];

    protected $casts = [
        'status' => 'boolean'
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_colors')
                    ->withPivot('stock', 'additional_price')
                    ->withTimestamps();
    }

    public function sizes(): BelongsToMany
    {
        return $this->belongsToMany(Size::class, 'size_colors')
                    ->withTimestamps();
    }

    public function productVariants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
