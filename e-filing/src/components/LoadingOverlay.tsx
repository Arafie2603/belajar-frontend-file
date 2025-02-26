
const LoadingOverlay = ({ isLoading = true }) => {
    return (
        <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
            isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                <p className="text-white mt-4">Memuat data...</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;