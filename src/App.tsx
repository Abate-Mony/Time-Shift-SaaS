import { Toaster } from "react-hot-toast";

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

    <QueryClientProvider client={queryClient}>
              <RouterProvider
                router={router}
              ></RouterProvider>
            </QueryClientProvider>
        <Toaster />

    </div>
  )
}

export default App