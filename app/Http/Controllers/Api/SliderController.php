<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Slider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SliderController extends Controller
{
    /**
     * Display a listing of sliders
     */
    public function index()
    {
        $sliders = Slider::latest()->paginate(10);
        
        $sliders->getCollection()->transform(function ($slider) {
            $slider->image_url = $slider->image_url; // This will use the accessor
            return $slider;
        });

        return new PostResource(true, 'List Data Slider', $sliders);
    }

    /**
     * Store a new slider
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'judul' => 'required|string|max:255',
            'status' => 'boolean'
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation Error', $validator->errors());
        }

        // Upload image
        $image = $request->file('image');
        $image->storeAs('public/sliders', $image->hashName());

        $slider = Slider::create([
            'image' => 'sliders/' . $image->hashName(),
            'judul' => $request->judul,
            'status' => $request->status ?? true
        ]);

        return new PostResource(true, 'Slider Created Successfully', $slider);
    }

    /**
     * Display the specified slider
     */
    public function show($id)
    {
        $slider = Slider::find($id);
        
        if (!$slider) {
            return new PostResource(false, 'Slider Not Found', null);
        }

        return new PostResource(true, 'Slider Detail', $slider);
    }

    /**
     * Update the specified slider
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'judul' => 'required|string|max:255',
            'status' => 'boolean'
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation Error', $validator->errors());
        }

        $slider = Slider::find($id);

        if (!$slider) {
            return new PostResource(false, 'Slider Not Found', null);
        }

        if ($request->hasFile('image')) {
            // Delete old image
            if ($slider->image && Storage::exists('public/' . $slider->image)) {
                Storage::delete('public/' . $slider->image);
            }

            // Upload new image
            $image = $request->file('image');
            $image->storeAs('public/sliders', $image->hashName());
            $slider->image = 'sliders/' . $image->hashName();
        }

        $slider->judul = $request->judul;
        $slider->status = $request->status ?? $slider->status;
        $slider->save();

        return new PostResource(true, 'Slider Updated Successfully', $slider);
    }

    /**
     * Remove the specified slider
     */
    public function destroy($id)
    {
        $slider = Slider::find($id);

        if (!$slider) {
            return new PostResource(false, 'Slider Not Found', null);
        }

        // Delete image
        if ($slider->image && Storage::exists('public/' . $slider->image)) {
            Storage::delete('public/' . $slider->image);
        }

        $slider->delete();

        return new PostResource(true, 'Slider Deleted Successfully', null);
    }

    /**
     * Search sliders
     */
    public function search(Request $request)
    {
        $query = $request->get('q');
        
        $sliders = Slider::where('judul', 'LIKE', "%{$query}%")
            ->latest()
            ->paginate(10);

        return new PostResource(true, 'Search Results', $sliders);
    }

    /**
     * Update slider status
     */
    public function updateStatus(Request $request, $id)
    {
        $slider = Slider::find($id);

        if (!$slider) {
            return new PostResource(false, 'Slider Not Found', null);
        }

        $slider->status = !$slider->status;
        $slider->save();

        return new PostResource(true, 'Slider Status Updated Successfully', $slider);
    }

    /**
     * Get active sliders
     */
    public function getActiveSliders()
    {
        $sliders = Slider::active()->latest()->get();
        return new PostResource(true, 'Active Sliders', $sliders);
    }
}
