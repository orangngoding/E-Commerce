<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;


class Slider extends Model
{
    use HasFactory;

    /**
     * The table associated with the model
     */
    protected $table = 'sliders';

    /**
     * The attributes that are mass assignable
     */
    protected $fillable = [
        'image',
        'judul',
        'status'
    ];

    /**
     * The attributes that should be cast
     */
    protected $casts = [
        'status' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the image URL attribute
     */
    public function getImageUrlAttribute()
    {
        return $this->image ? Storage::url($this->image) : null;
    }



    /**
     * Scope for active sliders
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope for inactive sliders
     */
    public function scopeInactive($query)
    {
        return $query->where('status', false);
    }

    /**
     * Boot method to handle events
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($slider) {
            // Delete the image file when the slider is deleted
            if ($slider->image && Storage::exists('public/' . $slider->image)) {
                Storage::delete('public/' . $slider->image);
            }
        });
    }
}
