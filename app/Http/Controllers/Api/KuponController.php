<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Kupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class KuponController extends Controller
{
    public function index(Request $request)
    {
    $sort = $request->get('sort', 'desc');
    $sortBy = $request->get('sort_by', 'created_at');
    $status = $request->get('status');
    $discountType = $request->get('discount_type'); // Add this line
    
    $query = Kupon::query();
    
    // Add status filter
    if ($status !== 'all' && $status !== null) {
        $query->where('is_active', $status === '1');
    }
    
    // Add discount type filter
    if ($discountType !== 'all' && $discountType !== null) {
        $query->where('discount_type', $discountType);
    }
    
    $kupons = $query->orderBy($sortBy, $sort)->paginate(10);
    
    return new PostResource(true, 'List Data Kupon', $kupons);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|unique:kupons,code',
            'discount_amount' => 'required|numeric|min:0',
            'discount_type' => 'required|in:nominal,percent',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'max_usage' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation Error', $validator->errors());
        }

        // Additional validation for percentage discount
        if ($request->discount_type === 'percent' && $request->discount_amount > 100) {
            return new PostResource(false, 'Validation Error', [
                'discount_amount' => ['Percentage discount cannot exceed 100%']
            ]);
        }

        $kupon = Kupon::create([
            'code' => strtoupper($request->code),
            'discount_amount' => $request->discount_amount,
            'discount_type' => $request->discount_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => true,
            'max_usage' => $request->max_usage,
            'current_usage' => 0,
        ]);

        return new PostResource(true, 'Kupon Berhasil Ditambahkan', $kupon);
    }


    public function show($id)
    {
        $kupon = Kupon::find($id);
        
        if (!$kupon) {
            return new PostResource(false, 'Kupon Tidak Ditemukan', null);
        }

        return new PostResource(true, 'Detail Kupon', $kupon);
    }

    public function update(Request $request, $id)
    {
        $kupon = Kupon::find($id);

        if (!$kupon) {
            return new PostResource(false, 'Kupon Tidak Ditemukan', null);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|unique:kupons,code,' . $id,
            'discount_amount' => 'required|numeric|min:0',
            'discount_type' => 'required|in:nominal,percent',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'max_usage' => 'required|integer|min:' . $kupon->current_usage,
        ]);

        if ($validator->fails()) {
            return new PostResource(false, 'Validation Error', $validator->errors());
        }

        // Additional validation for percentage discount
        if ($request->discount_type === 'percent' && $request->discount_amount > 100) {
            return new PostResource(false, 'Validation Error', [
                'discount_amount' => ['Percentage discount cannot exceed 100%']
            ]);
        }

        $kupon->update([
            'code' => strtoupper($request->code),
            'discount_amount' => $request->discount_amount,
            'discount_type' => $request->discount_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'max_usage' => $request->max_usage,
        ]);

        return new PostResource(true, 'Kupon Berhasil Diupdate', $kupon);
    }


    public function destroy($id)
    {
        $kupon = Kupon::find($id);

        if (!$kupon) {
            return new PostResource(false, 'Kupon Tidak Ditemukan', null);
        }

        $kupon->delete();

        return new PostResource(true, 'Kupon Berhasil Dihapus', null);
    }

    public function updateStatus($id)
    {
        $kupon = Kupon::find($id);

        if (!$kupon) {
            return new PostResource(false, 'Kupon Tidak Ditemukan', null);
        }

        $kupon->update([
            'is_active' => !$kupon->is_active
        ]);

        return new PostResource(true, 'Status Kupon Berhasil Diupdate', $kupon);
    }

    public function search(Request $request)
    {
        $query = $request->get('q');
        
        $kupons = Kupon::where('code', 'LIKE', "%{$query}%")
            ->orWhere('discount_amount', 'LIKE', "%{$query}%")
            ->orWhere('discount_type', 'LIKE', "%{$query}%")
            ->latest()
            ->paginate(10);

        return new PostResource(true, 'Hasil Pencarian Kupon', $kupons);
    }

    public function getActiveKupons()
    {
        $now = now();
        $kupons = Kupon::where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->where(function($query) {
                $query->where('max_usage', 0)
                      ->orWhereRaw('current_usage < max_usage');
            })
            ->latest()
            ->get();

        return new PostResource(true, 'List Kupon Aktif', $kupons);
    }
}
