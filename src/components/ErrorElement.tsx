import { isRouteErrorResponse, useRouteError } from "react-router";
import { AxiosError } from "axios";
import { AnimatedText } from "./ui/AnimatedError";
// import AnimatedText from "./AnimateText";

const ErrorElement = () => {
    const error = useRouteError();

    console.error(error);

    let errorMsg = "Something went wrong.";

    if (isRouteErrorResponse(error)) {
        errorMsg =
            typeof error.data === "string"
                ? error.data
                : error.data?.message || error.statusText;
    } else if (error instanceof AxiosError) {
        errorMsg =
            error.response?.data?.message ||
            error.response?.data ||
            error.message;
    } else if (error instanceof Error) {
        errorMsg = error.message;
    }
    console.log(errorMsg)
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <AnimatedText
                className="text-center text-3xl font-semibold text-red-500"
                text={errorMsg}
            />
        </div>
    );
};

export default ErrorElement;