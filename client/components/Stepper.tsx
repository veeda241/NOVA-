import React, { useState, ReactNode, Children } from 'react';
import { Check } from 'lucide-react';
import './Stepper.css';

interface StepProps {
  children: ReactNode;
}

export const Step: React.FC<StepProps> = ({ children }) => {
  return <div className="step-default">{children}</div>;
};

interface StepperProps {
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  children: ReactNode;
}

export const Stepper: React.FC<StepperProps> = ({
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = "Back",
  nextButtonText = "Next",
  children
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const steps = Children.toArray(children);
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      onFinalStepCompleted?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking previous steps or the current step
    // if (stepIndex + 1 <= currentStep) {
    //   const newStep = stepIndex + 1;
    //   setCurrentStep(newStep);
    //   onStepChange?.(newStep);
    // }
  };

  return (
    <div className="outer-container">
      <div className="step-circle-container">
        
        {/* Indicators */}
        <div className="step-indicator-row">
          {steps.map((_, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <React.Fragment key={index}>
                <div 
                  className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleStepClick(index)}
                >
                  <div className="step-indicator-inner">
                    {isCompleted ? (
                      <Check className="check-icon" />
                    ) : (
                      <span className="step-number">{stepNum}</span>
                    )}
                  </div>
                </div>
                
                {/* Connector line (except after last step) */}
                {index < totalSteps - 1 && (
                  <div className="step-connector">
                    <div 
                      className="step-connector-inner" 
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="step-content-default">
          {steps[currentStep - 1]}
        </div>

        {/* Footer / Buttons */}
        <div className="footer-container">
          <div className={`footer-nav ${currentStep === 1 ? 'end' : 'spread'}`}>
            
            <button 
              className={`back-button ${currentStep === 1 ? 'inactive' : ''}`}
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              {backButtonText}
            </button>

            <button 
              className="next-button"
              onClick={handleNext}
            >
              {currentStep === totalSteps ? 'Finish' : nextButtonText}
            </button>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default Stepper;
