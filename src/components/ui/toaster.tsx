// "use client"

// import {
//   Toast,
//   Portal,
//   Spinner,
//   Stack,
//   useToast,
//   ToastId,
//   UseToastOptions
// } from "@chakra-ui/react"

// // Create a custom toaster function
// export const toaster = {
//   toast: null as any,
//   init(toast: any) {
//     this.toast = toast;
//   },
//   success(options: UseToastOptions) {
//     return this.toast({
//       status: "success",
//       ...options
//     });
//   },
//   error(options: UseToastOptions) {
//     return this.toast({
//       status: "error",
//       ...options
//     });
//   },
//   info(options: UseToastOptions) {
//     return this.toast({
//       status: "info",
//       ...options
//     });
//   },
//   warning(options: UseToastOptions) {
//     return this.toast({
//       status: "warning",
//       ...options
//     });
//   },
//   loading(options: UseToastOptions): ToastId {
//     return this.toast({
//       status: "loading",
//       ...options
//     });
//   },
//   close(id: ToastId) {
//     this.toast.close(id);
//   }
// };

// export const Toaster = () => {
//   const toast = useToast();

//   // Initialize the toaster with the toast function
//   React.useEffect(() => {
//     toaster.init(toast);
//   }, [toast]);

//   // No need to render anything as Chakra handles toasts internally
//   return null;
// }
