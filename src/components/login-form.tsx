import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useGoogleLogin } from "@react-oauth/google";
import { Form, redirect, useActionData, useLoaderData, useNavigate, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router"
import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import { AnimateError } from "./ui/AnimatedError"
import useError from "@/utils/useError"
import { useState } from "react"


export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const from = data.from as string | null;
  console.log(data)
  try {
    await customFetch.post("/auth/login", data);

    if (from) {
      return redirect(from);
    }

    return redirect("/dashboard");
  } catch (err) {
    if (isAxiosError(err)) {
      return err.response?.data?.msg ?? err.response?.data ?? null;
    }

    return err instanceof Error ? err.message : "Something went wrong";
  }
};
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries([
    ...new URL(request.url).searchParams.entries(),
  ]);
  return (params?.message || null)
}
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [err, setErr] = useState<any>()
  const login = useGoogleLogin({
    flow: "auth-code", // Recommended for backend authentication
    onSuccess: async (codeResponse) => {  
      try {
        const reponse = await customFetch.post("/auth/login/google", {
          code: codeResponse.code
        });
        console.log(reponse)
        navigate("/")
      } catch (err) {
        if (isAxiosError(err)) {

          setErr(err.response?.data?.msg || err.response?.data || "something went wrong try again")
          setTimeout(() => { setErr('') }, 5000)
        }
        console.log("err: ", err)
        // return redirect("/")
      }
      // console.log(codeResponse);

      // Send the authorization code to your backend
      // await axios.post("/api/v1/auth/google", {
      //   code: codeResponse.code,
      // });
    },
    onError: () => {
      console.log("Google Login Failed");
    },
  });
  const errorMessageLoader = useLoaderData();
  const errorMessage = useActionData();
  const errorMsg = useError([errorMessage,
    errorMessageLoader, err],)
  return (
    <div className={cn("flex flex-col gap-6 max-w-96", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method='post'
          >
            <FieldGroup className="">
              <Field>

                <Button variant="outline" type="button" onClick={() => login()}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  name="email"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" name="password" required />
              </Field>
              <AnimateError
                className=""
                duration={0.3}
                errorMessage={errorMsg}
              />
              <Field>
                <Button type="submit">Login</Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="#">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
