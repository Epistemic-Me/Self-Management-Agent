export const useToast = () => ({
  toast: jest.fn(),
  dismiss: jest.fn(),
  toasts: [],
});

export const toast = jest.fn();