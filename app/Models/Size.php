<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Size extends Model
{
    protected $fillable = ['name', 'status'];

    protected $casts = [
        'status' => 'boolean'
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_sizes')
                    ->withPivot('stock', 'additional_price')
                    ->withTimestamps();
    }

    public function colors(): BelongsToMany
    {
        return $this->belongsToMany(Color::class, 'size_colors')
                    ->withTimestamps();
    }

    public function productVariants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
