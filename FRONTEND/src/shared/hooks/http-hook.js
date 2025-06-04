import { useState, useCallback, useRef, useEffect } from "react";

export const useHttpClient = () =>{
    const [isLoading,setIsLoading]=useState(false);
    const [error,setError]=useState();

    const activeHttpsRequests = useRef([]);

    const sendRequest= useCallback (async (url,method='GET',body=null,headers={})=>{
        setIsLoading(true);
        const httpAbortCtrl = new AbortController();
        activeHttpsRequests.current.push(httpAbortCtrl);
        try{
            const response = await fetch(url,{
                method:method,
                body:body,
                headers:headers,
                signal: httpAbortCtrl.signal
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message);
            }
            return responseData;
        }catch(err){
            setError(err.message);
        }
        setIsLoading(false);
    },[]);

    const clearError=()=>{
        setError(null);
    };

    useEffect(()=>{
        return ()=>{
            activeHttpsRequests.current.forEach(abortCtrl=>abortCtrl.abortCtrl());
        };
    },[]);

    return {isLoading,error,sendRequest,clearError};
};