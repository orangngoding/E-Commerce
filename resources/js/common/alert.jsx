import React from 'react';
import { Transition } from '@headlessui/react';

const Alert = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    title, 
    message, 
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning' // warning, danger, info
  }) => {
    const typeStyles = {
      warning: 'bg-yellow-50 text-yellow-800',
      danger: 'bg-red-50 text-red-800',
      info: 'bg-blue-50 text-blue-800'
    };
  
    const buttonStyles = {
      warning: 'bg-yellow-600 hover:bg-yellow-700',
      danger: 'bg-red-600 hover:bg-red-700',
      info: 'bg-blue-600 hover:bg-blue-700'
    };

    const getConfirmText = () => {
        if (title.toLowerCase() === 'delete user') {
          return 'Delete';
        }
        if (title.toLowerCase() === 'error') {
          return 'OK';
        }
        return confirmText;
      };

  return (
    <Transition show={isOpen}>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
          </Transition.Child>

          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className={`${typeStyles[type]} px-4 py-3`}>
                <h3 className="text-lg font-medium">{title}</h3>
                <div className="mt-2">
                  <p className="text-sm">{message}</p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                    type="button"
                    onClick={onConfirm}
                    className={`inline-flex w-full justify-center rounded-md border border-transparent ${buttonStyles[type]} px-4 py-2 text-base font-medium text-white shadow-sm sm:ml-3 sm:w-auto sm:text-sm`}
                    >
                    {getConfirmText()}
                    </button>
                    <button
                    type="button"
                    onClick={onCancel}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                    {cancelText}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </div>
    </Transition>
  );
};

export default Alert;
