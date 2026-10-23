<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'department'])
            ->when($request->filled('role'), fn ($query) => $query->where('role', $request->string('role')))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $users]);
    }
}