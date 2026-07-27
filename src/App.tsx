import { RouterProvider } from "react-router"
import { router } from "./utils/routes"
import axios from "axios";
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'  ;
import { queryClient } from "./lib/queryClient";
axios.defaults.withCredentials = true;

const App = () => {
 
  return (
    <div>
    <QueryClientProvider client={queryClient}>
              <RouterProvider
                router={router}
              ></RouterProvider>
            </QueryClientProvider>

    </div>
  )
}

export default App