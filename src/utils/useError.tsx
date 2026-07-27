import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";

type optionsProps = {
    ms?: number | null;
};
const useError = (
    errors: (string | null | unknown)[],

    options: optionsProps = {
        ms: null,
    }
): any => {
    const ms = options.ms || 5000;
    const timerRef = useRef<any>(null);
    const navigation = useNavigation();
    const isPageIdle = navigation.state === "submitting";
    const [errMsg, setErrMsg] = useState<string | null | unknown>(null);
    useEffect(() => {
        if (errMsg) {
            setErrMsg(null);
            clearTimeout(timerRef.current!);
        } else {
            setErrMsg(null);
            if (isPageIdle) return;
            errors.forEach((err: string | null | unknown) => {
                if (err) {
                    setErrMsg(err);
                    return
                }

            });

            timerRef.current = setTimeout(() => {
                clearTimeout(timerRef.current);
                setErrMsg(null);
            }, ms);
        }

        return () => {
            clearTimeout(timerRef.current);
        };
    }, [...errors.map((err) => err), isPageIdle]);
    return errMsg;
};
export default useError;
