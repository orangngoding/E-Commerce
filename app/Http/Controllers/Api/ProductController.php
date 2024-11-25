<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\Size;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Product::with([
                'kategori' => function ($query) {
                    $query->where('status', true);
                },
                'primaryImage',
                'images',
                'sizes' => function ($query) {
                    $query->where('status', true);
                },
                'colors' => function ($query) {
                    $query->where('status', true);
                },
                'variants' // Add this relationship
            ])->whereHas('kategori', function (Builder $query) {
                $query->where('status', true);
            });

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('kategori_id')) {
                $query->where('kategori_id', $request->kategori_id);
            }

            if ($request->has('in_stock')) {
                $query->where(function ($query) {
                    $query->where('stock', '>', 0)
                        ->orWhereHas('sizes', function ($q) {
                            $q->where('product_sizes.stock', '>', 0);
                        });
                });
            }

            if ($request->has('size_id')) {
                $query->whereHas('sizes', function ($q) use ($request) {
                    $q->where('sizes.id', $request->size_id);
                });
            }

            if ($request->has('color_id')) {
                $query->whereHas('colors', function ($q) use ($request) {
                    $q->where('colors.id', $request->color_id);
                });
            }    

            $products = $query->latest()->paginate(10);

            return new PostResource(true, 'Products retrieved successfully', $products);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to retrieve products: ' . $e->getMessage(), null);
        }
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'kategori_id' => 'required|exists:kategoris,id',
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'stock' => 'nullable|integer|min:0',
                'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'is_primary.*' => 'nullable|boolean',
                'status' => 'required|in:published,draft',
                'sizes' => 'nullable|string',
                'sizes.*.size_id' => 'required|exists:sizes,id',
                'sizes.*.stock' => 'required|integer|min:0',
                'sizes.*.additional_price' => 'nullable|numeric|min:0',
                'colors' => 'nullable|string', 
                'colors.*.color_id' => 'required|exists:colors,id',
                'colors.*.stock' => 'required|integer|min:0',
                'colors.*.additional_price' => 'nullable|numeric|min:0',
                'size_variants' => 'nullable|string',
                'size_variants.*.size_id' => 'nullable|exists:sizes,id',
                'size_variants.*.stock' => 'nullable|integer|min:0',
                'size_variants.*.additional_price' => 'nullable|numeric|min:0',
                'size_variants.*.colors' => 'nullable|array',
                'size_variants.*.colors.*.color_id' => 'nullable|exists:colors,id',
                'size_variants.*.colors.*.stock' => 'nullable|integer|min:0',
                'size_variants.*.colors.*.additional_price' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
            }

            $kategori = Kategori::find($request->kategori_id);
            if (!$kategori->status) {
                return new PostResource(false, 'Selected category is inactive', null);
            }

            $product = Product::create($validator->validated());

            // Handle sizes if provided
            if ($request->has('sizes')) {
                $sizes = json_decode($request->sizes, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    foreach ($sizes as $sizeData) {
                        if (!empty($sizeData['size_id'])) {
                            $product->sizes()->attach($sizeData['size_id'], [
                                'stock' => $sizeData['stock'] ?? 0,
                                'additional_price' => $sizeData['additional_price'] ?? 0
                            ]);
                        }
                    }
                }
            }

            //handle colors if provided
            if ($request->has('colors')) {
                $colors = json_decode($request->colors, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    foreach ($colors as $colorData) {
                        if (!empty($colorData['color_id'])) {
                            $product->colors()->attach($colorData['color_id'], [
                                'stock' => $colorData['stock'] ?? 0,
                                'additional_price' => $colorData['additional_price'] ?? 0
                            ]);
                        }
                    }
                }
            }

            //handle size variants
            if ($request->has('size_variants')) {
                $sizeVariants = json_decode($request->size_variants, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($sizeVariants)) {
                    foreach ($sizeVariants as $variant) {
                        if (!empty($variant['size_id']) && !empty($variant['color_id'])) {
                            // Create the variant
                            ProductVariant::create([
                                'product_id' => $product->id,
                                'size_id' => $variant['size_id'],
                                'color_id' => $variant['color_id'],
                                'stock' => $variant['stock'] ?? 0,
                                'additional_price' => $variant['additional_price'] ?? 0
                            ]);
            
                            // Ensure size-color relationship exists
                            DB::table('size_colors')->updateOrInsert(
                                [
                                    'size_id' => $variant['size_id'],
                                    'color_id' => $variant['color_id']
                                ],
                                [
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]
                            );
                        }
                    }
                }
            }
            

            // Handle images (existing code remains the same)
            if ($request->hasFile('images')) {
                $primarySet = false;
                
                foreach ($request->file('images') as $index => $image) {
                    $imagePath = $image->store('products', 'public');
                    
                    $isPrimary = $request->has('is_primary') && 
                                isset($request->is_primary[$index]) && 
                                $request->is_primary[$index] === '1';
                    
                    if (!$primarySet && (!$request->has('is_primary') || $isPrimary)) {
                        $isPrimary = true;
                        $primarySet = true;
                    }
                    
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image' => $imagePath,
                        'is_primary' => $isPrimary,
                        'order' => $index
                    ]);
                }
            }

            DB::commit();

            return new PostResource(true, 'Product created successfully', 
                $product->load(['kategori', 'images', 'primaryImage', 'sizes', 'colors', 'variants']));

        } catch (\Exception $e) {
            DB::rollBack();
            return new PostResource(false, 'Failed to create product: ' . $e->getMessage(), null);
        }
    }

    public function show($id)
{
    try {
        $product = Product::with([
            'kategori' => function ($query) {
                $query->where('status', true);
            },
            'primaryImage',
            'images',
            'sizes' => function ($query) {
                $query->where('status', true);
            },
            'colors' => function ($query) {
                $query->where('status', true);
            },
            'variants' // Add this relationship
        ])->whereHas('kategori', function (Builder $query) {
            $query->where('status', true);
        })->findOrFail($id);

        return new PostResource(true, 'Product details retrieved successfully', $product);
    } catch (\Exception $e) {
        return new PostResource(false, 'Product not found or category inactive', null);
    }
}

    public function update(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $product = Product::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'kategori_id' => 'sometimes|required|exists:kategoris,id',
                'name' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string',
                'price' => 'sometimes|required|numeric|min:0',
                'stock' => 'nullable|integer|min:0',
                'images.*' => 'sometimes|required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'is_primary.*' => 'nullable|boolean',
                'status' => 'sometimes|required|in:published,draft',
                'images_to_remove' => 'sometimes|json',
                'existing_images' => 'sometimes|json',
                'sizes' => 'nullable|string',
                'sizes.*.size_id' => 'nullable|exists:sizes,id',
                'sizes.*.stock' => 'nullable|integer|min:0',
                'sizes.*.additional_price' => 'nullable|numeric|min:0',
                'sizes.*.to_delete' => 'nullable|boolean',
                'colors' => 'nullable|string',
                'colors.*.color_id' => 'nullable|exists:colors,id',
                'colors.*.stock' => 'nullable|integer|min:0',
                'colors.*.additional_price' => 'nullable|numeric|min:0',
                'colors.*.to_delete' => 'nullable|boolean',
                'size_variants' => 'nullable|string',
                'size_variants.*.size_id' => 'nullable|exists:sizes,id',
                'size_variants.*.stock' => 'nullable|integer|min:0',
                'size_variants.*.additional_price' => 'nullable|numeric|min:0',
                'size_variants.*.to_delete' => 'nullable|boolean',
                'size_variants.*.colors' => 'nullable|array',
                'size_variants.*.colors.*.color_id' => 'nullable|exists:colors,id',
                'size_variants.*.colors.*.stock' => 'nullable|integer|min:0',
                'size_variants.*.colors.*.additional_price' => 'nullable|numeric|min:0',
                'size_variants.*.colors.*.to_delete' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
            }

            // Handle sizes update
            if ($request->has('sizes')) {
                $sizes = json_decode($request->sizes, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($sizes)) {
                    // Get all current size IDs
                    $currentSizeIds = $product->sizes()->pluck('sizes.id')->toArray();
                    
                    // Track sizes to keep and update
                    $sizesToKeep = [];
                    $sizeData = [];
                    
                    foreach ($sizes as $size) {
                        // Skip if no size_id or marked for deletion
                        if (empty($size['size_id']) || !empty($size['to_delete'])) {
                            continue;
                        }
                        
                        $sizesToKeep[] = (int)$size['size_id'];
                        $sizeData[(int)$size['size_id']] = [
                            'stock' => $size['stock'] ?? 0,
                            'additional_price' => $size['additional_price'] ?? 0
                        ];
                    }
                    
                    // Detach sizes not in sizesToKeep
                    $sizesToDelete = array_diff($currentSizeIds, $sizesToKeep);
                    if (!empty($sizesToDelete)) {
                        $product->sizes()->detach($sizesToDelete);
                    }
                    
                    // Sync remaining sizes with their data
                    if (!empty($sizeData)) {
                        $product->sizes()->sync($sizeData);
                    }
                }
            }

            // Handle colors update
        if ($request->has('colors')) {
            $colors = json_decode($request->colors, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($colors)) {
                // Get current color IDs
                $currentColorIds = $product->colors()->pluck('colors.id')->toArray();
                
                // Track colors to keep and update
                $colorsToKeep = [];
                $colorData = [];
                
                foreach ($colors as $color) {
                    if (empty($color['color_id']) || !empty($color['to_delete'])) {
                        continue;
                    }
                    
                    $colorsToKeep[] = (int)$color['color_id'];
                    $colorData[(int)$color['color_id']] = [
                        'stock' => $color['stock'] ?? 0,
                        'additional_price' => $color['additional_price'] ?? 0
                    ];
                }
                
                // Detach colors not in colorsToKeep
                $colorsToDelete = array_diff($currentColorIds, $colorsToKeep);
                if (!empty($colorsToDelete)) {
                    $product->colors()->detach($colorsToDelete);
                }
                
                // Sync remaining colors with their data
                if (!empty($colorData)) {
                    $product->colors()->sync($colorData);
                }
            }
        }

        //handle size variants update
        if ($request->has('size_variants')) {
            $sizeVariants = json_decode($request->size_variants, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($sizeVariants)) {
                // Get current variant IDs
                $currentVariantIds = $product->variants()->pluck('id')->toArray();
                $keepVariantIds = [];
                $variantsToDelete = [];
        
                foreach ($sizeVariants as $variant) {
                    // Check if variant is marked for deletion
                    if (!empty($variant['to_delete'])) {
                        if (!empty($variant['pivot_id'])) {
                            $variantsToDelete[] = $variant['pivot_id'];
                        }
                        continue;
                    }
        
                    // Skip invalid variants
                    if (empty($variant['size_id']) || empty($variant['color_id'])) {
                        continue;
                    }
        
                    // Find existing variant or create new one
                    $existingVariant = $product->variants()
                        ->where('size_id', $variant['size_id'])
                        ->where('color_id', $variant['color_id'])
                        ->first();
        
                    if ($existingVariant) {
                        // Update existing variant
                        $existingVariant->update([
                            'stock' => $variant['stock'] ?? 0,
                            'additional_price' => $variant['additional_price'] ?? 0
                        ]);
                        $keepVariantIds[] = $existingVariant->id;
                    } else {
                        // Create new variant
                        $newVariant = $product->variants()->create([
                            'size_id' => $variant['size_id'],
                            'color_id' => $variant['color_id'],
                            'stock' => $variant['stock'] ?? 0,
                            'additional_price' => $variant['additional_price'] ?? 0
                        ]);
                        $keepVariantIds[] = $newVariant->id;
                    }
        
                    // Ensure size-color relationship exists
                    DB::table('size_colors')->updateOrInsert(
                        [
                            'size_id' => $variant['size_id'],
                            'color_id' => $variant['color_id']
                        ],
                        [
                            'updated_at' => now()
                        ]
                    );
                }
        
                // Delete variants that are marked for deletion or no longer needed
                $allVariantsToDelete = array_unique(array_merge(
                    $variantsToDelete,
                    array_diff($currentVariantIds, $keepVariantIds)
                ));
        
                if (!empty($allVariantsToDelete)) {
                    ProductVariant::whereIn('id', $allVariantsToDelete)->delete();
                }
            }
        }
    
        if ($request->has('kategori_id')) {
            $kategori = Kategori::find($request->kategori_id);
            if (!$kategori->status) {
                return new PostResource(false, 'Selected category is inactive', null);
            }
        }

            // Handle image removals
        if ($request->has('images_to_remove')) {
            $imagesToRemove = json_decode($request->images_to_remove);
            foreach ($imagesToRemove as $imageId) {
                $image = ProductImage::where('product_id', $product->id)
                    ->where('id', $imageId)
                    ->first();
                    
                if ($image) {
                    Storage::disk('public')->delete($image->image);
                    $image->delete();
                }
            }
        }

        // Update existing images primary status
        if ($request->has('existing_images')) {
            $existingImages = json_decode($request->existing_images, true);
            foreach ($existingImages as $imageId => $isPrimary) {
                ProductImage::where('product_id', $product->id)
                    ->where('id', $imageId)
                    ->update(['is_primary' => $isPrimary === '1']);
            }
        }

        // Handle new images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $imagePath = $image->store('products', 'public');
                
                $isPrimary = $request->has('is_primary') && 
                            isset($request->is_primary[$index]) && 
                            $request->is_primary[$index] === '1';
                
                ProductImage::create([
                    'product_id' => $product->id,
                    'image' => $imagePath,
                    'is_primary' => $isPrimary,
                    'order' => $product->images()->max('order') + 1
                ]);
            }
        }

        // Update product details
        $product->update($validator->validated());

            DB::commit();

            return new PostResource(true, 'Product updated successfully', 
                $product->load(['kategori', 'images', 'primaryImage', 'sizes', 'colors', 'variants']));

        } catch (\Exception $e) {
            DB::rollBack();
            return new PostResource(false, 'Failed to update product: ' . $e->getMessage(), null);
        }
    }


    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $product = Product::with('images')->findOrFail($id);

            // Delete all associated images
            foreach ($product->images as $image) {
                Storage::disk('public')->delete($image->image);
                $image->delete();
            }

            $product->delete();

            DB::commit();

            return new PostResource(true, 'Product deleted successfully', null);
        } catch (\Exception $e) {
            DB::rollBack();
            return new PostResource(false, 'Failed to delete product: ' . $e->getMessage(), null);
        }
    }

    public function search(Request $request)
{
    try {
        $query = Product::with(['kategori' => function ($query) {
            $query->where('status', true);
        }, 'primaryImage', 'images']) // Add these relationships
        ->whereHas('kategori', function (Builder $query) {
            $query->where('status', true);
        });

        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('description', 'LIKE', "%{$searchTerm}%");
            });
        }

        $products = $query->latest()->paginate(10);

        return new PostResource(true, 'Search results retrieved successfully', $products);
    } catch (\Exception $e) {
        return new PostResource(false, 'Search failed: ' . $e->getMessage(), null);
    }
}

    public function updateStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:published,draft'
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
            }

            $product = Product::findOrFail($id);
            $product->update(['status' => $request->status]);

            return new PostResource(true, 'Product status updated successfully', $product->load('kategori'));
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to update product status: ' . $e->getMessage(), null);
        }
    }

    public function getLatestPublished()
{
    try {
        $products = Product::with([
            'kategori' => function ($query) {
                $query->where('status', true);
            },
            'primaryImage',
            'images',
            'sizes' => function ($query) {
                $query->where('status', true);
            }
        ])->whereHas('kategori', function (Builder $query) {
            $query->where('status', true);
        })
        ->where('status', 'published')
        ->latest()
        ->take(5)
        ->get();

        return new PostResource(true, 'Latest products retrieved successfully', $products);
    } catch (\Exception $e) {
        return new PostResource(false, 'Failed to retrieve latest products: ' . $e->getMessage(), null);
    }
}

public function getPublished($id = null)
{
    try {
        $query = Product::with([
            'kategori' => function ($query) {
                $query->where('status', true);
            },
            'primaryImage',
            'images',
            'sizes' => function ($query) {
                $query->where('status', true);
            },
            'colors' => function ($query) {
                $query->where('status', true);
            },
            'variants',
            'variants.size', // Tambahkan ini
            'variants.color' // Tambahkan ini
        ])->whereHas('kategori', function (Builder $query) {
            $query->where('status', true);
        })
        ->where('status', 'published');

        // If ID is provided, get single product details
        if ($id) {
            $product = $query->findOrFail($id);
            return new PostResource(true, 'Product details retrieved successfully', $product);
        }

        // Otherwise return all published products
        $products = $query->get();
        return new PostResource(true, 'Published products retrieved successfully', $products);
    } catch (\Exception $e) {
        return new PostResource(false, 'Failed to retrieve products: ' . $e->getMessage(), null);
    }
}

}
