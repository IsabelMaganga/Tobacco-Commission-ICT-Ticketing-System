'use client';

import Link from 'next/link';

export default function RegisterPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
				<h1 className="text-2xl font-bold text-green-800">Account access</h1>
				<p className="mt-3 text-sm text-gray-600">
					Accounts are created by the ICT administrator. Contact ICT@tc.mw to request access.
				</p>
				<Link href="/login" className="mt-6 inline-block rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900">
					Back to sign in
				</Link>
			</div>
		</div>
	);
}
