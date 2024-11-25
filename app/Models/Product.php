<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Product extends Model
{
    protected $fillable = [
        'kategori_id',
        'name',
        'description',
        'price',
        'stock',
        'status'
    ];

    protected $casts = [
        'price' => 'decimal:2'
    ];

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function sizes(): BelongsToMany
{
    return $this->belongsToMany(Size::class, 'product_sizes')
                ->withPivot('stock', 'additional_price')
                ->withTimestamps();
}

// Optional helper method to get available sizes
public function availableSizes()
{
    return $this->sizes()
                ->where('status', true)
                ->wherePivot('stock', '>', 0);
}

public function colors(): BelongsToMany
{
    return $this->belongsToMany(Color::class, 'product_colors')
                ->withPivot('stock', 'additional_price')
                ->withTimestamps();
}

// Helper method for available colors
public function availableColors()
{
    return $this->colors()
                ->where('status', true)
                ->wherePivot('stock', '>', 0);
}

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    // Helper method to get variants with specific combinations
    public function getVariants($sizeId = null, $colorId = null)
    {
        $query = $this->variants();
        
        if ($sizeId) {
            $query->where('size_id', $sizeId);
        }
        
        if ($colorId) {
            $query->where('color_id', $colorId);
        }
        
        return $query;
    }

}
