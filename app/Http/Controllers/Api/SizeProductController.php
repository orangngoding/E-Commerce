<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Size;
use App\Models\Color;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SizeProductController extends Controller
{
    public function index(Request $request)
{
    try {
        $query = Size::with(['colors' => function($query) {
            $query->where('status', true);
        }]);

        if ($request->has('status')) {
            $query->where('status', $request->status == 'true');
        }

        if ($request->has('search')) {
            $query->where('name', 'LIKE', "%{$request->search}%");
        }

        $sizes = $query->latest()->paginate(10);

        return new PostResource(true, 'Sizes retrieved successfully', $sizes);
    } catch (\Exception $e) {
        return new PostResource(false, 'Failed to retrieve sizes: ' . $e->getMessage(), null);
    }
}

    public function store(Request $request)
{
    try {
        DB::beginTransaction();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:sizes,name',
            'status' => 'boolean',
            'colors' => 'nullable|string', // JSON string of color IDs
            'colors.*' => 'exists:colors,id'
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation failed', $validator->errors());
        }

        // Create size
        $size = Size::create($validator->validated());

        // Handle colors if provided
        if ($request->has('colors')) {
            $colors = json_decode($request->colors, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($colors)) {
                $size->colors()->attach($colors);
            }
        }

        DB::commit();

        return new PostResource(true, 'Size created successfully', 
            $size->load('colors'));

    } catch (\Exception $e) {
        DB::rollBack();
        return new PostResource(false, 'Failed to create size: ' . $e->getMessage(), null);
    }
}

public function show($id)
{
    try {
        $size = Size::with([
            'colors' => function($query) {
                $query->where('status', true);
            },
            'products' => function($query) {
                $query->where('status', 'published')
                      ->with(['kategori', 'primaryImage']);
            }
        ])->findOrFail($id);

        return new PostResource(true, 'Size retrieved successfully', $size);
    } catch (\Exception $e) {
        return new PostResource(false, 'Size not found', null);
    }
}

    public function update(Request $request, $id)
{
    try {
        DB::beginTransaction();

        $size = Size::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:sizes,name,' . $id,
            'status' => 'boolean',
            'colors' => 'nullable|string', // JSON string of color IDs
            'colors.*' => 'exists:colors,id'
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation failed', $validator->errors());
        }

        // Update size
        $size->update($validator->validated());

        // Handle colors if provided
        if ($request->has('colors')) {
            $colors = json_decode($request->colors, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($colors)) {
                $size->colors()->sync($colors);
            }
        }

        DB::commit();

        return new PostResource(true, 'Size updated successfully', 
            $size->load('colors'));

    } catch (\Exception $e) {
        DB::rollBack();
        return new PostResource(false, 'Failed to update size: ' . $e->getMessage(), null);
    }
}

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $size = Size::findOrFail($id);
            $size->delete();

            DB::commit();

            return new PostResource(true, 'Size deleted successfully', null);
        } catch (\Exception $e) {
            DB::rollBack();
            return new PostResource(false, 'Failed to delete size: ' . $e->getMessage(), null);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
            }

            $size = Size::findOrFail($id);
            $size->update(['status' => $request->status]);

            return new PostResource(true, 'Size status updated successfully', $size);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to update size status: ' . $e->getMessage(), null);
        }
    }

    public function getActiveSizes()
    {
        try {
            $sizes = Size::where('status', true)
                        ->orderBy('name')
                        ->get();

            return new PostResource(true, 'Active sizes retrieved successfully', $sizes);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to retrieve active sizes: ' . $e->getMessage(), null);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = Size::query();

            if ($request->has('search')) {
                $searchTerm = $request->search;
                $query->where('name', 'LIKE', "%{$searchTerm}%");
            }

            $sizes = $query->latest()->paginate(10);

            return new PostResource(true, 'Search results retrieved successfully', $sizes);
        } catch (\Exception $e) {
            return new PostResource(false, 'Search failed: ' . $e->getMessage(), null);
        }
    }

    public function manageColors(Request $request, $id)
{
    try {
        DB::beginTransaction();

        $size = Size::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'colors' => 'required|string', // JSON string of color IDs
            'colors.*' => 'exists:colors,id'
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation failed', $validator->errors());
        }

        $colors = json_decode($request->colors, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($colors)) {
            $size->colors()->sync($colors);
        }

        DB::commit();

        return new PostResource(true, 'Size colors updated successfully', 
            $size->load('colors'));

    } catch (\Exception $e) {
        DB::rollBack();
        return new PostResource(false, 'Failed to update size colors: ' . $e->getMessage(), null);
    }
}
}
