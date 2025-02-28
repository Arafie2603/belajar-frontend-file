import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';

interface LoadingOverlayProps {
    isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
    if (!isLoading) return null;

    return <LoadingSkeleton />;
};

export default LoadingOverlay;