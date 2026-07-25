import { RouterProvider } from "react-router"
import { router } from "./utils/routes"


const App = () => {
  return (
    <div>
      <RouterProvider
        router={router}
      ></RouterProvider>

    </div>
  )
}

export default App