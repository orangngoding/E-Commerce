<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Color;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ColorProductController extends Controller
{
    public function index(Request $request)
{
    try {
        $query = Color::query();

        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('hex_code', 'LIKE', "%{$searchTerm}%");
            });
        }

        $perPage = $request->get('per_page', 10);
        $colors = $query->latest()->paginate($perPage);

        return new PostResource(true, 'Colors retrieved successfully', $colors);
    } catch (\Exception $e) {
        return new PostResource(false, 'Failed to retrieve colors: ' . $e->getMessage(), null);
    }
}

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'hex_code' => 'nullable|string|max:7',
                'status' => 'boolean'
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
            }

            $color = Color::create($validator->validated());
            return new PostResource(true, 'Color created successfully', $color);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to create color: ' . $e->getMessage(), null);
        }
    }

    public function show($id)
    {
        try {
            $color = Color::with('products')->findOrFail($id);
            return new PostResource(true, 'Color details retrieved successfully', $color);
        } catch (\Exception $e) {
            return new PostResource(false, 'Color not found', null);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $color = Color::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'hex_code' => 'nullable|string|max:7',
                'status' => 'boolean'
            ]);

            if ($validator->fails()) {
                return new PostResource(false, 'Validation failed', $validator->errors());
            }

            $color->update($validator->validated());
            return new PostResource(true, 'Color updated successfully', $color);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to update color: ' . $e->getMessage(), null);
        }
    }

    public function destroy($id)
    {
        try {
            $color = Color::findOrFail($id);
            $color->delete();
            return new PostResource(true, 'Color deleted successfully', null);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to delete color: ' . $e->getMessage(), null);
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

            $color = Color::findOrFail($id);
            $color->update(['status' => $request->status]);

            return new PostResource(true, 'Color status updated successfully', $color);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to update color status: ' . $e->getMessage(), null);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = Color::query();

            if ($request->has('search')) {
                $searchTerm = $request->search;
                $query->where('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('hex_code', 'LIKE', "%{$searchTerm}%");
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $colors = $query->latest()->paginate(10);

            return new PostResource(true, 'Search results retrieved successfully', $colors);
        } catch (\Exception $e) {
            return new PostResource(false, 'Search failed: ' . $e->getMessage(), null);
        }
    }

    public function getActiveColors()
    {
        try {
            $colors = Color::where('status', true)
                          ->latest()
                          ->get();

            return new PostResource(true, 'Active colors retrieved successfully', $colors);
        } catch (\Exception $e) {
            return new PostResource(false, 'Failed to retrieve active colors: ' . $e->getMessage(), null);
        }
    }
}
