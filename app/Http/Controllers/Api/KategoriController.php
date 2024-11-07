<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class KategoriController extends Controller
{
    public function index()
    {
        $kategoris = Kategori::latest()->paginate(10);
        return new PostResource(true, 'List Data Kategori', $kategoris);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'status' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation Error', $validator->errors());
        }

        $image = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image')->store('kategoris', 'public');
        }

        $kategori = Kategori::create([
            'name' => $request->name,
            'image' => $image,
            'status' => $request->status
        ]);

        return new PostResource(true, 'Kategori Created Successfully', $kategori);
    }

    public function show($id)
    {
        $kategori = Kategori::with('products')->find($id);
        
        if (!$kategori) {
            return new PostResource(false, 'Kategori Not Found', null);
        }

        return new PostResource(true, 'Detail Kategori', $kategori);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'status' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation Error', $validator->errors());
        }

        $kategori = Kategori::find($id);

        if (!$kategori) {
            return new PostResource(false, 'Kategori Not Found', null);
        }

        if ($request->hasFile('image')) {
            if ($kategori->image) {
                Storage::disk('public')->delete($kategori->image);
            }
            $image = $request->file('image')->store('kategoris', 'public');
            $kategori->image = $image;
        }

        $kategori->name = $request->name;
        $kategori->status = $request->status;
        $kategori->save();

        return new PostResource(true, 'Kategori Updated Successfully', $kategori);
    }

    public function destroy($id)
    {
        $kategori = Kategori::find($id);

        if (!$kategori) {
            return new PostResource(false, 'Kategori Not Found', null);
        }

        if ($kategori->image) {
            Storage::disk('public')->delete($kategori->image);
        }

        $kategori->delete();

        return new PostResource(true, 'Kategori Deleted Successfully', null);
    }

    public function search(Request $request)
    {
        $keyword = $request->get('keyword');
        
        $kategoris = Kategori::where('name', 'LIKE', "%{$keyword}%")
            ->latest()
            ->paginate(10);

        return new PostResource(true, 'Search Results Kategori', $kategoris);
    }

    public function updateStatus($id)
    {
        $kategori = Kategori::find($id);

        if (!$kategori) {
            return new PostResource(false, 'Kategori Not Found', null);
        }

        $kategori->status = !$kategori->status;
        $kategori->save();

        return new PostResource(true, 'Kategori Status Updated Successfully', $kategori);
    }
}