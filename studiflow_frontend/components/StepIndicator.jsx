// components/StepIndicator.jsx
import React from 'react';

const StepIndicator = ({ currentStep, totalSteps }) => {
    return (
        <div className="flex items-center justify-between mb-8 relative">
            {[...Array(totalSteps)].map((_, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${index + 1 <= currentStep ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {index + 1}
                            </div>
                            <span className="text-xs mt-1 absolute top-full left-1/2 transform -translate-x-1/2 whitespace-nowrap">Step {index + 1}</span>
                        </div>
                    </div>
                    {index < totalSteps - 1 && (
                        <div
                            id="line"
                            className={`flex-grow h-1 ${index + 1 < currentStep ? 'bg-emerald-600' : 'bg-gray-200'
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default StepIndicator;