'use client';
import { useEffect, useState } from 'react';
import { AlertCircle, Check, Info, Loader2, X } from 'lucide-react';
import { getCurrentLocation } from '@/lib/actions/business/get-current-business';
import { Location } from '@/types/location/type';
import { dataRemovalRequest } from '@/lib/actions/emails/send';


export default function DataDeletionRequest() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    requestType: '',
    reason: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    requestType: '',
    reason: '',
    password: ''
  });
  const [location, setLocation] = useState<Location | undefined>(undefined);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const currentLocation = await getCurrentLocation();
        console.log('Current Location:', currentLocation?.email);
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    fetchLocation();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is being edited
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field as keyof typeof errors]: ''
      }));
    }
  };

  const validateStep = (currentStep: number) => {
    let isValid = true;
    const newErrors = { ...errors };

    if (currentStep === 1) {
      if (!formData.requestType) {
        newErrors.requestType = 'Please select a request type';
        isValid = false;
      }
    } else if (currentStep === 2) {
      if (formData.reason.length < 5) {
        newErrors.reason = 'Please provide a reason (min 5 characters)';
        isValid = false;
      }
    } else if (currentStep === 3) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (validateStep(3)) {
        setIsSubmitting(true);
        await dataRemovalRequest({ location: location! });
        setTimeout(() => {
          setIsSubmitting(false);
          setShowConfirmation(true);
        }, 1500);
    }
  };

  const resetForm = () => {
    setFormData({
      requestType: '',
      reason: '',
      password: ''
    });
    setErrors({
      requestType: '',
      reason: '',
      password: ''
    });
    setStep(1);
    setShowConfirmation(false);
  };

  if (showConfirmation) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md" role="alert" aria-live="polite">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-600" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Request Submitted</h2>
          <p className="text-gray-600 mt-2">
            Your request to {formData.requestType === 'delete' ? 'delete' : 'clear'} your data has been submitted for review.
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Review Period</p>
              <p>Your request will be reviewed within the next 7 days. You&apos;ll receive an email notification once the review is complete.</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Request Details:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li><span className="font-medium">Request Type:</span> {formData.requestType === 'delete' ? 'Delete Account Data' : 'Clear Account Records'}</li>
            <li><span className="font-medium">Reason:</span> {formData.reason}</li>
            <li><span className="font-medium">Request ID:</span> REQ-{Math.floor(100000 + Math.random() * 900000)}</li>
            <li><span className="font-medium">Submitted:</span> {new Date().toLocaleDateString()}</li>
          </ul>
        </div>
        
        <button
          onClick={resetForm}
          className="w-full mt-6 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          aria-label="Return to Account Settings"
        >
          Return to Account Settings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-[80px] bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Data Removal Request</h1>
        <p className="text-gray-600 mt-1">
          Request to remove or clear data associated with your account.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex mb-8" aria-hidden="true">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className={`flex-1 ${stepNumber !== 1 ? 'relative' : ''}`}>
            {stepNumber !== 1 && (
              <div className={`h-1 absolute top-3 w-full -left-1/2 ${step >= stepNumber ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
            )}
            <div 
              className={`w-8 h-8 rounded-full ${step >= stepNumber ? 'bg-emerald-500' : 'bg-gray-200'} text-white flex items-center justify-center mx-auto relative z-10`}
            >
              {step > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            <p className="text-xs text-center mt-1">
              {stepNumber === 1 ? 'Type' : stepNumber === 2 ? 'Reason' : 'Verify'}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} aria-live="polite">
        {step === 1 && (
          <div className="mb-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Select request type:
              </legend>
              
              {errors.requestType && (
                <div className="text-red-500 text-sm mb-2" role="alert">
                  {errors.requestType}
                </div>
              )}
              
              <div className="space-y-3">
                {/* Clear option */}
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition duration-200 ${
                    formData.requestType === 'clear' ? 'border-emerald-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('requestType', 'clear')}
                  role="radio"
                  aria-checked={formData.requestType === 'clear'}
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleInputChange('requestType', 'clear');
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      formData.requestType === 'clear' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                    }`}>
                      {formData.requestType === 'clear' && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-800">Clear Account Records</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Remove specific data while keeping your account active
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Delete option */}
                {/* <div 
                  className={`border rounded-lg p-4 cursor-pointer transition duration-200 ${
                    formData.requestType === 'delete' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('requestType', 'delete')}
                  role="radio"
                  aria-checked={formData.requestType === 'delete'}
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleInputChange('requestType', 'delete');
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      formData.requestType === 'delete' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                    }`}>
                      {formData.requestType === 'delete' && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-800">Delete Account Data</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Permanently delete all data associated with your account
                      </p>
                    </div>
                  </div>
                </div> */}
              </div>
            </fieldset>

            <div className="bg-amber-50 p-4 rounded-lg my-6">
              <div className="flex">
                <Info className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-amber-700">
                  All data removal requests are subject to a 7-day review period before being processed.
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.requestType}
                className={`py-2 px-4 font-medium rounded-md ${
                  formData.requestType
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                aria-label="Continue to next step"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Please provide a reason for your request:
            </label>
            
            {errors.reason && (
              <div className="text-red-500 text-sm mb-2" role="alert">
                {errors.reason}
              </div>
            )}
            
            <textarea
              id="reason"
              name="reason" 
              rows={4}
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className={`w-full px-3 py-2 border ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400`}
              placeholder="Tell us why you're requesting to remove your data..."
              aria-describedby="reason-hint reason-error"
              aria-invalid={!!errors.reason}
            ></textarea>
            
            <p id="reason-hint" className="text-xs text-gray-500 mt-1">
              This helps us understand your needs and improve our services.
              <span className="ml-1 text-gray-400">{formData.reason.length}/500 characters</span>
            </p>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Go back to previous step"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className={`py-2 px-4 font-medium rounded-md ${
                  formData.reason.length >= 5
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                aria-label="Continue to final step"
                disabled={formData.reason.length < 5}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mb-6">
            <div className="bg-red-50 p-4 rounded-lg mb-4" role="alert">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Important: This action cannot be undone</p>
                  <p>Please verify your identity by entering your password to continue.</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password:
              </label>
              
              {errors.password && (
                <div className="text-red-500 text-sm mb-2" role="alert" id="password-error">
                  {errors.password}
                </div>
              )}
              
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="Your account password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                {formData.password && (
                  <button 
                    type="button" 
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleInputChange('password', '')}
                    aria-label="Clear password"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Request Summary:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><span className="font-medium">Request Type:</span> {formData.requestType === 'delete' ? 'Delete Account Data' : 'Clear Account Records'}</li>
                <li><span className="font-medium">Reason:</span> {formData.reason}</li>
                <li><span className="font-medium">Review Period:</span> 7 working days</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Go back to previous step"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!formData.password || formData.password.length < 6 || isSubmitting}
                className={`py-2 px-4 font-medium rounded-md flex items-center ${
                  formData.password && formData.password.length >= 6 && !isSubmitting
                    ? formData.requestType === 'delete' 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                } transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  formData.requestType === 'delete' ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                }`}
                aria-live="polite"
                aria-busy={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}