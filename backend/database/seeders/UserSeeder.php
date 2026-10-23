<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@tc.mw'], [
            'name'       => 'System Admin',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
            'department' => 'ICT',
        ]);

        User::updateOrCreate(['email' => 'officer@tc.mw'], [
            'name'       => 'ICT Officer',
            'password'   => Hash::make('password'),
            'role'       => 'ict_officer',
            'department' => 'ICT',
        ]);

        User::updateOrCreate(['email' => 'staff@tc.mw'], [
            'name'       => 'Regular Staff',
            'password'   => Hash::make('password'),
            'role'       => 'staff',
            'department' => 'Finance',
        ]);
    }
}