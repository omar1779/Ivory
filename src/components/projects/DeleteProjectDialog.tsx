'use client';

import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Fragment, useRef, useState } from 'react';

export default function DeleteProjectDialog({
  open,
  onClose,
  onConfirm,
  projectName,
  isLoading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
  isLoading?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const cancelButtonRef = useRef(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error al eliminar el proyecto:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Ocurrió un error al intentar eliminar el proyecto.'
      );
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        initialFocus={cancelButtonRef}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/75 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon 
                      className="h-6 w-6 text-red-500" 
                      aria-hidden="true" 
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title 
                      as="h3" 
                      className="text-lg font-semibold leading-6 text-white"
                    >
                      Eliminar proyecto
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">
                        ¿Estás seguro de que deseas eliminar el proyecto <span className="font-medium text-white">{projectName}</span>? Esta acción no se puede deshacer.
                      </p>
                      {error && (
                        <div className="mt-2 text-sm text-red-400">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isLoading}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleConfirm}
                  >
                    {isLoading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-white/20 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                    ref={cancelButtonRef}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
