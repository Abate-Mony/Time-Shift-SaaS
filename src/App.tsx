import { Toaster } from "react-hot-toast";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  QueryClientProvider
} from '@tanstack/react-query';
import axios from "axios";
import { RouterProvider } from "react-router";
import { queryClient } from "./lib/queryClient";
import { router } from "./utils/routes";


axios.defaults.withCredentials = true;

const App = () => {
 
  return (
    <div>
      {/* <ScrollToTop */}

    <QueryClientProvider client={queryClient}>
       <ReactQueryDevtools initialIsOpen={false} position="left" buttonPosition="top-right" />
              <RouterProvider
                router={router}
              ></RouterProvider>
            </QueryClientProvider>
        <Toaster />

    </div>
  )
}

export default App