export default function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
    );
}