export default function Page404() {
	return (
		<div className="flex flex-col items-center justify-center w-screen h-[100svh] shadow-sm">
			<div className="flex flex-col items-center justify-center">
				<h1 className="text-6xl font-bold">404</h1>
				<p className="text-gray-500 text-xl pt-2">
					We couldn't find the page you were looking for.
				</p>
			</div>
		</div>
	);
}
