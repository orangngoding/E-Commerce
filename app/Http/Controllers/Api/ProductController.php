<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Product;
use App\Models\ProductImage;
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
            $query = Product::with(['kategori' => function ($query) {
                $query->where('status', true);
            }, 'primaryImage', 'images'])
            ->whereHas('kategori', function (Builder $query) {
                $query->where('status', true);
            });

            // Existing filters remain the same
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('kategori_id')) {
                $query->where('kategori_id', $request->kategori_id);
            }

            if ($request->has('in_stock')) {
                $query->where('stock', '>', 0);
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
                'status' => 'required|in:published,draft'
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
            }

            $kategori = Kategori::find($request->kategori_id);
            if (!$kategori->status) {
                return new PostResource(false, 'Selected category is inactive', null);
            }

            $product = Product::create($validator->validated());

            // Handle multiple images
            if ($request->hasFile('images')) {
                $primarySet = false;
                
                foreach ($request->file('images') as $index => $image) {
                    $imagePath = $image->store('products', 'public');
                    
                    // Check if this image should be primary
                    $isPrimary = $request->has('is_primary') && 
                                isset($request->is_primary[$index]) && 
                                $request->is_primary[$index] === '1';
                    
                    // If no primary image set yet, make first image primary
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
                $product->load(['kategori', 'images', 'primaryImage']));

        } catch (\Exception $e) {
            DB::rollBack();
            return new PostResource(false, 'Failed to create product: ' . $e->getMessage(), null);
        }
    }

    public function show($id)
    {
        try {
            $product = Product::with(['kategori' => function ($query) {
                $query->where('status', true);
            }])->whereHas('kategori', function (Builder $query) {
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
                'existing_images' => 'sometimes|json'
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
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
                $product->load(['kategori', 'images', 'primaryImage']));

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

}
