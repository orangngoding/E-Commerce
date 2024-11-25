<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\CustomerUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerUserController extends Controller
{
    /**
     * Display a listing of customer users with pagination
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $status = $request->input('status');
        
        $query = CustomerUser::query()
            ->when($status, function($q) use ($status) {
                return $q->where('status', $status);
            })
            ->latest();
            
        $customers = $query->paginate($perPage);
        
        return new PostResource(true, 'List of customer users retrieved successfully', $customers);
    }

    /**
     * Search customer users
     */
    public function search(Request $request)
    {
        $search = $request->input('q');
        $perPage = $request->input('per_page', 10);
        
        $customers = CustomerUser::where('username', 'LIKE', "%{$search}%")
            ->orWhere('email', 'LIKE', "%{$search}%")
            ->latest()
            ->paginate($perPage);
            
        return new PostResource(true, 'Search results retrieved successfully', $customers);
    }

    /**
     * Display customer user details
     */
    public function show($id)
    {
        $customer = CustomerUser::findOrFail($id);
        return new PostResource(true, 'Customer user details retrieved successfully', $customer);
    }

    /**
     * Update customer user status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,inactive,suspended'
        ]);

        $customer = CustomerUser::findOrFail($id);
        
        DB::beginTransaction();
        try {
            $customer->update([
                'status' => $request->status
            ]);
            
            DB::commit();
            return new PostResource(true, 'Customer user status updated successfully', $customer);
        } catch (\Exception $e) {
            DB::rollBack();
            return new PostResource(false, 'Failed to update customer user status', null);
        }
    }

    /**
     * Soft delete customer user account
     */
    public function destroy($id)
    {
        $customer = CustomerUser::findOrFail($id);
        
        DB::beginTransaction();
        try {
            $customer->delete();
            
            DB::commit();
            return new PostResource(true, 'Customer user account deleted successfully', null);
        } catch (\Exception $e) {
            DB::rollBack();
            return new PostResource(false, 'Failed to delete customer user account', null);
        }
    }

    /**
     * Get customer statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => CustomerUser::count(),
            'active' => CustomerUser::where('status', 'active')->count(),
            'inactive' => CustomerUser::where('status', 'inactive')->count(),
            'suspended' => CustomerUser::where('status', 'suspended')->count(),
            'recent_registrations' => CustomerUser::whereBetween('created_at', [now()->subDays(30), now()])->count()
        ];
        
        return new PostResource(true, 'Customer statistics retrieved successfully', $stats);
    }
}
